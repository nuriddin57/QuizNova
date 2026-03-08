from rest_framework import serializers

from quizzes.models import Choice, Question, QuestionBank, Quiz, QuizQuestion
from subjects.models import Subject, Topic


class AIQuestionSerializer(serializers.Serializer):
    question_text = serializers.CharField()
    options = serializers.ListField(child=serializers.CharField(), min_length=4, max_length=4)
    correct_answer_index = serializers.IntegerField(min_value=0, max_value=3)
    explanation = serializers.CharField(required=False, allow_blank=True)


class AIQuestionGenerateRequestSerializer(serializers.Serializer):
    field_of_study_id = serializers.IntegerField(required=False)
    field_of_study_name = serializers.CharField(required=False, allow_blank=True)
    subject = serializers.CharField(max_length=140)
    topic = serializers.CharField(max_length=240)
    difficulty = serializers.ChoiceField(choices=['easy', 'medium', 'hard'])
    number_of_questions = serializers.IntegerField(min_value=1, max_value=30)


class AIQuestionGenerateResponseSerializer(serializers.Serializer):
    provider = serializers.CharField()
    questions = AIQuestionSerializer(many=True)
    quiz_payload = serializers.ListField(child=serializers.DictField(), required=False)


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
                question_type=Question.TYPE_MCQ,
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
                question_type=Question.TYPE_MCQ,
                difficulty=self.validated_data['difficulty'],
                option_a=item['options'][0],
                option_b=item['options'][1],
                option_c=item['options'][2],
                option_d=item['options'][3],
                correct_answer=chr(65 + int(item['correct_answer_index'])),
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
                    question_type=Question.TYPE_MCQ,
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
