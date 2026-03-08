from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


class QuizCompositionValidationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.teacher = get_user_model().objects.create_user(
            username='teacher_quiz',
            password='pass1234',
            role='teacher',
            is_verified=True,
            university_domain_verified=True,
        )
        self.admin_role_user = get_user_model().objects.create_user(
            username='admin_quiz',
            password='pass1234',
            role='admin',
            is_staff=False,
            is_verified=True,
            university_domain_verified=True,
        )
        self.student = get_user_model().objects.create_user(
            username='student_quiz',
            password='pass1234',
            role='student',
            student_id='202412399',
            email='student_quiz@ug.shardauniversity.uz',
            is_verified=True,
            university_domain_verified=True,
        )

    @staticmethod
    def _build_true_false_question(index, correct_answer='true'):
        return {
            'text': f'True/False question {index}',
            'timer_seconds': 20,
            'order': index - 1,
            'choices': [
                {'text': 'True', 'is_correct': correct_answer == 'true'},
                {'text': 'False', 'is_correct': correct_answer == 'false'},
            ],
        }

    @staticmethod
    def _build_abc_question(index, correct_answer='a'):
        return {
            'text': f'ABC question {index}',
            'timer_seconds': 20,
            'order': index - 1,
            'choices': [
                {'text': 'A', 'is_correct': correct_answer == 'a'},
                {'text': 'B', 'is_correct': correct_answer == 'b'},
                {'text': 'C', 'is_correct': correct_answer == 'c'},
            ],
        }

    def _valid_questions(self):
        questions = [self._build_true_false_question(i + 1, 'true' if i % 2 == 0 else 'false') for i in range(5)]
        questions.extend([self._build_abc_question(i + 6, 'abc'[i % 3]) for i in range(5)])
        return questions

    def _valid_payload(self):
        return {
            'title': 'Teacher Admin Panel Quiz',
            'description': 'Exactly 10 questions with required distribution.',
            'category': 'General',
            'questions': self._valid_questions(),
        }

    def test_teacher_can_create_quiz_with_required_distribution(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/quizzes/', self._valid_payload(), format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.data.get('questions', [])), 10)

    def test_admin_role_user_can_create_quiz(self):
        self.client.force_authenticate(user=self.admin_role_user)
        response = self.client.post('/api/quizzes/', self._valid_payload(), format='json')
        self.assertEqual(response.status_code, 201)

    def test_rejects_if_total_question_count_is_not_ten(self):
        payload = self._valid_payload()
        payload['questions'] = payload['questions'][:9]
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/quizzes/', payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('exactly 10 questions', str(response.data))

    def test_rejects_if_distribution_is_not_five_and_five(self):
        payload = self._valid_payload()
        payload['questions'] = (
            [self._build_true_false_question(i + 1) for i in range(6)]
            + [self._build_abc_question(i + 7) for i in range(4)]
        )
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/quizzes/', payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('exactly 5 True/False questions and 5 A/B/C questions', str(response.data))

    def test_rejects_if_question_choices_are_not_supported(self):
        payload = self._valid_payload()
        payload['questions'][7]['choices'] = [
            {'text': 'A', 'is_correct': True},
            {'text': 'B', 'is_correct': False},
            {'text': 'D', 'is_correct': False},
        ]
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/quizzes/', payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('must use either True/False choices or A/B/C choices', str(response.data))

    def test_student_cannot_create_quiz(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/quizzes/', self._valid_payload(), format='json')
        self.assertEqual(response.status_code, 403)
