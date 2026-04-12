import csv
import io
import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone

from fields.models import StudyField
from users.models import User
from users.validators import normalize_email, validate_role_email_match

from integrations.models import UniversityIntegrationStatus
from integrations.providers.base import UniversityProviderError

logger = logging.getLogger(__name__)


STUDENT_REQUIRED_COLUMNS = {'email', 'full_name', 'university', 'faculty', 'semester', 'group', 'student_id'}
TEACHER_REQUIRED_COLUMNS = {'email', 'full_name', 'university', 'department', 'employee_id', 'subject_area'}


def _split_name(full_name):
    parts = [part for part in str(full_name or '').strip().split(' ') if part]
    if not parts:
        return '', ''
    if len(parts) == 1:
        return parts[0], ''
    return parts[0], ' '.join(parts[1:])


def _resolve_field(name):
    cleaned = str(name or '').strip()
    if not cleaned:
        return None
    field = StudyField.objects.filter(name__iexact=cleaned).first()
    if field:
        return field
    return StudyField.objects.create(code=cleaned.lower().replace(' ', '-'), name=cleaned)


def _read_csv_rows(file_obj, required_columns):
    content = file_obj.read()
    if isinstance(content, bytes):
        content = content.decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(content))
    headers = set(reader.fieldnames or [])
    missing = sorted(required_columns - headers)
    if missing:
        raise UniversityProviderError(f'CSV is missing required columns: {", ".join(missing)}')
    return list(reader)


@transaction.atomic
def sync_university_user(normalized_user):
    email = normalize_email(normalized_user['email'])
    full_name = normalized_user.get('full_name', '').strip()
    role = normalized_user['role']
    try:
        validate_role_email_match(role, email, allow_admin=True)
    except DjangoValidationError as exc:
        raise UniversityProviderError(exc.messages[0])
    first_name, last_name = _split_name(full_name)

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'full_name': full_name,
            'first_name': first_name,
            'last_name': last_name,
            'role': role,
            'is_verified': True,
            'university_domain_verified': True,
            'is_active': True,
        },
    )

    changed = created
    for field, value in {
        'full_name': full_name,
        'first_name': first_name,
        'last_name': last_name,
        'role': role,
        'is_verified': True,
        'university_domain_verified': True,
        'is_active': True,
    }.items():
        if getattr(user, field) != value:
            setattr(user, field, value)
            changed = True

    if role == User.ROLE_STUDENT:
        profile_data = normalized_user.get('student_profile') or {}
        profile = user.student_profile
        field_of_study = _resolve_field(profile_data.get('faculty'))
        if field_of_study:
            user.field_of_study = field_of_study
        user.semester_number = int(profile_data.get('semester') or user.semester_number or 1)
        user.section = str(profile_data.get('group') or user.section or '').strip()
        user.student_id = str(profile_data.get('student_id') or user.student_id or '').strip() or None
        user.save()

        for field, value in profile_data.items():
            if field == 'semester' and value not in (None, ''):
                value = int(value)
            setattr(profile, field, value)
        profile.save()
        return user, created

    profile_data = normalized_user.get('teacher_profile') or {}
    user.teacher_department = str(profile_data.get('department') or user.teacher_department or '').strip()
    user.department = str(profile_data.get('subject_area') or user.department or '').strip()
    user.save()

    profile = user.teacher_profile
    for field, value in profile_data.items():
        setattr(profile, field, value)
    profile.save()
    return user, created


def _update_status_field(status, sync_type, result):
    now = timezone.now()
    setattr(status, f'last_{sync_type}_sync_at', now)
    setattr(status, f'last_{sync_type}_sync_result', result)
    imported_count = int(result.get('created', 0)) + int(result.get('updated', 0))
    setattr(status, f'imported_{sync_type}_count', imported_count)
    status.save()


def _sync_users(records, role, status):
    result = {
        'created': 0,
        'updated': 0,
        'failed': 0,
        'errors': [],
    }

    for record in records:
        try:
            normalized = dict(record)
            normalized['role'] = role
            user, created = sync_university_user(normalized)
            if created:
                result['created'] += 1
            else:
                result['updated'] += 1
        except Exception as exc:
            logger.exception('University %s sync failed for record.', role)
            result['failed'] += 1
            result['errors'].append(str(exc))

    _update_status_field(status, 'students' if role == User.ROLE_STUDENT else 'teachers', result)
    return result


def sync_students(provider, csv_file=None):
    status, _ = UniversityIntegrationStatus.objects.get_or_create(provider_key=provider.provider_key)
    if csv_file is not None:
        rows = _read_csv_rows(csv_file, STUDENT_REQUIRED_COLUMNS)
        records = [
            {
                'email': row['email'],
                'full_name': row['full_name'],
                'role': User.ROLE_STUDENT,
                'student_profile': {
                    'university': row['university'],
                    'faculty': row['faculty'],
                    'semester': row['semester'],
                    'group': row['group'],
                    'student_id': row['student_id'],
                },
            }
            for row in rows
        ]
    else:
        records = [provider.normalize_user(item) for item in provider.fetch_students()]
    return _sync_users(records, User.ROLE_STUDENT, status)


def sync_teachers(provider, csv_file=None):
    status, _ = UniversityIntegrationStatus.objects.get_or_create(provider_key=provider.provider_key)
    if csv_file is not None:
        rows = _read_csv_rows(csv_file, TEACHER_REQUIRED_COLUMNS)
        records = [
            {
                'email': row['email'],
                'full_name': row['full_name'],
                'role': User.ROLE_TEACHER,
                'teacher_profile': {
                    'university': row['university'],
                    'department': row['department'],
                    'employee_id': row['employee_id'],
                    'subject_area': row['subject_area'],
                },
            }
            for row in rows
        ]
    else:
        records = [provider.normalize_user(item) for item in provider.fetch_teachers()]
    return _sync_users(records, User.ROLE_TEACHER, status)
