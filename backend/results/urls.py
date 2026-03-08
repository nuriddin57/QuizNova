from django.urls import path

from .views import (
    StartExamView,
    StudentResultHistoryView,
    StudentSubjectPerformanceView,
    SubmitExamView,
    TeacherResultsView,
)

urlpatterns = [
    path('results/history', StudentResultHistoryView.as_view(), name='student-results-history-no-slash'),
    path('results/history/', StudentResultHistoryView.as_view(), name='student-results-history'),
    path('results/subject-performance', StudentSubjectPerformanceView.as_view(), name='student-subject-performance-no-slash'),
    path('results/subject-performance/', StudentSubjectPerformanceView.as_view(), name='student-subject-performance'),
    path('results/teacher', TeacherResultsView.as_view(), name='teacher-results-no-slash'),
    path('results/teacher/', TeacherResultsView.as_view(), name='teacher-results'),
    path('exams/<int:quiz_id>/start', StartExamView.as_view(), name='exam-start-no-slash'),
    path('exams/<int:quiz_id>/start/', StartExamView.as_view(), name='exam-start'),
    path('exams/<int:quiz_id>/submit', SubmitExamView.as_view(), name='exam-submit-no-slash'),
    path('exams/<int:quiz_id>/submit/', SubmitExamView.as_view(), name='exam-submit'),
]
