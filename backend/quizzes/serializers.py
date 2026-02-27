from rest_framework import serializers
from .models import Quiz, Question, Choice


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ('id', 'text', 'is_correct')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        quiz_owner_id = getattr(getattr(getattr(instance, 'question', None), 'quiz', None), 'owner_id', None)
        can_view_answers = bool(
            user
            and user.is_authenticated
            and (getattr(user, 'is_staff', False) or getattr(user, 'id', None) == quiz_owner_id)
        )
        if not can_view_answers:
            data.pop('is_correct', None)
        return data


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)
    order = serializers.IntegerField(required=False)

    class Meta:
        model = Question
        fields = ('id', 'text', 'timer_seconds', 'choices', 'order')

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        question = Question.objects.create(**validated_data)
        for c in choices_data:
            Choice.objects.create(question=question, **c)
        return question

    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', None)
        instance.text = validated_data.get('text', instance.text)
        instance.timer_seconds = validated_data.get('timer_seconds', instance.timer_seconds)
        instance.order = validated_data.get('order', instance.order)
        instance.save()
        if choices_data is not None:
            # naive replace strategy: delete existing and recreate
            instance.choices.all().delete()
            for c in choices_data:
                Choice.objects.create(question=instance, **c)
        return instance


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False)
    question_count = serializers.IntegerField(read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Quiz
        fields = ('id', 'title', 'description', 'category', 'owner', 'owner_username', 'question_count', 'questions')
        read_only_fields = ('owner',)

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        quiz = Quiz.objects.create(**validated_data)
        for q in questions_data:
            choices = q.pop('choices', [])
            order = q.get('order', 0)
            question = Question.objects.create(quiz=quiz, order=order, text=q.get('text',''), timer_seconds=q.get('timer_seconds',20))
            for c in choices:
                Choice.objects.create(question=question, **c)
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        instance.category = validated_data.get('category', instance.category)
        instance.save()
        if questions_data is not None:
            # simplistic approach: clear and recreate questions preserving order
            instance.questions.all().delete()
            for q in questions_data:
                choices = q.pop('choices', [])
                order = q.get('order', 0)
                question = Question.objects.create(quiz=instance, order=order, text=q.get('text',''), timer_seconds=q.get('timer_seconds',20))
                for c in choices:
                    Choice.objects.create(question=question, **c)
        return instance
