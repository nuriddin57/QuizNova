from rest_framework import serializers

from quizzes.models import Choice, Question, QuestionBank, Quiz, QuizQuestion
from subjects.models import Subject, Topic


def _question_bank_correct_answer(item):
    correct_index = int(item['correct_answer_index'])
    correct_option = str((item.get('options') or [''])[correct_index]).strip().upper()
    if item.get('question_type') == Question.TYPE_TRUE_FALSE:
        return 'TRUE' if correct_option == 'TRUE' else 'FALSE'
    return chr(65 + correct_index)


class AIQuestionSerializer(serializers.Serializer):
    question_text = serializers.CharField()
    question_type = serializers.ChoiceField(choices=[Question.TYPE_MCQ, Question.TYPE_TRUE_FALSE], default=Question.TYPE_MCQ)
    type = serializers.ChoiceField(choices=['multiple_choice', Question.TYPE_TRUE_FALSE], required=False)
    options = serializers.ListField(child=serializers.CharField(), min_length=2, max_length=4)
    correct_answer_index = serializers.IntegerField(min_value=0, max_value=3)
    explanation = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        raw_type = attrs.get('type')
        question_type = attrs.get('question_type', Question.TYPE_MCQ)
        if raw_type:
            question_type = Question.TYPE_TRUE_FALSE if raw_type == Question.TYPE_TRUE_FALSE else Question.TYPE_MCQ
            attrs['question_type'] = question_type
        options = attrs.get('options') or []
        correct_answer_index = attrs.get('correct_answer_index', 0)

        expected_length = 2 if question_type == Question.TYPE_TRUE_FALSE else 4
        if len(options) != expected_length:
            raise serializers.ValidationError({'options': f'{question_type} questions must contain exactly {expected_length} options.'})
        if correct_answer_index >= len(options):
            raise serializers.ValidationError({'correct_answer_index': 'Correct answer index is out of range.'})
        return attrs


class AIQuestionGenerateRequestSerializer(serializers.Serializer):
    field_of_study_id = serializers.IntegerField(required=False)
    field_of_study_name = serializers.CharField(required=False, allow_blank=True)
    subject = serializers.CharField(max_length=140)
    topic = serializers.CharField(max_length=240)
    difficulty = serializers.ChoiceField(choices=['easy', 'medium', 'hard'])
    language = serializers.ChoiceField(choices=['en', 'uz', 'ru'], required=False, default='en')
    number_of_questions = serializers.IntegerField(min_value=1, max_value=30)


class AIQuestionGenerateResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(required=False)
    provider = serializers.CharField()
    total_questions = serializers.IntegerField(required=False)
    true_false_count = serializers.IntegerField(required=False)
    multiple_choice_count = serializers.IntegerField(required=False)
    questions = AIQuestionSerializer(many=True)
    quiz_payload = serializers.ListField(child=serializers.DictField(), required=False)


class AIQuestionRegenerateRequestSerializer(serializers.Serializer):
    field_of_study_id = serializers.IntegerField(required=False)
    field_of_study_name = serializers.CharField(required=False, allow_blank=True)
    subject = serializers.CharField(max_length=140)
    topic = serializers.CharField(max_length=240)
    difficulty = serializers.ChoiceField(choices=['easy', 'medium', 'hard'])
    language = serializers.ChoiceField(choices=['en', 'uz', 'ru'], required=False, default='en')
    current_question_text = serializers.CharField(required=False, allow_blank=True)
    current_question_type = serializers.ChoiceField(
        choices=[Question.TYPE_MCQ, Question.TYPE_TRUE_FALSE, 'multiple_choice'],
        required=False,
        allow_blank=True,
    )
    existing_questions = serializers.ListField(
        child=serializers.CharField(max_length=1000),
        required=False,
        allow_empty=True,
    )


class AIQuestionAnalyzeRequestSerializer(serializers.Serializer):
    question_text = serializers.CharField(max_length=1000)
    question_type = serializers.ChoiceField(choices=[Question.TYPE_MCQ, Question.TYPE_TRUE_FALSE], default=Question.TYPE_MCQ)
    options = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False, allow_empty=True)
    correct_answer = serializers.CharField(max_length=20, required=False, allow_blank=True)
    explanation = serializers.CharField(required=False, allow_blank=True)


class AIQuestionAnalyzeResponseSerializer(serializers.Serializer):
    quality_score = serializers.IntegerField(min_value=0, max_value=100)
    level = serializers.ChoiceField(choices=['strong', 'needs_review', 'weak'])
    summary = serializers.CharField()
    strengths = serializers.ListField(child=serializers.CharField())
    issues = serializers.ListField(child=serializers.CharField())
    suggestions = serializers.ListField(child=serializers.CharField())
    normalized_options = serializers.ListField(child=serializers.CharField())


class AIBulkAddToQuizRequestSerializer(serializers.Serializer):
    quiz_id = serializers.IntegerField()
    questions = AIQuestionSerializer(many=True, min_length=1, max_length=100)

    def validate_quiz_id(self, value):
        user = self.context['request'].user
        quiz = Quiz.objects.filter(id=value).first()
        if not quiz:
            raise serializers.ValidationError('Quiz not found.')
        if quiz.owner_id != user.id and not user.is_admin():
            raise serializers.ValidationError('You can only add questions to your own quizzes.')
        self.context['quiz'] = quiz
        return value

    def create_questions(self):
        quiz = self.context['quiz']
        questions = self.validated_data['questions']

        start_order = quiz.questions.count()
        created = []
        for offset, q in enumerate(questions):
            question = Question.objects.create(
                quiz=quiz,
                text=q['question_text'],
                explanation=q.get('explanation', ''),
                question_type=q.get('question_type', Question.TYPE_MCQ),
                timer_seconds=30,
                order=start_order + offset,
            )
            for idx, option in enumerate(q['options']):
                Choice.objects.create(
                    question=question,
                    text=option,
                    is_correct=idx == q['correct_answer_index'],
                    order=idx,
                )
            created.append(question)
        return created


class AISaveToQuestionBankRequestSerializer(serializers.Serializer):
    subject_ref = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.filter(is_active=True))
    topic_ref = serializers.PrimaryKeyRelatedField(queryset=Topic.objects.filter(is_active=True), required=False, allow_null=True)
    quiz_id = serializers.IntegerField(required=False)
    difficulty = serializers.ChoiceField(choices=['easy', 'medium', 'hard'], default='medium')
    marks = serializers.IntegerField(min_value=1, default=1)
    questions = AIQuestionSerializer(many=True, min_length=1, max_length=100)

    def validate(self, attrs):
        subject = attrs['subject_ref']
        topic = attrs.get('topic_ref')
        if topic and topic.subject_id != subject.id:
            raise serializers.ValidationError({'topic_ref': 'Topic must belong to subject.'})

        quiz_id = attrs.get('quiz_id')
        if quiz_id:
            user = self.context['request'].user
            quiz = Quiz.objects.filter(id=quiz_id).first()
            if not quiz:
                raise serializers.ValidationError({'quiz_id': 'Quiz not found.'})
            if quiz.owner_id != user.id and not user.is_admin():
                raise serializers.ValidationError({'quiz_id': 'You can only add questions to your own quizzes.'})
            self.context['quiz'] = quiz
        return attrs

    def save_entries(self):
        user = self.context['request'].user
        subject = self.validated_data['subject_ref']
        topic = self.validated_data.get('topic_ref')
        quiz = self.context.get('quiz')
        entries = []
        created_quiz_question_ids = []
        quiz_order = quiz.questions.count() if quiz else 0

        for offset, item in enumerate(self.validated_data['questions']):
            entry = QuestionBank.objects.create(
                subject_ref=subject,
                topic_ref=topic,
                field_of_study=subject.field_of_study,
                semester=subject.semester,
                topic=topic.name if topic else '',
                unit_name=topic.unit_name if topic else '',
                question_text=item['question_text'],
                question_type=item.get('question_type', Question.TYPE_MCQ),
                difficulty=self.validated_data['difficulty'],
                option_a=item['options'][0] if len(item['options']) > 0 else '',
                option_b=item['options'][1] if len(item['options']) > 1 else '',
                option_c=item['options'][2] if len(item['options']) > 2 else '',
                option_d='',
                correct_answer=_question_bank_correct_answer(item),
                explanation=item.get('explanation', ''),
                marks=self.validated_data['marks'],
                created_by=user,
            )
            entries.append(entry)
            if quiz:
                question = Question.objects.create(
                    quiz=quiz,
                    subject_ref=subject,
                    topic_ref=topic,
                    text=item['question_text'],
                    explanation=item.get('explanation', ''),
                    question_type=item.get('question_type', Question.TYPE_MCQ),
                    difficulty=self.validated_data['difficulty'],
                    marks=self.validated_data['marks'],
                    timer_seconds=30,
                    order=quiz_order + offset,
                )
                for index, option in enumerate(item['options']):
                    Choice.objects.create(
                        question=question,
                        text=option,
                        is_correct=index == item['correct_answer_index'],
                        order=index,
                    )
                QuizQuestion.objects.create(
                    quiz=quiz,
                    question=question,
                    question_bank_reference=entry,
                    order=question.order,
                )
                created_quiz_question_ids.append(question.id)
        return entries, created_quiz_question_ids
