from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


class AIPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.teacher = get_user_model().objects.create_user(
            username='teacher_ai',
            email='ali.khan@shardauniversity.uz',
            role='teacher',
            is_verified=True,
            university_domain_verified=True,
        )
        self.teacher.set_password('StrongPass123!')
        self.teacher.save(update_fields=['password'])
        self.student = get_user_model().objects.create_user(
            username='student_ai',
            email='student_ai@ug.shardauniversity.uz',
            student_id='202412312',
            role='student',
            is_verified=True,
            university_domain_verified=True,
        )
        self.student.set_password('StrongPass123!')
        self.student.save(update_fields=['password'])

    def test_teacher_can_generate_ai_questions(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.post(
            '/api/ai/questions/generate/',
            {
                'field_of_study_name': 'Computer Science',
                'subject': 'Algorithms',
                'topic': 'Sorting',
                'difficulty': 'medium',
                'number_of_questions': 3,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data.get('questions') or []), 3)

    def test_student_cannot_generate_ai_questions(self):
        self.client.force_authenticate(self.student)
        response = self.client.post(
            '/api/ai/questions/generate/',
            {
                'field_of_study_name': 'Computer Science',
                'subject': 'Algorithms',
                'topic': 'Sorting',
                'difficulty': 'easy',
                'number_of_questions': 2,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 403)
