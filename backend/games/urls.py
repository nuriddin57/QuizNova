from rest_framework.routers import DefaultRouter
from .views import GameSessionViewSet
from django.urls import path, include
from .views import StudentStatsView, QuizLeaderboardView, StudentPerformanceForQuizView, RoomCreateView, RoomJoinView, GameStateDebugView

router = DefaultRouter()
router.register(r'sessions', GameSessionViewSet, basename='session')

urlpatterns = [
    path('', include(router.urls)),
    path('rooms/create', RoomCreateView.as_view()),
    path('rooms/join', RoomJoinView.as_view()),
    path('games/<int:game_id>/state', GameStateDebugView.as_view()),
    path('stats/me/', StudentStatsView.as_view()),
    path('quiz/<int:quiz_id>/leaderboard/', QuizLeaderboardView.as_view()),
    path('quiz/<int:quiz_id>/student/<int:student_id>/performance/', StudentPerformanceForQuizView.as_view()),
]
