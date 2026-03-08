import random
import uuid

from django.conf import settings
from django.db import models

from quizzes.models import Choice, Question, Quiz


def make_code():
    # 7-digit join code (e.g. 1234567)
    return f"{random.randint(1000000, 9999999)}"


def make_reconnect_token():
    return uuid.uuid4().hex


class GameSession(models.Model):
    MODE_CLASSIC = 'classic'
    MODE_SPEED = 'speed'
    MODE_TEAM = 'team'
    MODE_BATTLE = 'battle'
    MODE_SURVIVAL = 'survival'
    MODE_TREASURE = 'treasure'
    MODE_CHOICES = [
        (MODE_CLASSIC, 'Classic Mode'),
        (MODE_SPEED, 'Speed Mode'),
        (MODE_TEAM, 'Team Mode'),
        (MODE_BATTLE, 'Battle Mode'),
        (MODE_SURVIVAL, 'Survival Mode'),
        (MODE_TREASURE, 'Treasure Mode'),
    ]

    code = models.CharField(max_length=10, default=make_code, unique=True)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    current_index = models.IntegerField(default=-1)
    mode = models.CharField(max_length=50, choices=MODE_CHOICES, default=MODE_CLASSIC)
    current_question_started_at = models.DateTimeField(null=True, blank=True)
    current_question_token = models.CharField(max_length=64, blank=True, default='')

    def __str__(self):
        return f"{self.code} - {self.quiz.title}"


class Player(models.Model):
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='players')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    name = models.CharField(max_length=100)
    avatar = models.CharField(max_length=32, default='avatar-1', blank=True)
    reconnect_token = models.CharField(max_length=64, default=make_reconnect_token, db_index=True)
    client_id = models.CharField(max_length=64, blank=True, db_index=True)
    join_ip = models.GenericIPAddressField(null=True, blank=True)
    last_seen_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    score = models.IntegerField(default=0)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['session', 'reconnect_token'], name='uniq_player_session_reconnect'),
        ]
        indexes = [
            models.Index(fields=['session', 'client_id']),
            models.Index(fields=['session', 'join_ip']),
        ]

    def __str__(self):
        return f"{self.name} ({self.score})"


class Attempt(models.Model):
    # represents a user's attempt at a quiz (tied to a session)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    player = models.ForeignKey('Player', null=True, blank=True, on_delete=models.SET_NULL)
    session = models.ForeignKey('GameSession', null=True, blank=True, on_delete=models.SET_NULL)
    quiz = models.ForeignKey('quizzes.Quiz', on_delete=models.CASCADE)
    student_name_snapshot = models.CharField(max_length=255, blank=True)
    student_id_snapshot = models.CharField(max_length=32, blank=True, db_index=True)
    field_of_study = models.ForeignKey('fields.StudyField', null=True, blank=True, on_delete=models.SET_NULL, related_name='attempts')
    field_name_snapshot = models.CharField(max_length=160, blank=True)
    semester_code = models.CharField(max_length=20, blank=True, db_index=True)
    semester_number = models.PositiveSmallIntegerField(null=True, blank=True, db_index=True)
    section = models.CharField(max_length=50, blank=True, db_index=True)
    score = models.IntegerField(default=0)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    total_questions = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    wrong_answers = models.IntegerField(default=0)
    percentage = models.FloatField(default=0.0)
    duration_taken = models.FloatField(default=0.0)
    pass_fail_status = models.CharField(max_length=20, default='pending')

    def accuracy(self):
        if self.total_questions == 0:
            return 0.0
        return (self.correct_answers / self.total_questions) * 100.0


class AttemptAnswer(models.Model):
    attempt = models.ForeignKey(Attempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey('quizzes.Question', on_delete=models.CASCADE)
    selected_choice = models.ForeignKey('quizzes.Choice', null=True, blank=True, on_delete=models.SET_NULL)
    is_correct = models.BooleanField(default=False)
    time_taken = models.FloatField(default=0.0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['question'])]


class GameResponse(models.Model):
    """Temporary per-session response record while a live game is active."""

    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='responses')
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey('quizzes.Question', on_delete=models.CASCADE)
    selected_choice = models.ForeignKey('quizzes.Choice', null=True, blank=True, on_delete=models.SET_NULL)
    is_correct = models.BooleanField(default=False)
    time_taken = models.FloatField(default=0.0)
    answered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (('session', 'player', 'question'),)

    def __str__(self):
        return f"Response {self.player} Q{self.question.id} -> {self.selected_choice_id}"
