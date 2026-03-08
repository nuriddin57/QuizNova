from django.contrib import admin

from .models import Choice, Question, QuestionBank, Quiz, QuizQuestion


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 0


class QuestionInline(admin.StackedInline):
    model = Question
    extra = 0


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject', 'semester', 'quiz_type', 'is_published', 'owner', 'created_at')
    list_filter = ('quiz_type', 'difficulty', 'semester', 'is_published', 'subject_ref', 'topic_ref', 'module_ref', 'target_field_of_study', 'target_semester_code', 'target_semester_number', 'target_section')
    search_fields = ('title', 'subject', 'description')
    autocomplete_fields = ('owner', 'subject_ref', 'topic_ref', 'module_ref')
    filter_horizontal = ('assigned_fields',)
    inlines = [QuestionInline]


@admin.register(QuestionBank)
class QuestionBankAdmin(admin.ModelAdmin):
    list_display = ('id', 'subject_ref', 'topic', 'module_ref', 'difficulty', 'question_type', 'marks', 'created_by', 'updated_at')
    list_filter = ('subject_ref', 'topic_ref', 'module_ref', 'difficulty', 'question_type', 'semester', 'field_of_study')
    search_fields = ('question_text', 'topic', 'unit_name', 'subject_ref__name', 'subject_ref__code')
    autocomplete_fields = ('subject_ref', 'topic_ref', 'module_ref', 'field_of_study', 'created_by')


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'quiz', 'subject_ref', 'topic_ref', 'module_ref', 'question_type', 'difficulty', 'marks', 'order')
    list_filter = ('question_type', 'difficulty', 'subject_ref', 'topic_ref', 'module_ref')
    search_fields = ('text', 'explanation')
    autocomplete_fields = ('quiz', 'subject_ref', 'topic_ref', 'module_ref')


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ('quiz', 'question', 'question_bank_reference', 'order', 'created_at')
    list_filter = ('quiz',)
    autocomplete_fields = ('quiz', 'question', 'question_bank_reference')


@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'question', 'text', 'is_correct', 'order')
    list_filter = ('is_correct', 'question__question_type')
    search_fields = ('text', 'question__text')
    autocomplete_fields = ('question',)
