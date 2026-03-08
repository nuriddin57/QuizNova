from django.contrib import admin

from .models import Programme, StudyField


@admin.register(Programme)
class ProgrammeAdmin(admin.ModelAdmin):
    list_display = ('title', 'code', 'is_active', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('title', 'code', 'description')


@admin.register(StudyField)
class StudyFieldAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'programme', 'department', 'is_active', 'updated_at')
    list_filter = ('programme', 'is_active')
    search_fields = ('name', 'code', 'department')
    autocomplete_fields = ('programme',)
