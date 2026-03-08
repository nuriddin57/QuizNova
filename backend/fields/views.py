from rest_framework import permissions
from rest_framework.generics import ListAPIView

from .models import Programme, StudyField
from .serializers import ProgrammeSerializer, StudyFieldSerializer


class ProgrammeListView(ListAPIView):
    serializer_class = ProgrammeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Programme.objects.filter(is_active=True).order_by('title')


class StudyFieldListView(ListAPIView):
    serializer_class = StudyFieldSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = StudyField.objects.select_related('programme').filter(is_active=True)
        programme_id = (self.request.query_params.get('programme_id') or '').strip()
        if programme_id:
            queryset = queryset.filter(programme_id=programme_id)
        return queryset.order_by('programme__title', 'name')
