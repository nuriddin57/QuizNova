from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from fields.models import StudyField


class UniversityAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.field, _ = StudyField.objects.get_or_create(code='computer-science', defaults={'name': 'Computer Science'})
        self.student = get_user_model().objects.create_user(
            username='student1',
            full_name='Student One',
            email='student1@ug.shardauniversity.uz',
            student_id='202400123',
            role='student',
            field_of_study=self.field,
            is_verified=True,
            university_domain_verified=True,
        )
        self.student.set_password('StrongPass123!')
        self.student.save(update_fields=['password'])
        self.teacher = get_user_model().objects.create_user(
            username='john.doe',
            full_name='John Doe',
            email='john.doe@shardauniversity.uz',
            role='teacher',
            teacher_department='Computer Science',
            is_verified=True,
            university_domain_verified=True,
        )
        self.teacher.set_password('StrongPass123!')
        self.teacher.save(update_fields=['password'])

    def test_student_can_login_with_student_id(self):
        response = self.client.post(
            '/api/auth/login/student-id/',
            {'student_id': '202400123', 'password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertEqual(response.data.get('role'), 'student')

    def test_student_can_login_with_student_email(self):
        response = self.client.post(
            '/api/auth/login/student-email/',
            {'email': 'student1@ug.shardauniversity.uz', 'password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get('role'), 'student')

    def test_teacher_login_rejects_non_university_email(self):
        response = self.client.post(
            '/api/auth/login/teacher-email/',
            {'email': 'teacher@yahoo.com', 'password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('email', response.data)

    def test_teacher_login_rejects_non_name_style(self):
        bad_teacher = get_user_model().objects.create_user(
            username='teacher01',
            email='teacher01@shardauniversity.uz',
            role='teacher',
            is_verified=True,
            university_domain_verified=True,
        )
        bad_teacher.set_password('StrongPass123!')
        bad_teacher.save(update_fields=['password'])
        response = self.client.post(
            '/api/auth/login/teacher-email/',
            {'email': 'teacher01@shardauniversity.uz', 'password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('firstname.lastname', str(response.data))

    def test_unverified_user_is_denied(self):
        self.student.is_verified = False
        self.student.save(update_fields=['is_verified'])
        response = self.client.post(
            '/api/auth/login/student-id/',
            {'student_id': '202400123', 'password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('verified', str(response.data))

    def test_public_register_is_disabled(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'username': 'new_user',
                'email': 'new@ug.shardauniversity.uz',
                'password': 'StrongPass123!',
                'role': 'student',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 403)
