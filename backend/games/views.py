from django.db.models import Avg, Max, Sum, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from quizzes.models import Question

from .models import Attempt, AttemptAnswer, GameSession, Player
from .serializers import AttemptSerializer, GameSessionSerializer


def _ensure_teacher_host(user):
    if not user or not user.is_authenticated:
        raise PermissionDenied('Authentication required to host games.')
    if not user.is_teacher() and not user.is_staff:
        raise PermissionDenied('Teacher auth required for hosting.')


class GameSessionViewSet(viewsets.ModelViewSet):
    queryset = GameSession.objects.all().order_by('-created_at')
    serializer_class = GameSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in {'join', 'join_by_code'}:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

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

        player_user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None

        # Reuse existing player for logged-in users in the same session to avoid duplicates on refresh/rejoin.
        if player_user:
            existing = Player.objects.filter(session=session, user=player_user).first()
            if existing:
                return Response({'player_id': existing.id, 'name': existing.name, 'code': session.code, 'session_id': session.id})

        player = Player.objects.create(session=session, user=player_user, name=name)
        return Response({'player_id': player.id, 'name': player.name, 'code': session.code, 'session_id': session.id})


class StudentStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

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
            attempts=Count('id'), correct=Sum('is_correct')
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
        attempts = Attempt.objects.filter(quiz_id=quiz_id).order_by('-score')[:20]
        data = AttemptSerializer(attempts, many=True).data
        return Response({'leaderboard': data})


class StudentPerformanceForQuizView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, quiz_id, student_id):
        if not request.user.is_teacher() and not request.user.is_staff:
            return Response({'detail': 'forbidden'}, status=403)
        attempts = Attempt.objects.filter(quiz_id=quiz_id, user_id=student_id)
        data = AttemptSerializer(attempts, many=True).data
        return Response({'attempts': data})


class RoomCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = GameSessionSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        _ensure_teacher_host(user)
        session = serializer.save(host=user)
        data = GameSessionSerializer(session, context={'request': request}).data
        return Response(data, status=201)


class RoomJoinView(APIView):
    permission_classes = [permissions.AllowAny]

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
            'players': [{'id': p.id, 'name': p.name, 'score': p.score} for p in session.players.order_by('-score', 'joined_at')],
        })
