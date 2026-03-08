from rest_framework import serializers
from .models import GameSession, Player, Attempt, AttemptAnswer


class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ('id', 'name', 'avatar', 'score')


class GameSessionSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, read_only=True)
    mode_label = serializers.CharField(source='get_mode_display', read_only=True)

    class Meta:
        model = GameSession
        fields = (
            'id',
            'code',
            'quiz',
            'host',
            'is_active',
            'current_index',
            'mode',
            'mode_label',
            'current_question_started_at',
            'current_question_token',
            'players',
        )
        read_only_fields = ('code', 'host', 'is_active')


class AttemptAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    selected_choice_text = serializers.CharField(source='selected_choice.text', read_only=True)

    class Meta:
        model = AttemptAnswer
        fields = ('id', 'question', 'question_text', 'selected_choice', 'selected_choice_text', 'is_correct', 'time_taken')


class AttemptSerializer(serializers.ModelSerializer):
    answers = AttemptAnswerSerializer(many=True, read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    player_name = serializers.CharField(source='player.name', read_only=True)
    player_avatar = serializers.CharField(source='player.avatar', read_only=True)

    class Meta:
        model = Attempt
        fields = (
            'id',
            'user',
            'user_username',
            'player',
            'player_name',
            'player_avatar',
            'session',
            'quiz',
            'score',
            'started_at',
            'finished_at',
            'total_questions',
            'correct_answers',
            'wrong_answers',
            'percentage',
            'duration_taken',
            'pass_fail_status',
            'answers',
        )
