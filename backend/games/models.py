from django.db import models
from django.conf import settings
from quizzes.models import Quiz, Question, Choice
import random


def make_code():
    # 7-digit join code (e.g. 1234567)
    return f"{random.randint(1000000, 9999999)}"


class GameSession(models.Model):
    code = models.CharField(max_length=10, default=make_code, unique=True)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    current_index = models.IntegerField(default=-1)
    mode = models.CharField(max_length=50, default='classic')

    def __str__(self):
        return f"{self.code} - {self.quiz.title}"


class Player(models.Model):
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='players')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    name = models.CharField(max_length=100)
    score = models.IntegerField(default=0)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.score})"


class Attempt(models.Model):
    # represents a user's attempt at a quiz (tied to a session)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    player = models.ForeignKey('Player', null=True, blank=True, on_delete=models.SET_NULL)
    session = models.ForeignKey('GameSession', null=True, blank=True, on_delete=models.SET_NULL)
    quiz = models.ForeignKey('quizzes.Quiz', on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    total_questions = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)

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
