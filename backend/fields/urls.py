from django.urls import path

from .views import ProgrammeListView, StudyFieldListView

urlpatterns = [
    path('programmes', ProgrammeListView.as_view(), name='programme-list-no-slash'),
    path('programmes/', ProgrammeListView.as_view(), name='programme-list'),
    path('fields', StudyFieldListView.as_view(), name='study-field-list-no-slash'),
    path('fields/', StudyFieldListView.as_view(), name='study-field-list'),
]
