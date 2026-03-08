from django.contrib import admin

from .models import Attempt, AttemptAnswer, GameResponse, GameSession, Player


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ('code', 'quiz', 'host', 'mode', 'is_active', 'created_at')
    list_filter = ('mode', 'is_active', 'quiz')
    search_fields = ('code', 'quiz__title', 'host__username', 'host__email')
    autocomplete_fields = ('quiz', 'host')


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ('name', 'session', 'user', 'score', 'joined_at', 'last_seen_at')
    list_filter = ('session',)
    search_fields = ('name', 'user__username', 'user__email', 'session__code')
    autocomplete_fields = ('session', 'user')


@admin.register(Attempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'quiz', 'score', 'percentage', 'pass_fail_status', 'finished_at')
    list_filter = ('pass_fail_status', 'field_of_study', 'semester_code', 'semester_number', 'section', 'quiz__subject_ref', 'quiz__topic_ref', 'quiz__module_ref', 'quiz__quiz_type')
    search_fields = ('user__username', 'user__email', 'quiz__title')
    autocomplete_fields = ('user', 'player', 'session', 'quiz')


@admin.register(AttemptAnswer)
class AttemptAnswerAdmin(admin.ModelAdmin):
    list_display = ('attempt', 'question', 'selected_choice', 'is_correct', 'time_taken', 'created_at')
    list_filter = ('is_correct', 'question__module_ref', 'question__topic_ref', 'question__subject_ref')
    search_fields = ('question__text', 'attempt__quiz__title', 'attempt__user__username')
    autocomplete_fields = ('attempt', 'question', 'selected_choice')


@admin.register(GameResponse)
class GameResponseAdmin(admin.ModelAdmin):
    list_display = ('session', 'player', 'question', 'selected_choice', 'is_correct', 'answered_at')
    list_filter = ('is_correct', 'session')
    search_fields = ('session__code', 'player__name', 'question__text')
    autocomplete_fields = ('session', 'player', 'question', 'selected_choice')
