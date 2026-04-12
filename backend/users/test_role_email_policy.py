from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


User = get_user_model()


class RoleEmailPolicyApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_student_rejects_invalid_domain(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'student@gmail.com',
                'password': 'StrongPass123!',
                'full_name': 'Student Invalid',
                'role': 'student',
                'student_profile': {
                    'university': 'Sharda',
                    'faculty': 'Engineering',
                    'semester': 1,
                    'group': 'A1',
                    'student_id': '20260001',
                },
            },
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data.get('email', [None])[0],
            'Students must use an email ending with @ug.shardauniversity.uz',
        )

    def test_register_parent_allows_any_valid_email_domain(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'parent.personal@gmail.com',
                'password': 'StrongPass123!',
                'full_name': 'Parent User',
                'role': 'parent',
                'parent_profile': {
                    'relationship': 'Mother',
                    'notes': 'N/A',
                    'linked_students': [],
                },
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['user']['role'], 'parent')
        self.assertEqual(response.data['user']['email'], 'parent.personal@gmail.com')

    def test_login_rejects_selected_teacher_role_with_non_teacher_domain(self):
        student = User.objects.create_user(
            email='student.rolecheck@ug.shardauniversity.uz',
            password='StrongPass123!',
            role='student',
            is_verified=True,
            university_domain_verified=True,
        )
        self.assertEqual(student.role, 'student')

        response = self.client.post(
            '/api/auth/login/',
            {
                'email': 'student.rolecheck@ug.shardauniversity.uz',
                'password': 'StrongPass123!',
                'role': 'teacher',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data.get('email', [None])[0],
            'Teachers must use an email ending with @shardauniversity.uz',
        )

    def test_login_blocks_legacy_teacher_account_with_invalid_domain(self):
        teacher = User.objects.create_user(
            email='good.teacher@shardauniversity.uz',
            password='StrongPass123!',
            role='teacher',
            is_verified=True,
            university_domain_verified=True,
        )
        User.objects.filter(pk=teacher.pk).update(email='legacy.teacher@gmail.com')

        response = self.client.post(
            '/api/auth/login/',
            {
                'email': 'legacy.teacher@gmail.com',
                'password': 'StrongPass123!',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data.get('email', [None])[0],
            'Teachers must use an email ending with @shardauniversity.uz',
        )

    def test_login_parent_allows_any_valid_email_domain(self):
        parent = User.objects.create_user(
            email='parent.anydomain@yahoo.com',
            password='StrongPass123!',
            role='parent',
            is_verified=True,
            university_domain_verified=True,
        )
        self.assertEqual(parent.role, 'parent')

        response = self.client.post(
            '/api/auth/login/',
            {
                'email': 'parent.anydomain@yahoo.com',
                'password': 'StrongPass123!',
                'role': 'parent',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['role'], 'parent')

    def test_login_rejects_admin_account_when_teacher_role_selected(self):
        admin_user = User.objects.create_user(
            email='admin.user@shardauniversity.uz',
            password='StrongPass123!',
            role='admin',
            is_verified=True,
            university_domain_verified=True,
        )
        self.assertEqual(admin_user.role, 'admin')

        response = self.client.post(
            '/api/auth/login/',
            {
                'email': 'admin.user@shardauniversity.uz',
                'password': 'StrongPass123!',
                'role': 'teacher',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data.get('non_field_errors', [None])[0], 'Selected role does not match the account role.')
