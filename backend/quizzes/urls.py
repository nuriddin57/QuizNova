from rest_framework.routers import DefaultRouter
from django.urls import path, include

from .views import QuestionBankViewSet, QuizViewSet

router = DefaultRouter()
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'sets', QuizViewSet, basename='set')
router.register(r'question-bank', QuestionBankViewSet, basename='question-bank')

urlpatterns = [
    path('', include(router.urls)),
]
