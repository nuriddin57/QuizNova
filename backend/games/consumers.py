from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.db import transaction
from django.utils import timezone
import time
from urllib.parse import parse_qs

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from quizzes.models import Choice

from .models import Attempt, AttemptAnswer, GameResponse, GameSession, Player


class GameConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.code = self.scope['url_route']['kwargs']['code']
        self.group_name = f'game_{self.code}'
        self.actor_user_id = self._resolve_actor_user_id()
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self._send_state()
        # A player may have joined via HTTP before opening WS; refresh the lobby for everyone.
        await self.channel_layer.group_send(self.group_name, {'type': 'broadcast_players'})

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        action = content.get('action')

        if action == 'state':
            await self._send_state()
            return

        if action == 'join':
            name = content.get('name', 'Anonymous')
            player = await database_sync_to_async(self._add_player)(name)
            if player:
                await self.send_json({'type': 'joined', 'player': {'id': player.id, 'name': player.name}})
            await self._broadcast_state()
            return

        if action == 'start':
            can_control = await database_sync_to_async(self._can_control_session)()
            if not can_control:
                await self.send_json({'type': 'error', 'detail': 'Only the host can control this game.'})
                return
            await database_sync_to_async(self._start_game)()
            await self._broadcast_state()
            return

        if action == 'next':
            can_control = await database_sync_to_async(self._can_control_session)()
            if not can_control:
                await self.send_json({'type': 'error', 'detail': 'Only the host can control this game.'})
                return
            await database_sync_to_async(self._advance_question)()
            await self._broadcast_state()
            return

        if action == 'answer':
            player_id = content.get('player_id')
            choice_id = content.get('choice_id')
            timestamp = content.get('ts', time.time())
            result = await database_sync_to_async(self._record_response)(player_id, choice_id, timestamp)
            if result is not None:
                await self.send_json({'type': 'answer_ack', **result})
            await self.channel_layer.group_send(self.group_name, {'type': 'broadcast_players'})
            return

        if action == 'end':
            can_control = await database_sync_to_async(self._can_control_session)()
            if not can_control:
                await self.send_json({'type': 'error', 'detail': 'Only the host can control this game.'})
                return
            outcome = await database_sync_to_async(self._finalize_attempts)()
            await self._broadcast_state()
            if outcome and 'leaderboard' in outcome:
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'leaderboard_update',
                        'quiz_id': outcome.get('quiz_id'),
                        'leaderboard': outcome.get('leaderboard'),
                    },
                )

    def _resolve_actor_user_id(self):
        scope_user = self.scope.get('user')
        if getattr(scope_user, 'is_authenticated', False):
            return getattr(scope_user, 'id', None)

        query_string = self.scope.get('query_string', b'')
        if isinstance(query_string, bytes):
            query_string = query_string.decode('utf-8', errors='ignore')
        params = parse_qs(query_string)
        raw_token = (params.get('token') or params.get('access_token') or [None])[0]
        if not raw_token:
            return None

        try:
            token = AccessToken(raw_token)
            return token.get('user_id')
        except TokenError:
            return None

    def _can_control_session(self):
        session = GameSession.objects.filter(code=self.code).only('host_id').first()
        if not session:
            return False
        try:
            return int(self.actor_user_id) == int(session.host_id)
        except (TypeError, ValueError):
            return False

    async def _send_state(self):
        await self.broadcast_players()
        await self.broadcast_question()

    async def _broadcast_state(self):
        await self.channel_layer.group_send(self.group_name, {'type': 'broadcast_players'})
        await self.channel_layer.group_send(self.group_name, {'type': 'broadcast_question'})

    def _add_player(self, name):
        try:
            session = GameSession.objects.get(code=self.code)
        except GameSession.DoesNotExist:
            return None
        return Player.objects.create(session=session, name=str(name).strip()[:100] or 'Anonymous')

    def _start_game(self):
        session = GameSession.objects.get(code=self.code)
        if session.current_index < 0:
            session.current_index = 0
            session.save(update_fields=['current_index'])

    def _advance_question(self):
        session = GameSession.objects.get(code=self.code)
        total = session.quiz.questions.count()
        if total == 0:
            session.current_index = -1
        elif session.current_index < 0:
            session.current_index = 0
        elif session.current_index + 1 < total:
            session.current_index += 1
        else:
            session.current_index = total
        session.save(update_fields=['current_index'])

    def _record_response(self, player_id, choice_id, ts):
        try:
            player = Player.objects.get(id=player_id)
            choice = Choice.objects.get(id=choice_id)
            question = choice.question
            session = player.session
        except Exception:
            return None

        if session.code != self.code:
            return None

        questions = list(session.quiz.questions.all())
        if session.current_index < 0 or session.current_index >= len(questions):
            return None
        current_question = questions[session.current_index]
        if question.id != current_question.id:
            return None

        time_taken = float(ts or 0)
        if time_taken > 100000:
            time_taken = 0.0

        previous_score = player.score or 0

        GameResponse.objects.update_or_create(
            session=session,
            player=player,
            question=question,
            defaults={
                'selected_choice': choice,
                'is_correct': choice.is_correct,
                'time_taken': time_taken,
            },
        )

        correct_count = GameResponse.objects.filter(session=session, player=player, is_correct=True).count()
        live_score = correct_count * 100
        if session.mode == 'rocket-rush':
            # Simple MVP mode mechanic: streak-like speed bonus represented as score ramp.
            live_score += max(0, correct_count - 1) * 25
        Player.objects.filter(id=player.id).update(score=live_score)

        return {
            'question_id': question.id,
            'correct': choice.is_correct,
            'points': max(0, live_score - previous_score),
            'mode': session.mode,
        }

    def _finalize_attempts(self):
        session = GameSession.objects.get(code=self.code)
        now = timezone.now()
        results = []

        with transaction.atomic():
            questions_count = session.quiz.questions.count()
            for player in session.players.all():
                if Attempt.objects.filter(session=session, player=player).exists():
                    continue

                responses = GameResponse.objects.filter(session=session, player=player)
                correct = responses.filter(is_correct=True).count()
                total = questions_count

                score = 0
                for r in responses:
                    if r.is_correct:
                        score += max(0, int(1000 - (r.time_taken * 10)))

                attempt = Attempt.objects.create(
                    user=player.user,
                    player=player,
                    session=session,
                    quiz=session.quiz,
                    score=score,
                    started_at=session.created_at,
                    finished_at=now,
                    total_questions=total,
                    correct_answers=correct,
                )

                answers_to_create = [
                    AttemptAnswer(
                        attempt=attempt,
                        question=r.question,
                        selected_choice=r.selected_choice,
                        is_correct=r.is_correct,
                        time_taken=r.time_taken,
                    )
                    for r in responses
                ]
                if answers_to_create:
                    AttemptAnswer.objects.bulk_create(answers_to_create)

                responses.delete()
                player.score = score
                player.save(update_fields=['score'])
                results.append({'player_id': player.id, 'score': score, 'correct': correct})

        leaderboard = []
        top_attempts = Attempt.objects.filter(quiz=session.quiz).order_by('-score')[:10]
        for a in top_attempts:
            try:
                pname = a.player.name if a.player else (a.user.username if a.user else None)
            except Exception:
                pname = None
            leaderboard.append({'player_id': a.player.id if a.player else None, 'name': pname, 'score': a.score})

        return {'results': results, 'quiz_id': session.quiz.id, 'leaderboard': leaderboard}

    async def broadcast_players(self, event=None):
        players = await database_sync_to_async(self._get_players)()
        await self.send_json({'type': 'players', 'players': players})

    async def broadcast_question(self, event=None):
        payload = await database_sync_to_async(self._get_current_question_payload)()
        await self.send_json({'type': 'question', **payload})

    async def leaderboard_update(self, event=None):
        await self.send_json({
            'type': 'leaderboard_update',
            'quiz_id': event.get('quiz_id'),
            'leaderboard': event.get('leaderboard', []),
        })

    def _get_players(self):
        session = GameSession.objects.get(code=self.code)
        return [{'id': p.id, 'name': p.name, 'score': p.score} for p in session.players.order_by('-score', 'joined_at')]

    def _get_current_question_payload(self):
        session = GameSession.objects.get(code=self.code)
        questions = list(session.quiz.questions.all())
        total = len(questions)
        idx = session.current_index

        if idx < 0:
            return {
                'question': None,
                'current_index': -1,
                'total_questions': total,
                'phase': 'lobby',
                'mode': session.mode,
                'server_time': timezone.now().timestamp(),
            }
        if idx >= total:
            return {
                'question': None,
                'current_index': idx,
                'total_questions': total,
                'phase': 'finished',
                'mode': session.mode,
                'server_time': timezone.now().timestamp(),
            }

        q = questions[idx]
        return {
            'question': {
                'id': q.id,
                'text': q.text,
                'timer': q.timer_seconds,
                'choices': [{'id': c.id, 'text': c.text} for c in q.choices.all()],
            },
            'current_index': idx,
            'total_questions': total,
            'phase': 'question',
            'mode': session.mode,
            'server_time': timezone.now().timestamp(),
        }
