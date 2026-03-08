import re

from django.db import migrations, models
import django.db.models.deletion


def deduplicate_user_emails(apps, schema_editor):
    User = apps.get_model('users', 'User')
    used_emails = set()

    def sanitize_email(value, user_id):
        raw = str(value or '').strip().lower()
        if '@' in raw:
            local_part, domain = raw.split('@', 1)
        else:
            local_part, domain = '', ''

        local_part = re.sub(r'[^a-z0-9._+-]+', '', local_part) or f'user{user_id}'
        domain = re.sub(r'[^a-z0-9.-]+', '', domain) or 'quiznova.local'
        return f'{local_part}@{domain}'

    def ensure_unique(base_email, user_id):
        local_part, domain = base_email.split('@', 1)
        candidate = base_email
        suffix = 1
        while candidate in used_emails:
            candidate = f'{local_part}+{user_id}_{suffix}@{domain}'
            suffix += 1
        return candidate

    for user in User.objects.all().order_by('id').iterator():
        normalized_email = sanitize_email(user.email, user.id)
        unique_email = ensure_unique(normalized_email, user.id)
        if user.email != unique_email:
            user.email = unique_email
            user.save(update_fields=['email'])
        used_emails.add(unique_email)


def seed_role_profiles(apps, schema_editor):
    User = apps.get_model('users', 'User')
    StudentProfile = apps.get_model('users', 'StudentProfile')
    TeacherProfile = apps.get_model('users', 'TeacherProfile')

    for user in User.objects.all().iterator():
        if user.role == 'student':
            StudentProfile.objects.get_or_create(
                user=user,
                defaults={
                    'university': '',
                    'faculty': '',
                    'semester': user.semester_number or None,
                    'group': user.section or '',
                    'student_id': user.student_id or '',
                },
            )
        if user.role in {'teacher', 'admin'}:
            TeacherProfile.objects.get_or_create(
                user=user,
                defaults={
                    'university': '',
                    'department': user.teacher_department or user.department or '',
                    'employee_id': '',
                    'subject_area': user.department or '',
                },
            )


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_user_assigned_fields_user_assigned_semester_codes_and_more'),
    ]

    operations = [
        migrations.RunPython(deduplicate_user_emails, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(db_index=True, max_length=254, unique=True, verbose_name='email address'),
        ),
        migrations.CreateModel(
            name='StudentProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('university', models.CharField(blank=True, max_length=255)),
                ('faculty', models.CharField(blank=True, max_length=255)),
                ('semester', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('group', models.CharField(blank=True, max_length=50)),
                ('student_id', models.CharField(blank=True, db_index=True, max_length=32)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='student_profile', to='users.user')),
            ],
        ),
        migrations.CreateModel(
            name='TeacherProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('university', models.CharField(blank=True, max_length=255)),
                ('department', models.CharField(blank=True, max_length=255)),
                ('employee_id', models.CharField(blank=True, db_index=True, max_length=32)),
                ('subject_area', models.CharField(blank=True, max_length=255)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='teacher_profile', to='users.user')),
            ],
        ),
        migrations.RunPython(seed_role_profiles, migrations.RunPython.noop),
    ]
