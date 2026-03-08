from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ModuleViewSet, SubjectViewSet, TopicViewSet

router = DefaultRouter()
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'topics', TopicViewSet, basename='topic')
router.register(r'modules', ModuleViewSet, basename='module')

urlpatterns = [
    path('', include(router.urls)),
]
