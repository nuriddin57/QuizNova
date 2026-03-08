from django.conf import settings
from django.contrib import admin

from .models import UniversityIntegrationStatus


@admin.register(UniversityIntegrationStatus)
class UniversityIntegrationStatusAdmin(admin.ModelAdmin):
    list_display = (
        'provider_key',
        'oauth_enabled',
        'sync_enabled',
        'csv_enabled',
        'last_students_sync_at',
        'last_teachers_sync_at',
        'last_subjects_sync_at',
        'updated_at',
    )
    readonly_fields = (
        'provider_key',
        'oauth_enabled',
        'sync_enabled',
        'csv_enabled',
        'last_status_check_at',
        'last_students_sync_at',
        'last_teachers_sync_at',
        'last_subjects_sync_at',
        'last_students_sync_result',
        'last_teachers_sync_result',
        'last_subjects_sync_result',
        'imported_students_count',
        'imported_teachers_count',
        'imported_subjects_count',
        'updated_at',
        'created_at',
        'configured_endpoints',
    )

    fieldsets = (
        ('Provider', {'fields': ('provider_key', 'configured_endpoints')}),
        ('Capabilities', {'fields': ('oauth_enabled', 'sync_enabled', 'csv_enabled', 'last_status_check_at')}),
        ('Student Sync', {'fields': ('last_students_sync_at', 'imported_students_count', 'last_students_sync_result')}),
        ('Teacher Sync', {'fields': ('last_teachers_sync_at', 'imported_teachers_count', 'last_teachers_sync_result')}),
        ('Subject Sync', {'fields': ('last_subjects_sync_at', 'imported_subjects_count', 'last_subjects_sync_result')}),
        ('Audit', {'fields': ('created_at', 'updated_at')}),
    )

    def has_add_permission(self, request):
        return not UniversityIntegrationStatus.objects.exists()

    @admin.display(description='Configured environment endpoints')
    def configured_endpoints(self, obj):
        labels = {
            'Auth URL': settings.UNIVERSITY_AUTH_URL,
            'Token URL': settings.UNIVERSITY_TOKEN_URL,
            'Userinfo URL': settings.UNIVERSITY_USERINFO_URL,
            'Students endpoint': settings.UNIVERSITY_STUDENTS_ENDPOINT,
            'Teachers endpoint': settings.UNIVERSITY_TEACHERS_ENDPOINT,
            'Subjects endpoint': settings.UNIVERSITY_SUBJECTS_ENDPOINT,
        }
        return '\n'.join(f'{label}: {value or "not configured"}' for label, value in labels.items())
