from rest_framework import serializers

from games.models import Attempt, AttemptAnswer


class ResultAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    selected_choice_text = serializers.CharField(source='selected_choice.text', read_only=True)

    class Meta:
        model = AttemptAnswer
        fields = (
            'id',
            'question',
            'question_text',
            'selected_choice',
            'selected_choice_text',
            'is_correct',
            'time_taken',
        )


class ResultSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    quiz_subject = serializers.SerializerMethodField()
    quiz_subject_id = serializers.IntegerField(source='quiz.subject_ref_id', read_only=True)
    quiz_topic = serializers.CharField(source='quiz.topic_ref.name', read_only=True)
    quiz_module = serializers.CharField(source='quiz.module_ref.title', read_only=True)
    quiz_type = serializers.CharField(source='quiz.quiz_type', read_only=True)
    difficulty = serializers.CharField(source='quiz.difficulty', read_only=True)
    student_name = serializers.SerializerMethodField()
    student_email = serializers.CharField(source='user.email', read_only=True)
    student_id = serializers.SerializerMethodField()
    field = serializers.SerializerMethodField()
    semester_code = serializers.SerializerMethodField()
    semester_number = serializers.SerializerMethodField()
    section = serializers.SerializerMethodField()
    submitted_at = serializers.SerializerMethodField()
    answers = ResultAnswerSerializer(many=True, read_only=True)

    @staticmethod
    def _student_profile(obj):
        return getattr(getattr(obj, 'user', None), 'student_profile', None)

    def get_quiz_subject(self, obj):
        return getattr(getattr(obj.quiz, 'subject_ref', None), 'name', '') or obj.quiz.subject

    def get_student_name(self, obj):
        return obj.student_name_snapshot or getattr(getattr(obj, 'user', None), 'full_name', '')

    def get_student_id(self, obj):
        profile = self._student_profile(obj)
        return (
            obj.student_id_snapshot
            or getattr(getattr(obj, 'user', None), 'student_id', '')
            or getattr(profile, 'student_id', '')
        )

    def get_field(self, obj):
        user = getattr(obj, 'user', None)
        return (
            obj.field_name_snapshot
            or getattr(getattr(obj, 'field_of_study', None), 'name', '')
            or getattr(getattr(user, 'field_of_study', None), 'name', '')
        )

    def get_semester_code(self, obj):
        return obj.semester_code or getattr(getattr(obj, 'user', None), 'semester_code', '')

    def get_semester_number(self, obj):
        profile = self._student_profile(obj)
        return (
            obj.semester_number
            or getattr(getattr(obj, 'user', None), 'semester_number', None)
            or getattr(profile, 'semester', None)
        )

    def get_section(self, obj):
        profile = self._student_profile(obj)
        return (
            obj.section
            or getattr(getattr(obj, 'user', None), 'section', '')
            or getattr(profile, 'group', '')
        )

    def get_submitted_at(self, obj):
        return obj.submitted_at or obj.finished_at or obj.started_at

    class Meta:
        model = Attempt
        fields = (
            'id',
            'user',
            'student_name',
            'student_email',
            'student_id',
            'quiz',
            'quiz_title',
            'quiz_subject',
            'quiz_subject_id',
            'quiz_topic',
            'quiz_module',
            'quiz_type',
            'difficulty',
            'field',
            'semester_code',
            'semester_number',
            'section',
            'score',
            'total_questions',
            'correct_answers',
            'wrong_answers',
            'percentage',
            'duration_taken',
            'pass_fail_status',
            'started_at',
            'finished_at',
            'submitted_at',
            'answers',
        )


class StudentMyResultSerializer(serializers.ModelSerializer):
    quiz_id = serializers.IntegerField(source='quiz_id', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    subject_id = serializers.IntegerField(source='quiz.subject_ref_id', read_only=True)
    subject_name = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    student_email = serializers.CharField(source='user.email', read_only=True)
    correct_count = serializers.IntegerField(source='correct_answers', read_only=True)
    wrong_count = serializers.IntegerField(source='wrong_answers', read_only=True)
    status = serializers.CharField(source='pass_fail_status', read_only=True)
    created_at = serializers.SerializerMethodField()

    def get_subject_name(self, obj):
        return getattr(getattr(obj.quiz, 'subject_ref', None), 'name', '') or obj.quiz.subject or 'Unspecified'

    def get_student_name(self, obj):
        return obj.student_name_snapshot or getattr(getattr(obj, 'user', None), 'full_name', '') or getattr(getattr(obj, 'user', None), 'username', '')

    def get_created_at(self, obj):
        return obj.submitted_at or obj.finished_at or obj.started_at

    class Meta:
        model = Attempt
        fields = (
            'id',
            'quiz_id',
            'quiz_title',
            'subject_id',
            'subject_name',
            'student_name',
            'student_email',
            'score',
            'total_questions',
            'correct_count',
            'wrong_count',
            'percentage',
            'status',
            'created_at',
        )
