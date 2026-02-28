from rest_framework import serializers
from .models import GameSession, Player, Attempt, AttemptAnswer


class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ('id', 'name', 'score')


class GameSessionSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, read_only=True)

    class Meta:
        model = GameSession
        fields = ('id', 'code', 'quiz', 'host', 'is_active', 'current_index', 'mode', 'players')
        read_only_fields = ('code', 'host', 'is_active')


class AttemptAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)

    class Meta:
        model = AttemptAnswer
        fields = ('id', 'question', 'question_text', 'selected_choice', 'is_correct', 'time_taken')


class AttemptSerializer(serializers.ModelSerializer):
    answers = AttemptAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Attempt
        fields = ('id', 'user', 'player', 'session', 'quiz', 'score', 'started_at', 'finished_at', 'total_questions', 'correct_answers', 'answers')
