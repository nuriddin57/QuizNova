from django.urls import path

from .views import (
    ParentLinkedStudentsView,
    ParentProgressView,
    StartExamView,
    StudentMyResultsView,
    StudentResultHistoryView,
    StudentSubjectPerformanceView,
    SubmitExamView,
    TeacherResultsView,
)

urlpatterns = [
    path('results/my-results', StudentMyResultsView.as_view(), name='student-my-results-no-slash'),
    path('results/my-results/', StudentMyResultsView.as_view(), name='student-my-results'),
    path('results/history', StudentResultHistoryView.as_view(), name='student-results-history-no-slash'),
    path('results/history/', StudentResultHistoryView.as_view(), name='student-results-history'),
    path('results/subject-performance', StudentSubjectPerformanceView.as_view(), name='student-subject-performance-no-slash'),
    path('results/subject-performance/', StudentSubjectPerformanceView.as_view(), name='student-subject-performance'),
    path('results/teacher', TeacherResultsView.as_view(), name='teacher-results-no-slash'),
    path('results/teacher/', TeacherResultsView.as_view(), name='teacher-results'),
    path('results/parent/children', ParentLinkedStudentsView.as_view(), name='parent-linked-students-no-slash'),
    path('results/parent/children/', ParentLinkedStudentsView.as_view(), name='parent-linked-students'),
    path('results/parent/progress', ParentProgressView.as_view(), name='parent-progress-no-slash'),
    path('results/parent/progress/', ParentProgressView.as_view(), name='parent-progress'),
    path('exams/<int:quiz_id>/start', StartExamView.as_view(), name='exam-start-no-slash'),
    path('exams/<int:quiz_id>/start/', StartExamView.as_view(), name='exam-start'),
    path('exams/<int:quiz_id>/submit', SubmitExamView.as_view(), name='exam-submit-no-slash'),
    path('exams/<int:quiz_id>/submit/', SubmitExamView.as_view(), name='exam-submit'),
]
