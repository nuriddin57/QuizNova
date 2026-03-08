import time
import uuid
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from quizzes.models import Choice

from .models import Attempt, AttemptAnswer, GameResponse, GameSession, Player


class GameConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.code = self.scope['url_route']['kwargs']['code']
        self.group_name = f'game_{self.code}'
        self.query_params = self._parse_query_params()
        self.actor_user_id = self._resolve_actor_user_id()
        self.actor_player_id = self._safe_int(self.query_params.get('player_id'))
        self.actor_reconnect_token = str(self.query_params.get('reconnect_token') or '').strip()
        self.actor_client_id = str(self.query_params.get('client_id') or '').strip()

        if not self.actor_user_id:
            await self.close(code=4401)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await database_sync_to_async(self._touch_player_presence)()
        await self._send_state()
        # A player may have joined via HTTP before opening WS; refresh the lobby for everyone.
        await self.channel_layer.group_send(self.group_name, {'type': 'broadcast_players'})

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await database_sync_to_async(self._touch_player_presence)()

    async def receive_json(self, content):
        action = content.get('action')

        if action == 'state':
            await self._send_state()
            return

        if action == 'join':
            name = content.get('name', 'Anonymous')
            avatar = str(content.get('avatar') or 'avatar-1').strip()[:32] or 'avatar-1'
            client_id = str(content.get('client_id') or self.actor_client_id or '').strip()[:64]
            player = await database_sync_to_async(self._add_player)(name, avatar, client_id)
            if player:
                await self.send_json({
                    'type': 'joined',
                    'player': {
                        'id': player.id,
                        'name': player.name,
                        'avatar': player.avatar,
                        'reconnect_token': player.reconnect_token,
                        'client_id': player.client_id,
                    },
                })
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
            question_id = content.get('question_id')
            choice_id = content.get('choice_id')
            question_token = str(content.get('question_token') or '').strip()
            reconnect_token = str(content.get('reconnect_token') or self.actor_reconnect_token or '').strip()
            client_id = str(content.get('client_id') or self.actor_client_id or '').strip()
            timestamp = content.get('ts', time.time())
            result = await database_sync_to_async(self._record_response)(
                player_id,
                question_id,
                choice_id,
                timestamp,
                question_token,
                reconnect_token,
                client_id,
            )
            if result is not None:
                if result.get('error'):
                    await self.send_json({'type': 'error', 'detail': result['error']})
                else:
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

    def _safe_int(self, value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    def _parse_query_params(self):
        query_string = self.scope.get('query_string', b'')
        if isinstance(query_string, bytes):
            query_string = query_string.decode('utf-8', errors='ignore')
        parsed = parse_qs(query_string)
        return {key: values[0] if values else None for key, values in parsed.items()}

    def _resolve_actor_user_id(self):
        scope_user = self.scope.get('user')
        if getattr(scope_user, 'is_authenticated', False):
            return getattr(scope_user, 'id', None)

        raw_token = self.query_params.get('token') or self.query_params.get('access_token')
        if not raw_token:
            return None

        try:
            token = AccessToken(raw_token)
            return token.get('user_id')
        except TokenError:
            return None

    def _touch_player_presence(self):
        if not self.actor_player_id:
            return
        player = Player.objects.filter(id=self.actor_player_id, session__code=self.code).first()
        if not player:
            return
        if self.actor_reconnect_token and player.reconnect_token != self.actor_reconnect_token:
            return
        updates = ['last_seen_at']
        player.last_seen_at = timezone.now()
        if self.actor_client_id and player.client_id != self.actor_client_id:
            player.client_id = self.actor_client_id
            updates.append('client_id')
        player.save(update_fields=updates)

    def _get_actor_user(self):
        return get_user_model().objects.filter(id=self.actor_user_id).first()

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

    def _add_player(self, name, avatar, client_id):
        try:
            session = GameSession.objects.get(code=self.code)
        except GameSession.DoesNotExist:
            return None
        user = self._get_actor_user()
        if not user or not user.is_student():
            return None
        existing = Player.objects.filter(session=session, user=user).first()
        if existing:
            existing.name = str(name).strip()[:100] or existing.name or 'Anonymous'
            existing.avatar = avatar
            if client_id:
                existing.client_id = client_id
            existing.save(update_fields=['name', 'avatar', 'client_id', 'last_seen_at'])
            return existing
        return Player.objects.create(
            session=session,
            user=user,
            name=str(name).strip()[:100] or 'Anonymous',
            avatar=avatar,
            client_id=client_id,
        )

    def _roll_question_token(self):
        return uuid.uuid4().hex

    def _refresh_question_window(self, session):
        total = session.quiz.questions.count()
        if 0 <= session.current_index < total:
            session.current_question_started_at = timezone.now()
            session.current_question_token = self._roll_question_token()
        else:
            session.current_question_started_at = None
            session.current_question_token = ''
        session.save(update_fields=['current_index', 'current_question_started_at', 'current_question_token'])

    def _start_game(self):
        session = GameSession.objects.get(code=self.code)
        total = session.quiz.questions.count()
        if total == 0:
            session.current_index = -1
        elif session.current_index < 0:
            session.current_index = 0
        self._refresh_question_window(session)

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
        self._refresh_question_window(session)

    def _record_response(self, player_id, question_id, choice_id, ts, question_token, reconnect_token, client_id):
        try:
            player = Player.objects.select_related('session').get(id=player_id)
            choice = Choice.objects.select_related('question').get(id=choice_id)
            question = choice.question
            session = player.session
        except Exception:
            return None

        if session.code != self.code:
            return {'error': 'Player does not belong to this room.'}
        if self.actor_user_id and player.user_id and int(player.user_id) != int(self.actor_user_id):
            return {'error': 'You cannot submit answer for another player.'}

        if reconnect_token and player.reconnect_token != reconnect_token:
            return {'error': 'Reconnect token is invalid for this player.'}

        if player.client_id and client_id and player.client_id != client_id:
            return {'error': 'Client ID mismatch.'}

        questions = list(session.quiz.questions.all())
        if session.current_index < 0 or session.current_index >= len(questions):
            return {'error': 'Question is not active.'}
        current_question = questions[session.current_index]
        if question.id != current_question.id:
            return {'error': 'Answer does not match current question.'}

        submitted_question_id = self._safe_int(question_id)
        if submitted_question_id is None or submitted_question_id != current_question.id:
            return {'error': 'question_id is required and must match active question.'}

        if not question_token or question_token != (session.current_question_token or ''):
            return {'error': 'Invalid question token.'}

        if session.current_question_started_at is None:
            return {'error': 'Question timer has not started.'}

        elapsed = (timezone.now() - session.current_question_started_at).total_seconds()
        if elapsed < 0:
            elapsed = 0.0
        time_limit = float(current_question.timer_seconds or 0)
        if time_limit > 0 and elapsed > time_limit:
            return {'error': 'Answer rejected: time limit exceeded.'}

        if GameResponse.objects.filter(session=session, player=player, question=question).exists():
            return {'error': 'You already submitted an answer for this question.'}

        client_time = 0.0
        try:
            client_time = float(ts or 0)
        except (TypeError, ValueError):
            client_time = 0.0
        if client_time < 0 or client_time > 100000:
            client_time = 0.0

        # Never trust frontend timestamp. Keep the lower bound bounded by server elapsed.
        time_taken = min(max(0.0, elapsed), time_limit if time_limit > 0 else elapsed)
        if client_time > 0:
            time_taken = min(time_taken, client_time)

        previous_score = player.score or 0

        GameResponse.objects.create(
            session=session,
            player=player,
            question=question,
            selected_choice=choice,
            is_correct=choice.is_correct,
            time_taken=time_taken,
        )

        correct_count = GameResponse.objects.filter(session=session, player=player, is_correct=True).count()
        wrong_count = GameResponse.objects.filter(session=session, player=player, is_correct=False).count()
        live_score = correct_count * 100
        if session.mode == 'speed' and choice.is_correct:
            speed_bonus = max(0, int((time_limit - time_taken) * 8)) if time_limit > 0 else 0
            live_score += speed_bonus
        elif session.mode == 'battle' and choice.is_correct:
            live_score += 75
        elif session.mode == 'survival':
            live_score = max(0, (correct_count * 120) - (wrong_count * 30))
        elif session.mode == 'treasure' and choice.is_correct:
            live_score += 150
        elif session.mode == 'team':
            live_score += 50 if choice.is_correct else 0
        Player.objects.filter(id=player.id).update(score=live_score, last_seen_at=timezone.now())

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
                wrong = max(0, total - correct)

                score = 0
                for response in responses:
                    if response.is_correct:
                        score += max(0, int(1000 - (response.time_taken * 10)))

                percentage = (correct / total * 100.0) if total else 0.0
                total_marks = float(session.quiz.total_marks or 0.0)
                passing_marks = float(session.quiz.passing_marks or 0.0)
                passing_percentage = (passing_marks / total_marks * 100.0) if total_marks > 0 else 0.0
                pass_fail_status = 'pass' if percentage >= passing_percentage else 'fail'
                duration_taken = sum(float(response.time_taken or 0.0) for response in responses)

                attempt = Attempt.objects.create(
                    user=player.user,
                    player=player,
                    session=session,
                    quiz=session.quiz,
                    student_name_snapshot=(player.user.full_name if player.user else '') or (player.user.username if player.user else player.name),
                    student_id_snapshot=(player.user.student_id if player.user else '') or '',
                    field_of_study=(player.user.field_of_study if player.user else None),
                    field_name_snapshot=getattr(getattr(player.user, 'field_of_study', None), 'name', '') if player.user else '',
                    semester_code=(player.user.semester_code if player.user else '') or '',
                    semester_number=(player.user.semester_number if player.user else None),
                    section=(player.user.section if player.user else '') or '',
                    score=score,
                    started_at=session.created_at,
                    finished_at=now,
                    submitted_at=now,
                    total_questions=total,
                    correct_answers=correct,
                    wrong_answers=wrong,
                    percentage=percentage,
                    duration_taken=duration_taken,
                    pass_fail_status=pass_fail_status,
                )

                answers_to_create = [
                    AttemptAnswer(
                        attempt=attempt,
                        question=response.question,
                        selected_choice=response.selected_choice,
                        is_correct=response.is_correct,
                        time_taken=response.time_taken,
                    )
                    for response in responses
                ]
                if answers_to_create:
                    AttemptAnswer.objects.bulk_create(answers_to_create)

                responses.delete()
                player.score = score
                player.save(update_fields=['score'])
                results.append({'player_id': player.id, 'score': score, 'correct': correct})

            if session.is_active:
                session.is_active = False
                session.save(update_fields=['is_active'])
            session.quiz.play_count = (session.quiz.play_count or 0) + 1
            session.quiz.save(update_fields=['play_count'])

        leaderboard = []
        top_attempts = Attempt.objects.filter(quiz=session.quiz).order_by('-score', '-id')[:10]
        for attempt in top_attempts:
            try:
                pname = attempt.player.name if attempt.player else (attempt.user.username if attempt.user else None)
            except Exception:
                pname = None
            leaderboard.append({
                'player_id': attempt.player.id if attempt.player else None,
                'name': pname,
                'score': attempt.score,
            })

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
        return [
            {'id': player.id, 'name': player.name, 'avatar': player.avatar, 'score': player.score}
            for player in session.players.order_by('-score', 'joined_at')
        ]

    def _get_current_question_payload(self):
        session = GameSession.objects.get(code=self.code)
        questions = list(session.quiz.questions.all())
        total = len(questions)
        idx = session.current_index

        if idx < 0:
            return {
                'question': None,
                'question_token': '',
                'question_started_at': None,
                'current_index': -1,
                'total_questions': total,
                'phase': 'lobby',
                'mode': session.mode,
                'server_time': timezone.now().timestamp(),
            }
        if idx >= total:
            return {
                'question': None,
                'question_token': '',
                'question_started_at': None,
                'current_index': idx,
                'total_questions': total,
                'phase': 'finished',
                'mode': session.mode,
                'server_time': timezone.now().timestamp(),
            }

        question = questions[idx]
        question_started = session.current_question_started_at
        return {
            'question': {
                'id': question.id,
                'text': question.text,
                'timer': question.timer_seconds,
                'question_type': question.question_type,
                'image_url': question.image_url,
                'choices': [{'id': choice.id, 'text': choice.text} for choice in question.choices.all()],
            },
            'question_token': session.current_question_token or '',
            'question_started_at': question_started.timestamp() if question_started else None,
            'current_index': idx,
            'total_questions': total,
            'phase': 'question',
            'mode': session.mode,
            'server_time': timezone.now().timestamp(),
        }
