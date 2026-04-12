from django.contrib.auth.hashers import check_password, make_password
from django.db import migrations


DEMO_EMAILS = [
    'john.doe@shardauniversity.uz',
    'demo.student1@ug.shardauniversity.uz',
    'demo.student2@ug.shardauniversity.uz',
    'demo.student3@ug.shardauniversity.uz',
]


def set_demo_passwords(apps, schema_editor):
    User = apps.get_model('users', 'User')
    for user in User.objects.filter(email__in=DEMO_EMAILS):
        if not user.password or not check_password('demo1234', user.password):
            user.password = make_password('demo1234')
            user.save(update_fields=['password'])


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0006_user_avatar_user_language_preference_user_school_and_more'),
    ]

    operations = [
        migrations.RunPython(set_demo_passwords, migrations.RunPython.noop),
    ]
