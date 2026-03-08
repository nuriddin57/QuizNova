from django.db import migrations


SUBJECT_CATALOG = {
    'computer-science': [
        ('CS101', 'Introduction to Programming', 1, 4, [('Programming Basics', 'Variables and Types'), ('Control Flow', 'Loops and Conditions')]),
        ('CS202', 'Data Structures', 3, 4, [('Trees', 'Binary Trees'), ('Graphs', 'Traversal')]),
        ('CS301', 'Database Systems', 4, 4, [('SQL Fundamentals', 'Queries and Joins'), ('Normalization', 'Schema Design')]),
        ('CS302', 'Operating Systems', 4, 4, [('Processes', 'Scheduling'), ('Memory Management', 'Paging')]),
        ('CS303', 'Software Engineering', 5, 3, [('Requirements', 'User Stories'), ('Testing', 'QA')]),
    ],
    'business-administration': [
        ('BM101', 'Business Management', 1, 3, [('Management Principles', 'Planning'), ('Organization', 'Leadership')]),
    ],
    'law': [
        ('LAW104', 'Constitutional Law', 2, 3, [('Constitution Basics', 'Fundamental Rights'), ('Judiciary', 'Constitutional Review')]),
    ],
    'pharmacy': [
        ('PHAR201', 'Pharmacology', 2, 4, [('Drug Classifications', 'Therapeutics'), ('Dosage Forms', 'Administration')]),
    ],
    'civil-engineering': [
        ('CE101', 'Civil Engineering Basics', 1, 3, [('Materials', 'Concrete'), ('Structures', 'Loads')]),
    ],
    'english': [
        ('ENG101', 'English Communication', 1, 2, [('Academic Writing', 'Essays'), ('Presentations', 'Public Speaking')]),
    ],
}


def seed_subject_catalog(apps, schema_editor):
    StudyField = apps.get_model('fields', 'StudyField')
    Subject = apps.get_model('subjects', 'Subject')
    Topic = apps.get_model('subjects', 'Topic')

    for field_code, subjects in SUBJECT_CATALOG.items():
        field = StudyField.objects.filter(code=field_code).first()
        if not field:
            continue
        for code, name, semester, credits, topics in subjects:
            subject, _ = Subject.objects.update_or_create(
                code=code,
                defaults={
                    'name': name,
                    'description': f'{name} for Sharda University {field.name} students.',
                    'field_of_study': field,
                    'semester': semester,
                    'credits': credits,
                    'is_active': True,
                },
            )
            for topic_name, unit_name in topics:
                Topic.objects.update_or_create(
                    subject=subject,
                    name=topic_name,
                    unit_name=unit_name,
                    defaults={
                        'description': f'{topic_name} within {name}.',
                        'is_active': True,
                    },
                )


def reverse_subject_catalog(apps, schema_editor):
    Subject = apps.get_model('subjects', 'Subject')
    Subject.objects.filter(code__in=[code for subjects in SUBJECT_CATALOG.values() for code, *_ in subjects]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('subjects', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_subject_catalog, reverse_subject_catalog),
    ]
