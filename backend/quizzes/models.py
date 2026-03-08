from django.db import models
from django.conf import settings


class Quiz(models.Model):
    VISIBILITY_PUBLIC = 'public'
    VISIBILITY_PRIVATE = 'private'
    VISIBILITY_CHOICES = [
        (VISIBILITY_PUBLIC, 'Public'),
        (VISIBILITY_PRIVATE, 'Private'),
    ]
    QUIZ_TYPE_PRACTICE = 'practice'
    QUIZ_TYPE_LIVE = 'live'
    QUIZ_TYPE_EXAM = 'exam'
    QUIZ_TYPE_ASSIGNMENT = 'assignment'
    QUIZ_TYPE_TIMED = 'timed_test'
    QUIZ_TYPE_CLASS_TEST = 'class_test'
    QUIZ_TYPE_MIDTERM = 'midterm'
    QUIZ_TYPE_FINAL = 'final'
    QUIZ_TYPE_CHOICES = [
        (QUIZ_TYPE_PRACTICE, 'Practice Quiz'),
        (QUIZ_TYPE_LIVE, 'Live Quiz'),
        (QUIZ_TYPE_EXAM, 'Exam Mode'),
        (QUIZ_TYPE_CLASS_TEST, 'Class Test'),
        (QUIZ_TYPE_MIDTERM, 'Midterm'),
        (QUIZ_TYPE_FINAL, 'Final Exam'),
        (QUIZ_TYPE_ASSIGNMENT, 'Assignment Quiz'),
        (QUIZ_TYPE_TIMED, 'Timed Test'),
    ]
    DIFFICULTY_EASY = 'easy'
    DIFFICULTY_MEDIUM = 'medium'
    DIFFICULTY_HARD = 'hard'
    DIFFICULTY_CHOICES = [
        (DIFFICULTY_EASY, 'Easy'),
        (DIFFICULTY_MEDIUM, 'Medium'),
        (DIFFICULTY_HARD, 'Hard'),
    ]

    title = models.CharField(max_length=200)
    title_uz = models.CharField(max_length=200, blank=True)
    title_en = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    description_uz = models.TextField(blank=True)
    description_en = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    subject = models.CharField(max_length=140, blank=True)
    semester = models.PositiveSmallIntegerField(default=1)
    subject_ref = models.ForeignKey(
        'subjects.Subject',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='legacy_quizzes',
    )
    topic_ref = models.ForeignKey(
        'subjects.Topic',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quizzes',
    )
    module_ref = models.ForeignKey(
        'subjects.Module',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quizzes',
    )
    unit_name = models.CharField(max_length=180, blank=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default=DIFFICULTY_MEDIUM)
    quiz_type = models.CharField(max_length=20, choices=QUIZ_TYPE_CHOICES, default=QUIZ_TYPE_PRACTICE)
    duration_minutes = models.PositiveIntegerField(default=20)
    total_marks = models.PositiveIntegerField(default=100)
    passing_marks = models.PositiveIntegerField(default=40)
    randomize_questions = models.BooleanField(default=False)
    randomize_options = models.BooleanField(default=False)
    allow_retry = models.BooleanField(default=False)
    show_answers_after_submit = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default=VISIBILITY_PRIVATE)
    apply_to_all_fields = models.BooleanField(default=False)
    assigned_fields = models.ManyToManyField('fields.StudyField', blank=True, related_name='quizzes')
    target_programme = models.ForeignKey(
        'fields.Programme',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='targeted_quizzes',
    )
    target_field_of_study = models.ForeignKey(
        'fields.StudyField',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='targeted_quizzes',
    )
    target_semester_code = models.CharField(max_length=20, blank=True, db_index=True)
    target_semester_number = models.PositiveSmallIntegerField(null=True, blank=True, db_index=True)
    target_section = models.CharField(max_length=50, blank=True, db_index=True)
    folder = models.CharField(max_length=120, blank=True)
    strict_structure = models.BooleanField(default=True)
    play_count = models.PositiveIntegerField(default=0)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quizzes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def __str__(self):
        return self.title


class Question(models.Model):
    TYPE_MCQ = 'mcq'
    TYPE_MULTI = 'mcq_multiple'
    TYPE_TRUE_FALSE = 'true_false'
    TYPE_SHORT_ANSWER = 'short_answer'
    TYPE_FILL_BLANK = 'fill_blank'
    TYPE_MATCHING = 'matching'
    TYPE_CHOICES = [
        (TYPE_MCQ, 'MCQ'),
        (TYPE_MULTI, 'Multiple Correct'),
        (TYPE_TRUE_FALSE, 'True/False'),
        (TYPE_SHORT_ANSWER, 'Short Answer'),
        (TYPE_FILL_BLANK, 'Fill in the Blank'),
        (TYPE_MATCHING, 'Matching'),
    ]
    DIFFICULTY_EASY = 'easy'
    DIFFICULTY_MEDIUM = 'medium'
    DIFFICULTY_HARD = 'hard'
    DIFFICULTY_CHOICES = [
        (DIFFICULTY_EASY, 'Easy'),
        (DIFFICULTY_MEDIUM, 'Medium'),
        (DIFFICULTY_HARD, 'Hard'),
    ]

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    subject_ref = models.ForeignKey(
        'subjects.Subject',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quiz_questions',
    )
    topic_ref = models.ForeignKey(
        'subjects.Topic',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quiz_questions',
    )
    module_ref = models.ForeignKey(
        'subjects.Module',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quiz_questions',
    )
    text = models.TextField()
    text_uz = models.TextField(blank=True)
    text_en = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    short_answer = models.CharField(max_length=255, blank=True)
    explanation = models.TextField(blank=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default=DIFFICULTY_MEDIUM)
    marks = models.PositiveIntegerField(default=1)
    question_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_MCQ)
    timer_seconds = models.PositiveIntegerField(default=20)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.text[:60]


class QuestionBank(models.Model):
    subject_ref = models.ForeignKey(
        'subjects.Subject',
        on_delete=models.CASCADE,
        related_name='question_bank_entries',
    )
    topic_ref = models.ForeignKey(
        'subjects.Topic',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='question_bank_entries',
    )
    module_ref = models.ForeignKey(
        'subjects.Module',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='question_bank_entries',
    )
    field_of_study = models.ForeignKey(
        'fields.StudyField',
        on_delete=models.CASCADE,
        related_name='question_bank_entries',
    )
    semester = models.PositiveSmallIntegerField(default=1)
    topic = models.CharField(max_length=180, blank=True)
    unit_name = models.CharField(max_length=180, blank=True)
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=Question.TYPE_CHOICES, default=Question.TYPE_MCQ)
    difficulty = models.CharField(max_length=20, choices=Question.DIFFICULTY_CHOICES, default=Question.DIFFICULTY_MEDIUM)
    option_a = models.CharField(max_length=255, blank=True)
    option_b = models.CharField(max_length=255, blank=True)
    option_c = models.CharField(max_length=255, blank=True)
    option_d = models.CharField(max_length=255, blank=True)
    correct_answer = models.CharField(max_length=20)
    explanation = models.TextField(blank=True)
    marks = models.PositiveIntegerField(default=1)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='question_bank_entries')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at', '-id']

    def __str__(self):
        return f'{self.subject_ref.code}: {self.question_text[:60]}'


class QuizQuestion(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='quiz_question_links')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='quiz_links')
    question_bank_reference = models.ForeignKey(
        QuestionBank,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quiz_links',
    )
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'id']
        unique_together = ('quiz', 'question')


class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=255)
    text_uz = models.CharField(max_length=255, blank=True)
    text_en = models.CharField(max_length=255, blank=True)
    image_url = models.URLField(blank=True)
    is_correct = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return self.text
