from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .question_quality import finalize_question_batch, shuffle_question_options
from .services import generate_questions


class AIQuestionQualityTests(TestCase):
    def test_finalize_question_batch_filters_duplicates_and_invalid_options(self):
        raw_questions = [
            {
                'question_text': 'In Python, what is the main purpose of a function?',
                'options': [
                    'To define reusable blocks of code',
                    'To store files permanently',
                    'To create database tables automatically',
                    'To replace source files with compiled binaries',
                ],
                'correct_answer': 'To define reusable blocks of code',
                'explanation': 'Functions let developers organize reusable logic.',
            },
            {
                'question_text': 'In Python, what is the main purpose of a function?',
                'options': [
                    'To define reusable blocks of code',
                    'To store files permanently',
                    'To create database tables automatically',
                    'To replace source files with compiled binaries',
                ],
                'correct_answer': 'To define reusable blocks of code',
            },
            {
                'question_text': 'Which option best describes sorting algorithms',
                'options': ['Concept A', 'Concept A', 'Concept C', 'Concept D'],
                'correct_answer_index': 0,
            },
        ]

        accepted = finalize_question_batch(raw_questions)

        self.assertEqual(len(accepted), 1)
        self.assertEqual(len(accepted[0]['options']), 4)
        self.assertTrue(accepted[0]['question_text'].endswith('?'))

    def test_shuffle_question_options_preserves_correct_answer_mapping(self):
        question = {
            'question_text': 'What is the purpose of encapsulation in object-oriented programming?',
            'options': [
                'To bundle data and behavior into a single unit',
                'To remove the need for methods',
                'To prevent all inheritance',
                'To convert classes into databases',
            ],
            'correct_answer_index': 0,
            'explanation': 'Encapsulation keeps related state and behavior together.',
        }

        shuffled = shuffle_question_options(question)

        self.assertEqual(len(shuffled['options']), 4)
        self.assertIn('To bundle data and behavior into a single unit', shuffled['options'])
        self.assertEqual(
            shuffled['options'][shuffled['correct_answer_index']],
            'To bundle data and behavior into a single unit',
        )

    def test_generate_questions_returns_unique_complete_questions(self):
        result = generate_questions(
            topic='Sorting algorithms',
            subject='Algorithms',
            difficulty='medium',
            number_of_questions=5,
            field_of_study_name='Computer Science',
            language='en',
        )

        self.assertTrue(result['success'])
        self.assertEqual(result['total_questions'], 5)
        self.assertEqual(len(result['questions']), 5)
        question_texts = [item['question_text'] for item in result['questions']]
        self.assertEqual(len(question_texts), len(set(question_texts)))
        for question in result['questions']:
            self.assertEqual(question['question_type'], 'mcq')
            self.assertEqual(question['type'], 'multiple_choice')
            self.assertEqual(len(question['options']), 4)
            self.assertTrue(question['question_text'][-1] in '.?!')
            self.assertTrue(0 <= question['correct_answer_index'] <= 3)
            self.assertTrue(question['explanation'])

    def test_generate_ten_questions_returns_five_true_false_then_five_multiple_choice(self):
        result = generate_questions(
            topic='Sorting algorithms',
            subject='Algorithms',
            difficulty='medium',
            number_of_questions=10,
            field_of_study_name='Computer Science',
            language='en',
        )

        self.assertTrue(result['success'])
        self.assertEqual(result['total_questions'], 10)
        self.assertEqual(result['true_false_count'], 5)
        self.assertEqual(result['multiple_choice_count'], 5)
        self.assertEqual(len(result['questions']), 10)
        tf_questions = result['questions'][:5]
        mcq_questions = result['questions'][5:]
        self.assertTrue(all(item['question_type'] == 'true_false' for item in tf_questions))
        self.assertTrue(all(item['type'] == 'multiple_choice' for item in mcq_questions))
        for question in tf_questions:
            self.assertEqual(len(question['options']), 2)
            self.assertEqual(set(question['options']), {'True', 'False'})
            self.assertIn(question['correct_answer'], {'True', 'False'})
        for question in mcq_questions:
            self.assertEqual(question['question_type'], 'mcq')
            self.assertEqual(len(question['options']), 4)
            self.assertEqual(len(set(question['options'])), 4)
            self.assertEqual(question['correct_answer'], question['options'][question['correct_answer_index']])

    def test_generate_questions_returns_exact_requested_count_for_large_requests(self):
        result = generate_questions(
            topic='Skill',
            subject='English',
            difficulty='hard',
            number_of_questions=15,
            field_of_study_name='Philology',
            language='uz',
        )

        self.assertTrue(result['success'])
        self.assertEqual(result['total_questions'], 15)
        self.assertEqual(len(result['questions']), 15)
        self.assertEqual(result['multiple_choice_count'], 15)
        self.assertEqual(result['true_false_count'], 0)
        question_texts = [item['question_text'] for item in result['questions']]
        self.assertEqual(len(question_texts), len(set(question_texts)))


class AIPermissionAndRegenerationTests(TestCase):
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
                'language': 'en',
                'number_of_questions': 3,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data.get('questions') or []), 3)
        self.assertTrue(all(len(item.get('options') or []) == 4 for item in response.data.get('questions') or []))

    def test_student_cannot_generate_ai_questions(self):
        self.client.force_authenticate(self.student)
        response = self.client.post(
            '/api/ai/questions/generate/',
            {
                'field_of_study_name': 'Computer Science',
                'subject': 'Algorithms',
                'topic': 'Sorting',
                'difficulty': 'easy',
                'language': 'en',
                'number_of_questions': 2,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 403)

    def test_teacher_can_regenerate_question_without_repeating_existing_question(self):
        self.client.force_authenticate(self.teacher)
        payload = {
            'field_of_study_name': 'Computer Science',
            'subject': 'Algorithms',
            'topic': 'Sorting',
            'difficulty': 'medium',
            'language': 'en',
            'current_question_text': 'In Algorithms, what is the main purpose of sorting?',
            'current_question_type': 'true_false',
            'existing_questions': [
                'In Algorithms, what is the main purpose of sorting?',
                'Why is sorting important when studying Algorithms at an intermediate level?',
            ],
        }

        response = self.client.post('/api/ai/questions/regenerate/', payload, format='json')

        self.assertEqual(response.status_code, 200)
        question = response.data.get('question') or {}
        self.assertTrue(question.get('question_text'))
        self.assertNotIn(question['question_text'], payload['existing_questions'])
        self.assertEqual(question.get('question_type'), 'true_false')
        self.assertEqual(len(question.get('options') or []), 2)
