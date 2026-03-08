from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='UniversityIntegrationStatus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('provider_key', models.CharField(default='sharda', max_length=80, unique=True)),
                ('oauth_enabled', models.BooleanField(default=False)),
                ('sync_enabled', models.BooleanField(default=False)),
                ('csv_enabled', models.BooleanField(default=True)),
                ('last_status_check_at', models.DateTimeField(blank=True, null=True)),
                ('last_students_sync_at', models.DateTimeField(blank=True, null=True)),
                ('last_teachers_sync_at', models.DateTimeField(blank=True, null=True)),
                ('last_subjects_sync_at', models.DateTimeField(blank=True, null=True)),
                ('last_students_sync_result', models.JSONField(blank=True, default=dict)),
                ('last_teachers_sync_result', models.JSONField(blank=True, default=dict)),
                ('last_subjects_sync_result', models.JSONField(blank=True, default=dict)),
                ('imported_students_count', models.PositiveIntegerField(default=0)),
                ('imported_teachers_count', models.PositiveIntegerField(default=0)),
                ('imported_subjects_count', models.PositiveIntegerField(default=0)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'University integration status',
                'verbose_name_plural': 'University integration statuses',
            },
        ),
    ]
