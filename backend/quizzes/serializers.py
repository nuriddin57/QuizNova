from rest_framework import serializers

from fields.models import StudyField
from subjects.models import Module, Subject, Topic
from subjects.serializers import SubjectSerializer, TopicSerializer

from .models import Choice, Question, QuestionBank, Quiz, QuizQuestion


class StudyFieldMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyField
        fields = ('id', 'code', 'name')


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ('id', 'text', 'text_uz', 'text_en', 'image_url', 'is_correct', 'order')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        quiz_owner_id = getattr(getattr(getattr(instance, 'question', None), 'quiz', None), 'owner_id', None)
        can_view_answers = bool(
            user
            and user.is_authenticated
            and (
                getattr(user, 'is_staff', False)
                or (hasattr(user, 'is_teacher') and user.is_teacher())
                or (hasattr(user, 'is_admin') and user.is_admin())
                or getattr(user, 'id', None) == quiz_owner_id
            )
        )
        if not can_view_answers:
            data.pop('is_correct', None)
        return data


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, required=False)
    order = serializers.IntegerField(required=False)

    class Meta:
        model = Question
        fields = (
            'id',
            'subject_ref',
            'topic_ref',
            'module_ref',
            'text',
            'text_uz',
            'text_en',
            'image_url',
            'short_answer',
            'explanation',
            'question_type',
            'difficulty',
            'marks',
            'timer_seconds',
            'choices',
            'order',
        )

    def validate(self, attrs):
        q_type = attrs.get('question_type', getattr(self.instance, 'question_type', Question.TYPE_MCQ))
        timer_seconds = attrs.get('timer_seconds', getattr(self.instance, 'timer_seconds', 20))
        marks = attrs.get('marks', getattr(self.instance, 'marks', 1))
        if timer_seconds < 1:
            raise serializers.ValidationError('timer_seconds must be greater than 0.')
        if marks < 1:
            raise serializers.ValidationError('marks must be greater than 0.')

        choices = attrs.get('choices')
        if q_type == Question.TYPE_SHORT_ANSWER:
            short_answer = attrs.get('short_answer', getattr(self.instance, 'short_answer', ''))
            if not str(short_answer or '').strip():
                raise serializers.ValidationError('short_answer is required for short_answer question type.')
        elif q_type in {Question.TYPE_MCQ, Question.TYPE_TRUE_FALSE, Question.TYPE_MULTI} and choices is not None:
            if len(choices) < 2:
                raise serializers.ValidationError('Choice-based questions need at least 2 options.')
            correct_count = sum(1 for choice in choices if choice.get('is_correct'))
            if q_type == Question.TYPE_MULTI:
                if correct_count < 1:
                    raise serializers.ValidationError('Multiple-correct questions need at least one correct option.')
            elif correct_count != 1:
                raise serializers.ValidationError('This question type requires exactly one correct option.')
        return attrs

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        question = Question.objects.create(**validated_data)
        for index, choice_data in enumerate(choices_data):
            choice_data.setdefault('order', index)
            Choice.objects.create(question=question, **choice_data)
        return question

    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', None)
        for field in (
            'subject_ref',
            'topic_ref',
            'module_ref',
            'text',
            'text_uz',
            'text_en',
            'image_url',
            'short_answer',
            'explanation',
            'question_type',
            'difficulty',
            'marks',
            'timer_seconds',
            'order',
        ):
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()
        if choices_data is not None:
            instance.choices.all().delete()
            for index, choice_data in enumerate(choices_data):
                choice_data.setdefault('order', index)
                Choice.objects.create(question=instance, **choice_data)
        return instance


class QuestionBankSerializer(serializers.ModelSerializer):
    subject_data = SubjectSerializer(source='subject_ref', read_only=True)
    topic_data = TopicSerializer(source='topic_ref', read_only=True)
    module_data = serializers.SerializerMethodField()
    field_data = StudyFieldMiniSerializer(source='field_of_study', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = QuestionBank
        fields = (
            'id',
            'subject_ref',
            'subject_data',
            'topic_ref',
            'topic_data',
            'module_ref',
            'module_data',
            'field_of_study',
            'field_data',
            'semester',
            'topic',
            'unit_name',
            'question_text',
            'question_type',
            'difficulty',
            'option_a',
            'option_b',
            'option_c',
            'option_d',
            'correct_answer',
            'explanation',
            'marks',
            'created_by',
            'created_by_name',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('created_by',)

    def validate(self, attrs):
        subject = attrs.get('subject_ref') or getattr(self.instance, 'subject_ref', None)
        topic = attrs.get('topic_ref') or getattr(self.instance, 'topic_ref', None)
        module = attrs.get('module_ref') or getattr(self.instance, 'module_ref', None)
        field_of_study = attrs.get('field_of_study') or getattr(self.instance, 'field_of_study', None)
        question_type = attrs.get('question_type', getattr(self.instance, 'question_type', Question.TYPE_MCQ))
        correct_answer = str(attrs.get('correct_answer', getattr(self.instance, 'correct_answer', ''))).strip().upper()

        if subject and field_of_study and subject.field_of_study_id != field_of_study.id:
            raise serializers.ValidationError('Subject field and selected field_of_study must match.')
        if topic and subject and topic.subject_id != subject.id:
            raise serializers.ValidationError('Topic must belong to the selected subject.')
        if module and topic and module.topic_id != topic.id:
            raise serializers.ValidationError('Module must belong to the selected topic.')
        if module and not topic:
            topic = module.topic
            attrs['topic_ref'] = topic
        if module and not subject:
            subject = module.topic.subject
            attrs['subject_ref'] = subject

        if question_type in {Question.TYPE_MCQ, Question.TYPE_TRUE_FALSE, Question.TYPE_MULTI}:
            options = [
                str(attrs.get('option_a', getattr(self.instance, 'option_a', ''))).strip(),
                str(attrs.get('option_b', getattr(self.instance, 'option_b', ''))).strip(),
                str(attrs.get('option_c', getattr(self.instance, 'option_c', ''))).strip(),
                str(attrs.get('option_d', getattr(self.instance, 'option_d', ''))).strip(),
            ]
            option_count = len([value for value in options if value])
            if question_type == Question.TYPE_TRUE_FALSE:
                if set(filter(None, [option.lower() for option in options[:2]])) != {'true', 'false'}:
                    raise serializers.ValidationError('True/False questions must use True and False options.')
            elif option_count < 2:
                raise serializers.ValidationError('At least two options are required.')
            if correct_answer not in {'A', 'B', 'C', 'D', 'TRUE', 'FALSE'}:
                raise serializers.ValidationError('correct_answer must be A/B/C/D or TRUE/FALSE.')

        attrs['correct_answer'] = correct_answer
        if subject and not attrs.get('semester'):
            attrs['semester'] = subject.semester
        if subject and not attrs.get('field_of_study'):
            attrs['field_of_study'] = subject.field_of_study
        if topic and not attrs.get('topic'):
            attrs['topic'] = topic.name
        if topic and not attrs.get('unit_name'):
            attrs['unit_name'] = topic.unit_name
        if module and not attrs.get('unit_name'):
            attrs['unit_name'] = module.title
        return attrs

    def get_module_data(self, obj):
        if not obj.module_ref_id:
            return None
        return {
            'id': obj.module_ref_id,
            'title': obj.module_ref.title,
            'topic_id': obj.module_ref.topic_id,
        }


class QuizQuestionSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)
    question_bank_reference = QuestionBankSerializer(read_only=True)

    class Meta:
        model = QuizQuestion
        fields = ('id', 'quiz', 'question', 'question_bank_reference', 'order', 'created_at')


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False)
    question_links = QuizQuestionSerializer(source='quiz_question_links', many=True, read_only=True)
    question_count = serializers.IntegerField(read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    assigned_fields = serializers.PrimaryKeyRelatedField(
        queryset=StudyField.objects.filter(is_active=True),
        many=True,
        required=False,
    )
    assigned_fields_data = StudyFieldMiniSerializer(source='assigned_fields', many=True, read_only=True)
    target_field_of_study_data = StudyFieldMiniSerializer(source='target_field_of_study', read_only=True)
    subject_data = SubjectSerializer(source='subject_ref', read_only=True)
    topic_data = TopicSerializer(source='topic_ref', read_only=True)
    module_data = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    topic_name = serializers.SerializerMethodField()
    module_title = serializers.CharField(source='module_ref.title', read_only=True)

    REQUIRED_TOTAL_QUESTIONS = 10
    REQUIRED_TRUE_FALSE_QUESTIONS = 5
    REQUIRED_ABC_QUESTIONS = 5

    class Meta:
        model = Quiz
        fields = (
            'id',
            'title',
            'title_uz',
            'title_en',
            'description',
            'description_uz',
            'description_en',
            'category',
            'subject',
            'semester',
            'subject_ref',
            'subject_data',
            'subject_name',
            'topic_ref',
            'topic_data',
            'topic_name',
            'module_ref',
            'module_data',
            'module_title',
            'unit_name',
            'difficulty',
            'quiz_type',
            'duration_minutes',
            'total_marks',
            'passing_marks',
            'randomize_questions',
            'randomize_options',
            'allow_retry',
            'show_answers_after_submit',
            'is_published',
            'visibility',
            'apply_to_all_fields',
            'assigned_fields',
            'assigned_fields_data',
            'target_field_of_study',
            'target_field_of_study_data',
            'target_semester_code',
            'target_semester_number',
            'target_section',
            'folder',
            'strict_structure',
            'play_count',
            'owner',
            'owner_username',
            'question_count',
            'questions',
            'question_links',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('owner',)

    @staticmethod
    def _normalize_choice_text(value):
        return (value or '').strip().lower()

    def get_subject_name(self, obj):
        return getattr(obj.subject_ref, 'name', '') or obj.subject

    def get_topic_name(self, obj):
        return getattr(obj.topic_ref, 'name', '')

    def get_module_data(self, obj):
        if not obj.module_ref_id:
            return None
        return {
            'id': obj.module_ref_id,
            'title': obj.module_ref.title,
            'topic_id': obj.module_ref.topic_id,
        }

    @classmethod
    def _detect_question_kind(cls, choices):
        normalized = [
            cls._normalize_choice_text(choice.get('text'))
            for choice in (choices or [])
            if cls._normalize_choice_text(choice.get('text'))
        ]
        if len(normalized) == 2 and set(normalized) == {'true', 'false'}:
            return 'true_false'
        if len(normalized) == 3 and set(normalized) == {'a', 'b', 'c'}:
            return 'abc'
        return None

    @staticmethod
    def _count_correct_choices(choices):
        return sum(
            1
            for choice in (choices or [])
            if bool(choice.get('is_correct')) and (choice.get('text') or '').strip()
        )

    def _strict_enabled(self):
        raw = self.initial_data.get('strict_structure')
        if raw is None:
            if self.instance is not None:
                return bool(getattr(self.instance, 'strict_structure', True))
            return True
        if isinstance(raw, bool):
            return raw
        if isinstance(raw, str):
            return raw.strip().lower() in {'1', 'true', 'yes', 'on'}
        return bool(raw)

    def validate(self, attrs):
        total_marks = attrs.get('total_marks', getattr(self.instance, 'total_marks', 100))
        passing_marks = attrs.get('passing_marks', getattr(self.instance, 'passing_marks', 40))
        duration_minutes = attrs.get('duration_minutes', getattr(self.instance, 'duration_minutes', 20))
        subject_ref = attrs.get('subject_ref', getattr(self.instance, 'subject_ref', None))
        topic_ref = attrs.get('topic_ref', getattr(self.instance, 'topic_ref', None))
        module_ref = attrs.get('module_ref', getattr(self.instance, 'module_ref', None))
        assigned_fields = attrs.get('assigned_fields')
        target_field_of_study = attrs.get('target_field_of_study', getattr(self.instance, 'target_field_of_study', None))
        target_semester_code = attrs.get('target_semester_code', getattr(self.instance, 'target_semester_code', ''))
        target_semester_number = attrs.get('target_semester_number', getattr(self.instance, 'target_semester_number', None))
        target_section = attrs.get('target_section', getattr(self.instance, 'target_section', ''))

        if passing_marks > total_marks:
            raise serializers.ValidationError('passing_marks cannot be greater than total_marks.')
        if duration_minutes < 1:
            raise serializers.ValidationError('duration_minutes must be greater than 0.')
        if topic_ref and subject_ref and topic_ref.subject_id != subject_ref.id:
            raise serializers.ValidationError('Selected topic does not belong to the selected subject.')
        if module_ref and topic_ref and module_ref.topic_id != topic_ref.id:
            raise serializers.ValidationError('Selected module does not belong to the selected topic.')
        if module_ref and not topic_ref:
            topic_ref = module_ref.topic
            attrs['topic_ref'] = topic_ref
        if module_ref and not subject_ref:
            subject_ref = module_ref.topic.subject
            attrs['subject_ref'] = subject_ref
        if subject_ref:
            attrs['subject'] = subject_ref.name
            attrs['semester'] = attrs.get('semester') or subject_ref.semester
            if module_ref and not attrs.get('unit_name'):
                attrs['unit_name'] = module_ref.title
            if not attrs.get('assigned_fields') and not getattr(self.instance, 'apply_to_all_fields', False):
                attrs['assigned_fields'] = [subject_ref.field_of_study]
        elif not attrs.get('subject'):
            attrs['subject'] = getattr(self.instance, 'subject', '')
        if assigned_fields and subject_ref:
            if any(field.id != subject_ref.field_of_study_id for field in assigned_fields):
                raise serializers.ValidationError('Assigned fields must match the selected subject field.')
        if target_field_of_study and subject_ref and target_field_of_study.id != subject_ref.field_of_study_id:
            raise serializers.ValidationError('Target field must match the selected subject field.')
        if target_semester_code:
            attrs['target_semester_code'] = str(target_semester_code).strip()
        if target_section:
            attrs['target_section'] = str(target_section).strip().upper()
        if attrs.get('apply_to_all_fields'):
            attrs['target_field_of_study'] = None
            attrs['target_semester_code'] = ''
            attrs['target_semester_number'] = None
            attrs['target_section'] = ''
        elif not target_field_of_study and subject_ref:
            attrs['target_field_of_study'] = subject_ref.field_of_study
        if attrs.get('target_semester_number') == '':
            attrs['target_semester_number'] = None
        return attrs

    def validate_questions(self, questions):
        if questions is None:
            return questions

        strict_enabled = self._strict_enabled()
        if strict_enabled:
            if len(questions) != self.REQUIRED_TOTAL_QUESTIONS:
                raise serializers.ValidationError(
                    f'Quiz must contain exactly {self.REQUIRED_TOTAL_QUESTIONS} questions.'
                )

            counts = {'true_false': 0, 'abc': 0}
            invalid_question_indexes = []
            for index, question in enumerate(questions, start=1):
                q_type = question.get('question_type')
                if q_type == Question.TYPE_SHORT_ANSWER:
                    invalid_question_indexes.append(str(index))
                    continue

                choices = question.get('choices') or []
                if self._count_correct_choices(choices) != 1:
                    raise serializers.ValidationError(f'Question {index} must have exactly one correct answer.')

                question_kind = self._detect_question_kind(choices)
                if not question_kind:
                    invalid_question_indexes.append(str(index))
                    continue
                counts[question_kind] += 1

            if invalid_question_indexes:
                joined_indexes = ', '.join(invalid_question_indexes)
                raise serializers.ValidationError(
                    f'Questions {joined_indexes} must use either True/False choices or A/B/C choices.'
                )

            if counts['true_false'] != self.REQUIRED_TRUE_FALSE_QUESTIONS or counts['abc'] != self.REQUIRED_ABC_QUESTIONS:
                raise serializers.ValidationError(
                    f'Quiz must include exactly {self.REQUIRED_TRUE_FALSE_QUESTIONS} True/False questions '
                    f'and {self.REQUIRED_ABC_QUESTIONS} A/B/C questions.'
                )
            return questions

        if len(questions) < 1:
            raise serializers.ValidationError('Quiz must contain at least 1 question.')

        for index, question in enumerate(questions, start=1):
            q_type = question.get('question_type') or Question.TYPE_MCQ
            choices = question.get('choices') or []
            timer_seconds = int(question.get('timer_seconds') or 20)
            marks = int(question.get('marks') or 1)
            if timer_seconds < 1:
                raise serializers.ValidationError(f'Question {index} timer_seconds must be greater than 0.')
            if marks < 1:
                raise serializers.ValidationError(f'Question {index} marks must be greater than 0.')

            if q_type == Question.TYPE_SHORT_ANSWER:
                short_answer = str(question.get('short_answer') or '').strip()
                if not short_answer:
                    raise serializers.ValidationError(f'Question {index} short answer is required.')
                continue

            if len(choices) < 2:
                raise serializers.ValidationError(f'Question {index} must have at least 2 choices.')

            correct_count = self._count_correct_choices(choices)
            if q_type == Question.TYPE_MULTI:
                if correct_count < 1:
                    raise serializers.ValidationError(f'Question {index} must have at least one correct answer.')
            elif correct_count != 1:
                raise serializers.ValidationError(f'Question {index} must have exactly one correct answer.')

        return questions

    def _create_question_record(self, quiz, question_data, order=None):
        choices = question_data.pop('choices', [])
        question = Question.objects.create(
            quiz=quiz,
            subject_ref=question_data.get('subject_ref') or quiz.subject_ref,
            topic_ref=question_data.get('topic_ref') or quiz.topic_ref,
            module_ref=question_data.get('module_ref') or quiz.module_ref,
            order=question_data.get('order', order or 0),
            text=question_data.get('text', ''),
            text_uz=question_data.get('text_uz', ''),
            text_en=question_data.get('text_en', ''),
            image_url=question_data.get('image_url', ''),
            short_answer=question_data.get('short_answer', ''),
            explanation=question_data.get('explanation', ''),
            question_type=question_data.get('question_type') or Question.TYPE_MCQ,
            difficulty=question_data.get('difficulty') or Question.DIFFICULTY_MEDIUM,
            marks=question_data.get('marks') or 1,
            timer_seconds=question_data.get('timer_seconds', 20),
        )
        for index, choice_data in enumerate(choices):
            choice_data.setdefault('order', index)
            Choice.objects.create(question=question, **choice_data)
        return question

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        assigned_fields = validated_data.pop('assigned_fields', [])
        quiz = Quiz.objects.create(**validated_data)
        if assigned_fields:
            quiz.assigned_fields.set(assigned_fields)

        for question_index, question_data in enumerate(questions_data):
            question = self._create_question_record(quiz, question_data, order=question_index)
            QuizQuestion.objects.create(quiz=quiz, question=question, order=question.order)
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        assigned_fields = validated_data.pop('assigned_fields', None)

        for field in (
            'title',
            'title_uz',
            'title_en',
            'description',
            'description_uz',
            'description_en',
            'category',
            'subject',
            'semester',
            'subject_ref',
            'topic_ref',
            'module_ref',
            'unit_name',
            'difficulty',
            'quiz_type',
            'duration_minutes',
            'total_marks',
            'passing_marks',
            'randomize_questions',
            'randomize_options',
            'allow_retry',
            'show_answers_after_submit',
            'is_published',
            'visibility',
            'apply_to_all_fields',
            'target_field_of_study',
            'target_semester_code',
            'target_semester_number',
            'target_section',
            'folder',
            'strict_structure',
        ):
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()

        if assigned_fields is not None:
            instance.assigned_fields.set(assigned_fields)

        if questions_data is not None:
            instance.quiz_question_links.all().delete()
            instance.questions.all().delete()
            for question_index, question_data in enumerate(questions_data):
                question = self._create_question_record(instance, question_data, order=question_index)
                QuizQuestion.objects.create(quiz=instance, question=question, order=question.order)
        return instance
