from django.contrib import admin

from .models import Testimonial, WeeklyChallenge


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'school', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'created_at')
    search_fields = ('name', 'school', 'quote')
    list_editable = ('is_active',)


@admin.register(WeeklyChallenge)
class WeeklyChallengeAdmin(admin.ModelAdmin):
    list_display = ('title', 'code', 'deadline', 'is_active', 'created_at')
    list_filter = ('is_active', 'deadline', 'created_at')
    search_fields = ('title', 'code', 'description', 'reward')
    list_editable = ('is_active',)

