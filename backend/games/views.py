import os

from django.db import transaction
from django.db.models import Avg, Count, Max, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from quizzes.models import Choice, Question, Quiz
from users.permissions import IsStudent, IsTeacher

from .models import Attempt, AttemptAnswer, GameSession, Player
from .serializers import AttemptSerializer, GameSessionSerializer


def _ensure_teacher_host(user):
    if not user or not user.is_authenticated:
        raise PermissionDenied('Authentication required to host games.')
    is_admin = bool(getattr(user, 'is_admin', lambda: False)())
    if not user.is_teacher() and not user.is_staff and not is_admin:
        raise PermissionDenied('Teacher auth required for hosting.')


def _get_client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _limit_one_ip_enabled():
    return os.getenv('GAME_LIMIT_ONE_IP', '0').strip().lower() in {'1', 'true', 'yes', 'on'}


def _max_players_per_ip():
    raw = os.getenv('GAME_MAX_PLAYERS_PER_IP', '1')
    try:
        return max(1, int(raw))
    except (TypeError, ValueError):
        return 1


def _can_view_all_attempts(user, quiz):
    return bool(
        getattr(user, 'is_staff', False)
        or (hasattr(user, 'is_teacher') and user.is_teacher())
        or (hasattr(user, 'is_admin') and user.is_admin())
        or quiz.owner_id == getattr(user, 'id', None)
    )


def _player_payload(player):
    return {
        'player_id': player.id,
        'name': player.name,
        'avatar': player.avatar,
        'code': player.session.code,
        'session_id': player.session_id,
        'reconnect_token': player.reconnect_token,
        'client_id': player.client_id,
    }


class GameSessionViewSet(viewsets.ModelViewSet):
    queryset = GameSession.objects.all().order_by('-created_at')
    serializer_class = GameSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in {'create'}:
            return [permissions.IsAuthenticated(), IsTeacher()]
        if self.action in {'join', 'join_by_code'}:
            return [permissions.IsAuthenticated(), IsStudent()]
        return [permissions.IsAuthenticated()]

    def get_throttles(self):
        if self.action in {'join', 'join_by_code'}:
            throttle = ScopedRateThrottle()
            throttle.scope = 'join'
            return [throttle]
        return super().get_throttles()

    def perform_create(self, serializer):
        user = self.request.user
        _ensure_teacher_host(user)
        serializer.save(host=user)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        session = self.get_object()
        return self._join_session(request, session)

    @action(detail=False, methods=['post'], url_path='join-by-code')
    def join_by_code(self, request):
        code = str(request.data.get('code', '')).strip()
        if not code:
            return Response({'detail': 'code is required'}, status=400)
        session = GameSession.objects.filter(code=code).first()
        if not session:
            return Response({'detail': 'Invalid or expired game code.'}, status=404)
        return self._join_session(request, session)

    def _join_session(self, request, session):
        raw_name = request.data.get('name') or 'Anonymous'
        name = str(raw_name).strip()[:100] or 'Anonymous'
        avatar = str(request.data.get('avatar') or 'avatar-1').strip()[:32] or 'avatar-1'
        reconnect_token = str(request.data.get('reconnect_token') or '').strip()[:64]
        client_id = str(request.data.get('client_id') or '').strip()[:64]
        join_ip = _get_client_ip(request)
        now = timezone.now()

        player_user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None
        base_qs = Player.objects.filter(session=session)

        if reconnect_token:
            reconnect_player = base_qs.filter(reconnect_token=reconnect_token).first()
            if reconnect_player:
                updates = []
                if reconnect_player.name != name:
                    reconnect_player.name = name
                    updates.append('name')
                if reconnect_player.avatar != avatar:
                    reconnect_player.avatar = avatar
                    updates.append('avatar')
                if client_id and reconnect_player.client_id != client_id:
                    reconnect_player.client_id = client_id
                    updates.append('client_id')
                if join_ip and reconnect_player.join_ip != join_ip:
                    reconnect_player.join_ip = join_ip
                    updates.append('join_ip')
                reconnect_player.last_seen_at = now
                updates.append('last_seen_at')
                reconnect_player.save(update_fields=updates)
                return Response(_player_payload(reconnect_player))

        if player_user:
            existing = base_qs.filter(user=player_user).first()
            if existing:
                updates = []
                if existing.name != name:
                    existing.name = name
                    updates.append('name')
                if existing.avatar != avatar:
                    existing.avatar = avatar
                    updates.append('avatar')
                if client_id and existing.client_id != client_id:
                    existing.client_id = client_id
                    updates.append('client_id')
                if join_ip and existing.join_ip != join_ip:
                    existing.join_ip = join_ip
                    updates.append('join_ip')
                existing.last_seen_at = now
                updates.append('last_seen_at')
                existing.save(update_fields=updates)
                return Response(_player_payload(existing))

        if client_id:
            existing = base_qs.filter(client_id=client_id).first()
            if existing:
                updates = []
                if existing.name != name:
                    existing.name = name
                    updates.append('name')
                if existing.avatar != avatar:
                    existing.avatar = avatar
                    updates.append('avatar')
                if join_ip and existing.join_ip != join_ip:
                    existing.join_ip = join_ip
                    updates.append('join_ip')
                existing.last_seen_at = now
                updates.append('last_seen_at')
                existing.save(update_fields=updates)
                return Response(_player_payload(existing))

        if _limit_one_ip_enabled() and join_ip:
            max_by_ip = _max_players_per_ip()
            joined_by_same_ip = base_qs.filter(join_ip=join_ip).count()
            if joined_by_same_ip >= max_by_ip:
                return Response(
                    {'detail': f'Maximum {max_by_ip} player(s) from one IP is allowed for this room.'},
                    status=429,
                )

        player = Player.objects.create(
            session=session,
            user=player_user,
            name=name,
            avatar=avatar,
            client_id=client_id,
            join_ip=join_ip,
        )
        return Response(_player_payload(player))


class StudentStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        user = request.user
        attempts = Attempt.objects.filter(user=user)
        total = attempts.count()
        avg_score = attempts.aggregate(avg=Avg('score'))['avg'] or 0
        highest = attempts.aggregate(max=Max('score'))['max'] or 0
        totals = attempts.aggregate(total_questions=Sum('total_questions'), correct=Sum('correct_answers'))
        total_q = totals.get('total_questions') or 0
        correct = totals.get('correct') or 0
        accuracy = (correct / total_q * 100.0) if total_q > 0 else 0.0

        q_stats = AttemptAnswer.objects.filter(attempt__user=user).values('question').annotate(
            attempts=Count('id'),
            correct=Sum('is_correct'),
            avg_time=Avg('time_taken'),
        )
        q_perf = []
        for item in q_stats:
            q = Question.objects.filter(id=item['question']).first()
            q_perf.append({
                'question_id': item['question'],
                'question_text': q.text[:120] if q else '',
                'attempts': item['attempts'],
                'correct': item['correct'] or 0,
                'accuracy': (item['correct'] or 0) / item['attempts'] * 100.0 if item['attempts'] > 0 else 0.0,
                'average_time': item['avg_time'] or 0,
            })

        return Response({
            'total_attempts': total,
            'average_score': avg_score,
            'highest_score': highest,
            'accuracy': accuracy,
            'question_performance': q_perf,
        })


class QuizLeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, id=quiz_id)
        user = request.user
        can_view_all = _can_view_all_attempts(user, quiz)
        attempts_qs = (
            Attempt.objects
            .filter(quiz_id=quiz_id)
            .select_related('user', 'quiz', 'player')
            .prefetch_related('answers__question', 'answers__selected_choice')
            .order_by('-score', '-finished_at', '-id')
        )
        if not can_view_all:
            attempts_qs = attempts_qs.filter(user=user)
        data = AttemptSerializer(attempts_qs[:200], many=True).data
        return Response({'leaderboard': data, 'can_view_all': can_view_all})


class SubmitQuizAttemptView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def post(self, request, quiz_id):
        quiz = get_object_or_404(
            Quiz.objects.prefetch_related('questions__choices'),
            id=quiz_id,
        )

        submitted_answers = request.data.get('answers')
        if not isinstance(submitted_answers, list):
            return Response({'detail': 'answers must be a list.'}, status=400)

        submitted_map = {}
        for item in submitted_answers:
            if not isinstance(item, dict):
                return Response({'detail': 'Invalid answer payload.'}, status=400)
            try:
                question_id = int(item.get('question_id'))
                choice_id = int(item.get('choice_id'))
            except (TypeError, ValueError):
                return Response({'detail': 'question_id and choice_id must be integers.'}, status=400)
            submitted_map[question_id] = choice_id

        questions = list(quiz.questions.all())
        choices_by_id = {
            choice.id: choice
            for question in questions
            for choice in question.choices.all()
        }
        question_ids = {question.id for question in questions}

        for question_id, choice_id in submitted_map.items():
            if question_id not in question_ids:
                return Response({'detail': f'Question {question_id} is not part of this quiz.'}, status=400)
            selected_choice = choices_by_id.get(choice_id)
            if not selected_choice:
                return Response({'detail': f'Choice {choice_id} not found.'}, status=400)
            if selected_choice.question_id != question_id:
                return Response({'detail': f'Choice {choice_id} does not belong to question {question_id}.'}, status=400)

        total_questions = len(questions)
        correct_answers = 0
        wrong_answers = 0
        now = timezone.now()
        duration_taken = float(request.data.get('duration_taken') or 0.0)

        with transaction.atomic():
            attempt = Attempt.objects.create(
                user=request.user,
                quiz=quiz,
                score=0,
                started_at=now,
                finished_at=now,
                total_questions=total_questions,
                correct_answers=0,
                wrong_answers=0,
                percentage=0.0,
                duration_taken=max(0.0, duration_taken),
                pass_fail_status='pending',
            )

            attempt_answers = []
            for question in questions:
                selected_choice_id = submitted_map.get(question.id)
                selected_choice = choices_by_id.get(selected_choice_id)
                is_correct = bool(selected_choice and selected_choice.is_correct)
                if is_correct:
                    correct_answers += 1
                else:
                    wrong_answers += 1

                if selected_choice:
                    attempt_answers.append(
                        AttemptAnswer(
                            attempt=attempt,
                            question=question,
                            selected_choice=selected_choice,
                            is_correct=is_correct,
                            time_taken=0.0,
                        )
                    )

            if attempt_answers:
                AttemptAnswer.objects.bulk_create(attempt_answers)

            attempt.correct_answers = correct_answers
            attempt.wrong_answers = wrong_answers
            attempt.percentage = (correct_answers / total_questions * 100.0) if total_questions else 0.0
            if total_questions:
                mark_per_question = float(quiz.total_marks) / float(total_questions)
                attempt.score = int(round(correct_answers * mark_per_question))
            else:
                attempt.score = 0
            attempt.pass_fail_status = 'pass' if attempt.score >= int(quiz.passing_marks or 0) else 'fail'
            attempt.save(
                update_fields=[
                    'correct_answers',
                    'wrong_answers',
                    'percentage',
                    'score',
                    'pass_fail_status',
                    'duration_taken',
                ]
            )

        serialized = AttemptSerializer(attempt).data
        return Response({'attempt': serialized}, status=201)


class StudentPerformanceForQuizView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get(self, request, quiz_id, student_id):
        attempts = Attempt.objects.filter(quiz_id=quiz_id, user_id=student_id)
        data = AttemptSerializer(attempts, many=True).data
        return Response({'attempts': data})


class RoomCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'host_create'

    def post(self, request):
        serializer = GameSessionSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        _ensure_teacher_host(user)
        session = serializer.save(host=user)
        data = GameSessionSerializer(session, context={'request': request}).data
        return Response(data, status=201)


class RoomJoinView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'join'

    def post(self, request):
        code = str(request.data.get('code', '')).strip()
        if not code:
            return Response({'detail': 'code is required'}, status=400)
        session = GameSession.objects.filter(code=code).first()
        if not session:
            return Response({'detail': 'Invalid or expired game code.'}, status=404)
        viewset = GameSessionViewSet()
        return viewset._join_session(request, session)


class GameStateDebugView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, game_id):
        session = GameSession.objects.filter(id=game_id).first()
        if not session:
            return Response({'detail': 'Game session not found.'}, status=404)
        questions = list(session.quiz.questions.all())
        idx = session.current_index
        total = len(questions)
        phase = 'lobby' if idx < 0 else 'finished' if idx >= total else 'question'
        current_question = None
        if 0 <= idx < total:
            q = questions[idx]
            current_question = {
                'id': q.id,
                'text': q.text,
                'timer': q.timer_seconds,
                'choices': [{'id': c.id, 'text': c.text} for c in q.choices.all()],
            }
        return Response({
            'id': session.id,
            'code': session.code,
            'mode': session.mode,
            'phase': phase,
            'current_index': idx,
            'total_questions': total,
            'question': current_question,
            'players': [
                {'id': p.id, 'name': p.name, 'avatar': p.avatar, 'score': p.score}
                for p in session.players.order_by('-score', 'joined_at')
            ],
        })


class HostGameHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get(self, request):
        user = request.user
        sessions = (
            GameSession.objects
            .filter(host=user)
            .select_related('quiz')
            .order_by('-created_at')[:100]
        )
        rows = []
        for session in sessions:
            attempts_qs = Attempt.objects.filter(session=session)
            rows.append({
                'session_id': session.id,
                'code': session.code,
                'quiz_id': session.quiz_id,
                'quiz_title': session.quiz.title,
                'created_at': session.created_at,
                'players_joined': session.players.count(),
                'attempts': attempts_qs.count(),
                'average_score': attempts_qs.aggregate(avg=Avg('score'))['avg'] or 0,
                'highest_score': attempts_qs.aggregate(max=Max('score'))['max'] or 0,
            })
        return Response({'history': rows})


class HostInsightsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get(self, request):
        user = request.user

        top_players_qs = (
            Attempt.objects
            .filter(session__host=user)
            .values('player__name', 'user__username')
            .annotate(total_score=Sum('score'), games=Count('id'))
            .order_by('-total_score', '-games')[:10]
        )
        top_players = []
        for row in top_players_qs:
            display_name = row.get('player__name') or row.get('user__username') or 'Guest'
            top_players.append({
                'name': display_name,
                'total_score': row['total_score'] or 0,
                'games': row['games'] or 0,
            })

        most_played_quiz_qs = (
            GameSession.objects
            .filter(host=user)
            .values('quiz_id', 'quiz__title')
            .annotate(play_count=Count('id'))
            .order_by('-play_count', 'quiz__title')[:10]
        )
        most_played_quiz = [
            {
                'quiz_id': row['quiz_id'],
                'quiz_title': row['quiz__title'],
                'play_count': row['play_count'] or 0,
            }
            for row in most_played_quiz_qs
        ]

        return Response({'top_players': top_players, 'most_played_quiz': most_played_quiz})


class GameReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, game_id):
        session = get_object_or_404(GameSession.objects.select_related('quiz', 'host'), id=game_id)
        user = request.user
        can_view = bool(
            session.host_id == getattr(user, 'id', None)
            or getattr(user, 'is_staff', False)
            or (hasattr(user, 'is_admin') and user.is_admin())
        )
        if not can_view:
            return Response({'detail': 'forbidden'}, status=403)

        attempts = Attempt.objects.filter(session=session).select_related('player', 'user')
        player_rows = []
        for attempt in attempts.order_by('-score', '-id'):
            display_name = (
                (attempt.player.name if attempt.player else '')
                or (attempt.user.username if attempt.user else '')
                or 'Guest'
            )
            player_rows.append({
                'attempt_id': attempt.id,
                'name': display_name,
                'score': attempt.score,
                'correct_answers': attempt.correct_answers,
                'total_questions': attempt.total_questions,
                'accuracy': attempt.accuracy(),
            })

        question_rows = (
            AttemptAnswer.objects
            .filter(attempt__session=session)
            .values('question_id', 'question__text')
            .annotate(
                total=Count('id'),
                correct=Sum('is_correct'),
                avg_time=Avg('time_taken'),
            )
            .order_by('question_id')
        )
        question_report = []
        for row in question_rows:
            total = row['total'] or 0
            correct = row['correct'] or 0
            accuracy = (correct / total * 100.0) if total else 0.0
            question_report.append({
                'question_id': row['question_id'],
                'question_text': row['question__text'],
                'attempts': total,
                'correct': correct,
                'accuracy': accuracy,
                'avg_time': row['avg_time'] or 0,
            })

        question_report_sorted = sorted(question_report, key=lambda item: (item['accuracy'], -item['attempts']))
        hardest_questions = question_report_sorted[:5]
        avg_accuracy = sum(item['accuracy'] for item in question_report) / len(question_report) if question_report else 0.0

        return Response({
            'session_id': session.id,
            'code': session.code,
            'quiz_id': session.quiz_id,
            'quiz_title': session.quiz.title,
            'players_count': attempts.count(),
            'average_accuracy': avg_accuracy,
            'players': player_rows,
            'questions': question_report,
            'hardest_questions': hardest_questions,
        })
