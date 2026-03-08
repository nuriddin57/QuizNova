from django.db import migrations


DEFAULT_FIELDS = [
    ('computer-science', 'Computer Science'),
    ('software-engineering', 'Software Engineering'),
    ('data-science', 'Data Science'),
    ('business-administration', 'Business Administration'),
    ('law', 'Law'),
    ('pharmacy', 'Pharmacy'),
    ('nursing', 'Nursing'),
    ('architecture', 'Architecture'),
    ('civil-engineering', 'Civil Engineering'),
    ('mechanical-engineering', 'Mechanical Engineering'),
    ('english', 'English'),
    ('finance', 'Finance'),
    ('economics', 'Economics'),
]


def seed_fields(apps, schema_editor):
    StudyField = apps.get_model('fields', 'StudyField')
    for code, name in DEFAULT_FIELDS:
        StudyField.objects.get_or_create(
            code=code,
            defaults={'name': name, 'description': f'{name} academic direction'},
        )


def reverse_seed_fields(apps, schema_editor):
    StudyField = apps.get_model('fields', 'StudyField')
    StudyField.objects.filter(code__in=[code for code, _ in DEFAULT_FIELDS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('fields', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_fields, reverse_seed_fields),
    ]
