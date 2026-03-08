from django.db import models


class UniversityIntegrationStatus(models.Model):
    provider_key = models.CharField(max_length=80, unique=True, default='sharda')
    oauth_enabled = models.BooleanField(default=False)
    sync_enabled = models.BooleanField(default=False)
    csv_enabled = models.BooleanField(default=True)
    last_status_check_at = models.DateTimeField(null=True, blank=True)
    last_students_sync_at = models.DateTimeField(null=True, blank=True)
    last_teachers_sync_at = models.DateTimeField(null=True, blank=True)
    last_subjects_sync_at = models.DateTimeField(null=True, blank=True)
    last_students_sync_result = models.JSONField(default=dict, blank=True)
    last_teachers_sync_result = models.JSONField(default=dict, blank=True)
    last_subjects_sync_result = models.JSONField(default=dict, blank=True)
    imported_students_count = models.PositiveIntegerField(default=0)
    imported_teachers_count = models.PositiveIntegerField(default=0)
    imported_subjects_count = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'University integration status'
        verbose_name_plural = 'University integration statuses'

    def __str__(self):
        return f'{self.provider_key} integration status'
