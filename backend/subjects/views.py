from django.db.models import Count
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from quizzes.models import Quiz
from users.permissions import IsTeacher

from .models import Module, Subject, Topic
from .serializers import ModuleSerializer, RelatedQuizSerializer, SubjectSerializer, TopicSerializer


class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer

    def get_queryset(self):
        qs = Subject.objects.select_related('field_of_study', 'programme').prefetch_related('topics__modules').annotate(
            topic_count=Count('topics', distinct=True),
            module_count=Count('topics__modules', distinct=True),
        )
        programme_id = (self.request.query_params.get('programme_id') or '').strip()
        field_id = (self.request.query_params.get('field') or self.request.query_params.get('field_id') or '').strip()
        semester = (self.request.query_params.get('semester') or '').strip()
        semester_code = (self.request.query_params.get('semester_code') or '').strip()
        active = (self.request.query_params.get('is_active') or '').strip().lower()

        if programme_id:
            qs = qs.filter(programme_id=programme_id)
        if field_id:
            qs = qs.filter(field_of_study_id=field_id)
        if semester:
            qs = qs.filter(semester=semester)
        if semester_code:
            qs = qs.filter(semester_code=semester_code)
        if active in {'1', 'true', 'yes'}:
            qs = qs.filter(is_active=True)
        elif active in {'0', 'false', 'no'}:
            qs = qs.filter(is_active=False)

        user = self.request.user
        if not (user.is_teacher() or user.is_admin() or user.is_staff):
            qs = qs.filter(is_active=True)
            if user.is_student() and getattr(user, 'field_of_study_id', None):
                qs = qs.filter(field_of_study_id=user.field_of_study_id)
            if user.is_student() and getattr(user, 'semester_number', None):
                qs = qs.filter(semester=user.semester_number)
        return qs.order_by('field_of_study__name', 'semester', 'code')

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated, IsTeacher]
        return [perm() for perm in permission_classes]

    @action(detail=True, methods=['get'], url_path='quizzes')
    def quizzes(self, request, pk=None):
        subject = self.get_object()
        quizzes = (
            Quiz.objects.filter(subject_ref=subject)
            .select_related('subject_ref', 'topic_ref', 'module_ref')
            .order_by('-created_at')
        )
        return Response({'results': RelatedQuizSerializer(quizzes, many=True).data})


class TopicViewSet(viewsets.ModelViewSet):
    serializer_class = TopicSerializer

    def get_queryset(self):
        qs = Topic.objects.select_related('subject', 'subject__field_of_study').prefetch_related('modules').annotate(
            module_count=Count('modules', distinct=True)
        )
        subject_id = (self.request.query_params.get('subject') or self.request.query_params.get('subject_id') or '').strip()
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        user = self.request.user
        if not (user.is_teacher() or user.is_admin() or user.is_staff):
            qs = qs.filter(is_active=True, subject__is_active=True)
            if user.is_student() and getattr(user, 'field_of_study_id', None):
                qs = qs.filter(subject__field_of_study_id=user.field_of_study_id)
        return qs.order_by('subject__code', 'unit_name', 'name')

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated, IsTeacher]
        return [perm() for perm in permission_classes]

    @action(detail=True, methods=['get'], url_path='quizzes')
    def quizzes(self, request, pk=None):
        topic = self.get_object()
        quizzes = (
            Quiz.objects.filter(topic_ref=topic)
            .select_related('subject_ref', 'topic_ref', 'module_ref')
            .order_by('-created_at')
        )
        return Response({'results': RelatedQuizSerializer(quizzes, many=True).data})


class ModuleViewSet(viewsets.ModelViewSet):
    serializer_class = ModuleSerializer

    def get_queryset(self):
        qs = Module.objects.select_related('topic', 'topic__subject', 'topic__subject__field_of_study')
        topic_id = (self.request.query_params.get('topic') or self.request.query_params.get('topic_id') or '').strip()
        subject_id = (self.request.query_params.get('subject') or self.request.query_params.get('subject_id') or '').strip()
        if topic_id:
            qs = qs.filter(topic_id=topic_id)
        if subject_id:
            qs = qs.filter(topic__subject_id=subject_id)

        user = self.request.user
        if not (user.is_teacher() or user.is_admin() or user.is_staff):
            qs = qs.filter(is_active=True, topic__is_active=True, topic__subject__is_active=True)
            if user.is_student() and getattr(user, 'field_of_study_id', None):
                qs = qs.filter(topic__subject__field_of_study_id=user.field_of_study_id)
        return qs.order_by('topic__subject__code', 'topic__name', 'order', 'title')

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated, IsTeacher]
        return [perm() for perm in permission_classes]

    @action(detail=True, methods=['get'], url_path='quizzes')
    def quizzes(self, request, pk=None):
        module = self.get_object()
        quizzes = (
            Quiz.objects.filter(module_ref=module)
            .select_related('subject_ref', 'topic_ref', 'module_ref')
            .order_by('-created_at')
        )
        return Response({'results': RelatedQuizSerializer(quizzes, many=True).data})
