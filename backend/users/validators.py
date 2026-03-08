import re

from django.core.exceptions import ValidationError


STUDENT_EMAIL_DOMAIN = '@ug.shardauniversity.uz'
TEACHER_EMAIL_DOMAIN = '@shardauniversity.uz'
TEACHER_EMAIL_PATTERN = re.compile(r'^[a-z]+(?:[._-][a-z]+)*@shardauniversity\.uz$')


def normalize_email(email):
    return (email or '').strip().lower()


def is_student_email(email):
    normalized = normalize_email(email)
    return normalized.endswith(STUDENT_EMAIL_DOMAIN)


def is_teacher_email_domain(email):
    normalized = normalize_email(email)
    return normalized.endswith(TEACHER_EMAIL_DOMAIN) and not normalized.endswith(STUDENT_EMAIL_DOMAIN)


def is_teacher_email_style(email):
    normalized = normalize_email(email)
    return bool(TEACHER_EMAIL_PATTERN.match(normalized))


def validate_student_email(email):
    if not is_student_email(email):
        raise ValidationError('Student email must end with @ug.shardauniversity.uz.')


def validate_teacher_email(email):
    if not is_teacher_email_domain(email):
        raise ValidationError('Teacher email must end with @shardauniversity.uz.')
    if not is_teacher_email_style(email):
        raise ValidationError('Teacher email must follow firstname.lastname@shardauniversity.uz format.')


def validate_role_email_match(role, email):
    if role == 'student':
        validate_student_email(email)
    elif role == 'teacher':
        validate_teacher_email(email)
    else:
        raise ValidationError('Invalid role for login.')
