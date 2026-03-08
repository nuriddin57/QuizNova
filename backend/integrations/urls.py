from django.urls import path

from .views import (
    UniversityCallbackView,
    UniversityLoginView,
    UniversityStatusView,
    UniversitySyncStudentsView,
    UniversitySyncSubjectsView,
    UniversitySyncTeachersView,
)

urlpatterns = [
    path('university/login/', UniversityLoginView.as_view(), name='university-login'),
    path('university/callback/', UniversityCallbackView.as_view(), name='university-callback'),
    path('university/status/', UniversityStatusView.as_view(), name='university-status'),
    path('university/sync/students/', UniversitySyncStudentsView.as_view(), name='university-sync-students'),
    path('university/sync/teachers/', UniversitySyncTeachersView.as_view(), name='university-sync-teachers'),
    path('university/sync/subjects/', UniversitySyncSubjectsView.as_view(), name='university-sync-subjects'),
]
