import csv
import io
import logging

from django.db import transaction
from django.utils import timezone

from fields.models import Programme, StudyField
from subjects.models import Subject

from integrations.models import UniversityIntegrationStatus
from integrations.providers.base import UniversityProviderError

logger = logging.getLogger(__name__)

SUBJECT_REQUIRED_COLUMNS = {'name', 'code', 'field_name'}


def _read_csv_rows(file_obj):
    content = file_obj.read()
    if isinstance(content, bytes):
        content = content.decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(content))
    headers = set(reader.fieldnames or [])
    missing = sorted(SUBJECT_REQUIRED_COLUMNS - headers)
    if missing:
        raise UniversityProviderError(f'CSV is missing required columns: {", ".join(missing)}')
    return list(reader)


def _get_or_create_programme(code, name):
    program_code = (code or name or 'general-programme').strip().lower().replace(' ', '-')
    programme, _ = Programme.objects.get_or_create(
        code=program_code,
        defaults={'title': name or 'General Programme'},
    )
    if name and programme.title != name:
        programme.title = name
        programme.save(update_fields=['title', 'updated_at'])
    return programme


def _get_or_create_field(code, name, department, programme):
    field_code = (code or name or 'general').strip().lower().replace(' ', '-')
    field, _ = StudyField.objects.get_or_create(
        code=field_code,
        defaults={'name': name or 'General', 'department': department or '', 'programme': programme},
    )
    changed = False
    for attr, value in {'name': name or field.name, 'department': department or '', 'programme': programme}.items():
        if getattr(field, attr) != value:
            setattr(field, attr, value)
            changed = True
    if changed:
        field.save()
    return field


@transaction.atomic
def sync_subjects(provider, csv_file=None):
    status, _ = UniversityIntegrationStatus.objects.get_or_create(provider_key=provider.provider_key)
    raw_subjects = _read_csv_rows(csv_file) if csv_file is not None else provider.fetch_subjects()

    result = {
        'created': 0,
        'updated': 0,
        'failed': 0,
        'errors': [],
    }

    for raw_subject in raw_subjects:
        try:
            normalized = raw_subject if csv_file is not None else provider.normalize_subject(raw_subject)
            credits = normalized.get('credits')
            credits = int(credits) if credits not in (None, '') else None
            programme = _get_or_create_programme(normalized.get('programme_code'), normalized.get('programme_name'))
            field = _get_or_create_field(
                normalized.get('field_code'),
                normalized.get('field_name'),
                normalized.get('department'),
                programme,
            )
            subject, created = Subject.objects.get_or_create(
                field_of_study=field,
                semester=int(normalized.get('semester') or 1),
                code=normalized['code'],
                defaults={
                    'name': normalized['name'],
                    'description': normalized.get('description', ''),
                    'department': normalized.get('department', ''),
                    'semester_code': normalized.get('semester_code', ''),
                    'credits': credits,
                    'programme': programme,
                    'is_active': True,
                },
            )
            if created:
                result['created'] += 1
            else:
                changed = False
                for attr, value in {
                    'name': normalized['name'],
                    'description': normalized.get('description', ''),
                    'department': normalized.get('department', ''),
                    'semester_code': normalized.get('semester_code', ''),
                    'credits': credits,
                    'programme': programme,
                    'is_active': True,
                }.items():
                    if getattr(subject, attr) != value:
                        setattr(subject, attr, value)
                        changed = True
                if changed:
                    subject.save()
                result['updated'] += 1
        except Exception as exc:
            logger.exception('University subject sync failed for record.')
            result['failed'] += 1
            result['errors'].append(str(exc))

    now = timezone.now()
    status.last_subjects_sync_at = now
    status.last_subjects_sync_result = result
    status.imported_subjects_count = int(result['created']) + int(result['updated'])
    status.save()
    return result
