import re

from django.core.exceptions import ValidationError


STUDENT_EMAIL_DOMAIN = '@ug.shardauniversity.uz'
TEACHER_EMAIL_DOMAIN = '@shardauniversity.uz'

STUDENT_DOMAIN_ERROR_MESSAGE = 'Students must use an email ending with @ug.shardauniversity.uz'
TEACHER_DOMAIN_ERROR_MESSAGE = 'Teachers must use an email ending with @shardauniversity.uz'

# Kept for compatibility if any legacy checks still import this symbol.
TEACHER_EMAIL_PATTERN = re.compile(r'.+@shardauniversity\.uz$')

def normalize_email(email):
    return (email or '').strip().lower()


def is_student_email(email):
    normalized = normalize_email(email)
    return normalized.endswith(STUDENT_EMAIL_DOMAIN)


def is_teacher_email_domain(email):
    normalized = normalize_email(email)
    return normalized.endswith(TEACHER_EMAIL_DOMAIN) and not normalized.endswith(STUDENT_EMAIL_DOMAIN)


def is_teacher_email_style(email):
    return True


def validate_student_email(email):
    if not is_student_email(email):
        raise ValidationError(STUDENT_DOMAIN_ERROR_MESSAGE)


def validate_teacher_email(email):
    if not is_teacher_email_domain(email):
        raise ValidationError(TEACHER_DOMAIN_ERROR_MESSAGE)


def validate_role_email_match(role, email, allow_admin=True):
    if role == 'student':
        validate_student_email(email)
    elif role == 'teacher':
        validate_teacher_email(email)
    elif role == 'parent' or (allow_admin and role == 'admin'):
        return
    else:
        raise ValidationError('Invalid role for login.')
