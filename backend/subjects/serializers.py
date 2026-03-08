from rest_framework import serializers
from quizzes.models import Quiz

from .models import Module, Subject, Topic


class RelatedQuizSerializer(serializers.ModelSerializer):
    subject_name = serializers.SerializerMethodField()
    topic_name = serializers.CharField(source='topic_ref.name', read_only=True)
    module_title = serializers.CharField(source='module_ref.title', read_only=True)

    class Meta:
        model = Quiz
        fields = (
            'id',
            'title',
            'description',
            'difficulty',
            'quiz_type',
            'duration_minutes',
            'is_published',
            'subject_name',
            'topic_name',
            'module_title',
        )

    def get_subject_name(self, obj):
        return getattr(getattr(obj, 'subject_ref', None), 'name', '') or obj.subject


class ModuleSerializer(serializers.ModelSerializer):
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    subject_id = serializers.IntegerField(source='topic.subject_id', read_only=True)
    subject_name = serializers.CharField(source='topic.subject.name', read_only=True)
    related_quizzes = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = (
            'id',
            'topic',
            'topic_name',
            'subject_id',
            'subject_name',
            'title',
            'description',
            'order',
            'is_active',
            'related_quizzes',
            'created_at',
            'updated_at',
        )

    def get_related_quizzes(self, obj):
        queryset = (
            Quiz.objects.filter(module_ref=obj)
            .select_related('subject_ref', 'topic_ref', 'module_ref')
            .order_by('-created_at')[:12]
        )
        return RelatedQuizSerializer(queryset, many=True).data


class TopicSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)
    module_count = serializers.IntegerField(read_only=True)
    related_quizzes = serializers.SerializerMethodField()

    class Meta:
        model = Topic
        fields = (
            'id',
            'subject',
            'subject_name',
            'subject_code',
            'title',
            'name',
            'description',
            'unit_name',
            'is_active',
            'module_count',
            'modules',
            'related_quizzes',
            'created_at',
            'updated_at',
        )

    def get_related_quizzes(self, obj):
        queryset = (
            Quiz.objects.filter(topic_ref=obj)
            .select_related('subject_ref', 'topic_ref', 'module_ref')
            .order_by('-created_at')[:12]
        )
        return RelatedQuizSerializer(queryset, many=True).data


class SubjectSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='name', read_only=True)
    field_name = serializers.CharField(source='field_of_study.name', read_only=True)
    programme_name = serializers.CharField(source='programme.title', read_only=True)
    department_name = serializers.SerializerMethodField()
    topic_count = serializers.IntegerField(read_only=True)
    module_count = serializers.IntegerField(read_only=True)
    topics = TopicSerializer(many=True, read_only=True)
    related_quizzes = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = (
            'id',
            'title',
            'name',
            'code',
            'description',
            'programme',
            'programme_name',
            'field_of_study',
            'field_name',
            'department',
            'department_name',
            'semester',
            'semester_code',
            'credits',
            'is_active',
            'topic_count',
            'module_count',
            'topics',
            'related_quizzes',
            'created_at',
            'updated_at',
        )

    def get_related_quizzes(self, obj):
        queryset = (
            Quiz.objects.filter(subject_ref=obj)
            .select_related('subject_ref', 'topic_ref', 'module_ref')
            .order_by('-created_at')[:24]
        )
        return RelatedQuizSerializer(queryset, many=True).data

    def get_department_name(self, obj):
        return obj.department or getattr(obj.field_of_study, 'department', '')
