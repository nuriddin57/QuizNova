from django.contrib import admin
from .models import Quiz, Question, Choice


class ChoiceInline(admin.TabularInline):
    model = Choice


class QuestionInline(admin.StackedInline):
    model = Question
    inlines = [ChoiceInline]


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'created_at')
    inlines = [QuestionInline]
