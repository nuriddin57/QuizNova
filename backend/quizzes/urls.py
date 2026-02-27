from rest_framework.routers import DefaultRouter
from .views import QuizViewSet
from django.urls import path, include

router = DefaultRouter()
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'sets', QuizViewSet, basename='set')

urlpatterns = [
    path('', include(router.urls)),
]
