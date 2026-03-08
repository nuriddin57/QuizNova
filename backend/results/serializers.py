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
    student_id = serializers.CharField(source='student_id_snapshot', read_only=True)
    field = serializers.SerializerMethodField()
    semester_code = serializers.CharField(read_only=True)
    semester_number = serializers.IntegerField(read_only=True)
    section = serializers.CharField(read_only=True)
    submitted_at = serializers.DateTimeField(read_only=True)
    answers = ResultAnswerSerializer(many=True, read_only=True)

    def get_quiz_subject(self, obj):
        return getattr(getattr(obj.quiz, 'subject_ref', None), 'name', '') or obj.quiz.subject

    def get_student_name(self, obj):
        return obj.student_name_snapshot or getattr(getattr(obj, 'user', None), 'full_name', '')

    def get_field(self, obj):
        return obj.field_name_snapshot or getattr(getattr(obj, 'field_of_study', None), 'name', '')

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
