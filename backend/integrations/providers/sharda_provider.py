from django.utils.text import slugify

from .base import BaseUniversityProvider, UniversityProviderError


class ShardaProvider(BaseUniversityProvider):
    provider_key = 'sharda'

    def _pick(self, source, *keys, default=''):
        for key in keys:
            value = source.get(key)
            if value not in (None, ''):
                return value
        return default

    def map_remote_role(self, remote_user):
        role = str(self._pick(remote_user, 'role', 'user_role', 'userType', 'type', default='')).strip().lower()
        designation = str(self._pick(remote_user, 'designation', 'employee_type', default='')).strip().lower()
        email = str(self._pick(remote_user, 'email', 'mail', default='')).strip().lower()

        if role in {'admin', 'administrator'}:
            return 'admin'
        if role in {'teacher', 'faculty', 'lecturer', 'staff'} or designation in {'teacher', 'faculty', 'lecturer', 'professor'}:
            return 'teacher'
        if role in {'student', 'learner'}:
            return 'student'
        if '@ug.' in email:
            return 'student'
        if email.endswith('@shardauniversity.uz'):
            return 'teacher'
        raise UniversityProviderError('Unable to map university user role.')

    def normalize_user(self, remote_user):
        role = self.map_remote_role(remote_user)
        email = str(self._pick(remote_user, 'email', 'mail')).strip().lower()
        if not email:
            raise UniversityProviderError('University user payload does not include an email address.')

        full_name = self._pick(remote_user, 'full_name', 'fullName', 'name', 'display_name')
        if not full_name:
            first_name = str(self._pick(remote_user, 'first_name', 'firstName')).strip()
            last_name = str(self._pick(remote_user, 'last_name', 'lastName')).strip()
            full_name = ' '.join(part for part in (first_name, last_name) if part).strip()

        normalized = {
            'email': email,
            'full_name': full_name,
            'role': role,
        }

        if role == 'student':
            normalized['student_profile'] = {
                'university': self._pick(remote_user, 'university', default='Sharda University'),
                'faculty': self._pick(remote_user, 'faculty', 'school', 'programme', 'program'),
                'semester': int(self._pick(remote_user, 'semester', 'semester_number', default=1) or 1),
                'group': str(self._pick(remote_user, 'group', 'section', 'batch')).strip(),
                'student_id': str(self._pick(remote_user, 'student_id', 'studentId', 'registration_no', 'enrollment_number')).strip(),
            }
        else:
            normalized['teacher_profile'] = {
                'university': self._pick(remote_user, 'university', default='Sharda University'),
                'department': self._pick(remote_user, 'department', 'faculty_department', 'school'),
                'employee_id': str(self._pick(remote_user, 'employee_id', 'employeeId', 'staff_id')).strip(),
                'subject_area': self._pick(remote_user, 'subject_area', 'subjectArea', 'specialization', 'discipline'),
            }

        return normalized

    def normalize_subject(self, remote_subject):
        name = self._pick(remote_subject, 'name', 'subject_name', 'title')
        code = str(self._pick(remote_subject, 'code', 'subject_code', 'subjectId')).strip()
        if not name or not code:
            raise UniversityProviderError('University subject payload must include name and code.')

        field_name = self._pick(remote_subject, 'field_of_study', 'programme', 'program', 'faculty', default='General')
        programme_name = self._pick(remote_subject, 'programme', 'program', default='General Programme')

        return {
            'name': name,
            'code': code,
            'description': self._pick(remote_subject, 'description', 'summary'),
            'department': self._pick(remote_subject, 'department', 'school'),
            'semester': int(self._pick(remote_subject, 'semester', 'semester_number', default=1) or 1),
            'semester_code': str(self._pick(remote_subject, 'semester_code', 'term_code')).strip(),
            'credits': self._pick(remote_subject, 'credits', default=None),
            'field_name': field_name,
            'field_code': slugify(str(self._pick(remote_subject, 'field_code', default=field_name))) or 'general',
            'programme_name': programme_name,
            'programme_code': slugify(str(self._pick(remote_subject, 'programme_code', default=programme_name))) or 'general-programme',
        }
