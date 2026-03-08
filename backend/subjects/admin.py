from django.contrib import admin

from .models import Module, Subject, Topic


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'field_of_study', 'semester', 'credits', 'is_active')
    list_filter = ('field_of_study', 'semester', 'is_active')
    search_fields = ('code', 'name', 'description')


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'unit_name', 'is_active', 'updated_at')
    list_filter = ('subject', 'is_active')
    search_fields = ('name', 'unit_name', 'description', 'subject__name', 'subject__code')


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'topic', 'order', 'is_active', 'updated_at')
    list_filter = ('is_active', 'topic__subject', 'topic')
    search_fields = ('title', 'description', 'topic__name', 'topic__subject__name', 'topic__subject__code')
    autocomplete_fields = ('topic',)
