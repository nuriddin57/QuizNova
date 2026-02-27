from django.db.models import Count
from rest_framework import viewsets, permissions
from .models import Quiz
from .serializers import QuizSerializer


class IsTeacherOrOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.is_teacher() or request.user.is_staff)

    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user or request.user.is_staff


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all().order_by('-created_at')
    serializer_class = QuizSerializer

    def get_queryset(self):
        qs = (
            Quiz.objects
            .select_related('owner')
            .prefetch_related('questions__choices')
            .annotate(question_count=Count('questions', distinct=True))
            .order_by('-created_at')
        )

        request = self.request
        q = (request.query_params.get('search') or request.query_params.get('q') or '').strip()
        category = (request.query_params.get('category') or '').strip()
        sort = (request.query_params.get('sort') or '').strip().lower()
        min_questions = request.query_params.get('min_questions')
        mine = (request.query_params.get('mine') or '').strip().lower()

        if q:
            qs = qs.filter(title__icontains=q)
        if category:
            qs = qs.filter(category__iexact=category)
        if min_questions:
            try:
                min_q = int(min_questions)
                qs = qs.filter(question_count__gte=min_q)
            except (TypeError, ValueError):
                pass
        if mine in {'1', 'true', 'yes'}:
            if request.user.is_authenticated:
                qs = qs.filter(owner=request.user)
            else:
                qs = qs.none()

        # Accept common frontend sorting aliases used by "sets/discover" pages.
        if sort in {'new', 'newest', '-created_at'}:
            qs = qs.order_by('-created_at')
        elif sort in {'old', 'oldest', 'created_at'}:
            qs = qs.order_by('created_at')
        elif sort in {'title', 'a-z'}:
            qs = qs.order_by('title')
        elif sort in {'-title', 'z-a'}:
            qs = qs.order_by('-title')
        elif sort in {'questions', 'question_count'}:
            qs = qs.order_by('-question_count', '-created_at')

        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsTeacherOrOwner]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [p() for p in permission_classes]
