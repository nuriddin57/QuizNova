import os
import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from quizzes.models import Choice, Question, Quiz

from games import consumers
from games.models import Attempt, AttemptAnswer, GameResponse, GameSession, Player


class SeedDemoCommandTests(TestCase):
    def setUp(self):
        # Clean DB before each test
        User.objects.all().delete()
        Quiz.objects.all().delete()
        GameSession.objects.all().delete()
        Player.objects.all().delete()
        Attempt.objects.all().delete()
        AttemptAnswer.objects.all().delete()

    def test_seed_demo_loads_fixtures_and_sets_passwords(self):
        # Run seed_demo command
        call_command('seed_demo', password='demo1234')

        # Check demo users exist and have correct password
        for uname in ['alice_teacher', 'bob_student', 'carol_student', 'dave_student']:
            user = User.objects.filter(username=uname).first()
            self.assertIsNotNone(user)
            self.assertTrue(user.check_password('demo1234'))

        # Check quizzes and attempts loaded
        self.assertTrue(Quiz.objects.exists())
        self.assertTrue(GameSession.objects.exists())
        self.assertTrue(Attempt.objects.exists())

    def test_seed_demo_idempotency(self):
        # Run twice
        call_command('seed_demo', password='demo1234')
        call_command('seed_demo', password='demo1234')

        # No duplicate users
        for uname in ['alice_teacher', 'bob_student', 'carol_student', 'dave_student']:
            self.assertEqual(User.objects.filter(username=uname).count(), 1)

        # No duplicate attempts
        for user in User.objects.filter(username__in=['bob_student', 'carol_student', 'dave_student']):
            self.assertEqual(Attempt.objects.filter(user=user).count(), 1)

    def test_seed_demo_with_mocked_fixture(self):
        # Optionally test with a temp fixture file
        tempdir = tempfile.mkdtemp()
        try:
            users_fixture = os.path.join(tempdir, 'users.json')
            with open(users_fixture, 'w', encoding='utf-8') as fh:
                fh.write('[{"model": "users.user", "pk": 99, "fields": {"username": "mockuser", "password": "!", "role": "student", "email": "mock@example.com", "is_active": true}}]')
            call_command('seed_demo', fixtures=[users_fixture], password='mockpass')
            user = User.objects.filter(username='mockuser').first()
            self.assertIsNotNone(user)
            self.assertTrue(user.check_password('mockpass'))
        finally:
            shutil.rmtree(tempdir)
User = get_user_model()


class FinalizeAttemptsTests(TestCase):
    def setUp(self):
        # create users
        self.teacher = User.objects.create_user(username='t1', password='pass', role='teacher')
        self.student1 = User.objects.create_user(username='s1', password='pass', role='student')
        self.student2 = User.objects.create_user(username='s2', password='pass', role='student')

        # create quiz with 2 questions
        self.quiz = Quiz.objects.create(title='Quiz 1', description='desc', owner=self.teacher)
        q1 = Question.objects.create(quiz=self.quiz, text='Q1', timer_seconds=20, order=0)
        q2 = Question.objects.create(quiz=self.quiz, text='Q2', timer_seconds=20, order=1)
        # choices
        c1 = Choice.objects.create(question=q1, text='A', is_correct=True)
        Choice.objects.create(question=q1, text='B', is_correct=False)
        c2 = Choice.objects.create(question=q2, text='C', is_correct=False)
        Choice.objects.create(question=q2, text='D', is_correct=True)

        # create session and players
        self.session = GameSession.objects.create(quiz=self.quiz, host=self.teacher, code='ABC123')
        self.player1 = Player.objects.create(session=self.session, user=self.student1, name='stud1')
        self.player2 = Player.objects.create(session=self.session, user=self.student2, name='stud2')

        # create GameResponse rows: player1 answers both correct, player2 answers one correct
        GameResponse.objects.create(session=self.session, player=self.player1, question=q1, selected_choice=c1, is_correct=True, time_taken=2.5)
        GameResponse.objects.create(session=self.session, player=self.player1, question=q2, selected_choice=c2, is_correct=False, time_taken=3.1)

        GameResponse.objects.create(session=self.session, player=self.player2, question=q1, selected_choice=c1, is_correct=True, time_taken=1.2)
        GameResponse.objects.create(session=self.session, player=self.player2, question=q2, selected_choice=c2, is_correct=False, time_taken=4.0)

    def test_finalize_creates_attempts_and_answers(self):
        consumer = type('C', (), {})()
        consumer.code = self.session.code

        # call the finalize method
        payload = consumers.GameConsumer._finalize_attempts(consumer)

        # ensure attempts created for both players
        attempts = Attempt.objects.filter(session=self.session)
        self.assertEqual(attempts.count(), 2)

        # ensure AttemptAnswer rows created
        for a in attempts:
            self.assertTrue(AttemptAnswer.objects.filter(attempt=a).count() >= 1)

        # ensure payload contains leaderboard
        self.assertIn('leaderboard', payload)
        self.assertEqual(payload['quiz_id'], self.quiz.id)

    def test_duplicate_finalize_prevention(self):
        consumer = type('C', (), {})()
        consumer.code = self.session.code

        # first finalize
        _ = consumers.GameConsumer._finalize_attempts(consumer)
        count1 = Attempt.objects.filter(session=self.session).count()

        # second finalize should not create new attempts
        _ = consumers.GameConsumer._finalize_attempts(consumer)
        count2 = Attempt.objects.filter(session=self.session).count()

        self.assertEqual(count1, count2)

    def test_leaderboard_ordering(self):
        consumer = type('C', (), {})()
        consumer.code = self.session.code
        payload = consumers.GameConsumer._finalize_attempts(consumer)
        lb = payload.get('leaderboard', [])
        # leaderboard should be sorted by score desc
        scores = [p['score'] for p in lb]
        self.assertEqual(scores, sorted(scores, reverse=True))


class TeacherHostingPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.teacher = User.objects.create_user(username='teacher_host', password='pass', role='teacher')
        self.student = User.objects.create_user(username='student_user', password='pass', role='student')
        self.quiz = Quiz.objects.create(title='Host Quiz', description='desc', owner=self.teacher)

    def test_teacher_can_create_room(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/rooms/create', {'quiz': self.quiz.id, 'mode': 'classic'}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertIn('code', response.data)

    def test_student_cannot_create_room(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/rooms/create', {'quiz': self.quiz.id, 'mode': 'classic'}, format='json')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data.get('detail'), 'Teacher role is required.')

    def test_only_host_can_control_ws_flow(self):
        session = GameSession.objects.create(quiz=self.quiz, host=self.teacher, code='HOST123')

        host_consumer = type('C', (), {})()
        host_consumer.code = session.code
        host_consumer.actor_user_id = self.teacher.id

        non_host_consumer = type('C', (), {})()
        non_host_consumer.code = session.code
        non_host_consumer.actor_user_id = self.student.id

        self.assertTrue(consumers.GameConsumer._can_control_session(host_consumer))
        self.assertFalse(consumers.GameConsumer._can_control_session(non_host_consumer))


class QuizAttemptSubmissionAndLeaderboardTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.teacher = User.objects.create_user(username='teacher_stats', password='pass', role='teacher')
        self.student1 = User.objects.create_user(username='student_stats_1', password='pass', role='student')
        self.student2 = User.objects.create_user(username='student_stats_2', password='pass', role='student')

        self.quiz = Quiz.objects.create(title='Stats Quiz', description='desc', owner=self.teacher)
        self.q1 = Question.objects.create(quiz=self.quiz, text='Q1', timer_seconds=20, order=0)
        self.q2 = Question.objects.create(quiz=self.quiz, text='Q2', timer_seconds=20, order=1)
        self.q1a = Choice.objects.create(question=self.q1, text='A', is_correct=True)
        self.q1b = Choice.objects.create(question=self.q1, text='B', is_correct=False)
        self.q2a = Choice.objects.create(question=self.q2, text='A', is_correct=False)
        self.q2b = Choice.objects.create(question=self.q2, text='B', is_correct=True)

    def _submit_for(self, user, answers):
        self.client.force_authenticate(user=user)
        return self.client.post(
            f'/api/quiz/{self.quiz.id}/attempt/submit/',
            {'answers': answers},
            format='json',
        )

    def test_submit_attempt_creates_attempt_and_answers(self):
        response = self._submit_for(
            self.student1,
            [
                {'question_id': self.q1.id, 'choice_id': self.q1a.id},
                {'question_id': self.q2.id, 'choice_id': self.q2b.id},
            ],
        )
        self.assertEqual(response.status_code, 201)
        payload = response.data.get('attempt') or {}
        self.assertEqual(payload.get('correct_answers'), 2)
        self.assertEqual(payload.get('total_questions'), 2)
        self.assertEqual(len(payload.get('answers') or []), 2)

    def test_student_leaderboard_returns_only_own_attempts(self):
        self._submit_for(
            self.student1,
            [
                {'question_id': self.q1.id, 'choice_id': self.q1a.id},
                {'question_id': self.q2.id, 'choice_id': self.q2a.id},
            ],
        )
        self._submit_for(
            self.student2,
            [
                {'question_id': self.q1.id, 'choice_id': self.q1b.id},
                {'question_id': self.q2.id, 'choice_id': self.q2b.id},
            ],
        )

        self.client.force_authenticate(user=self.student1)
        response = self.client.get(f'/api/quiz/{self.quiz.id}/leaderboard/')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data.get('can_view_all'))
        rows = response.data.get('leaderboard') or []
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0].get('user'), self.student1.id)

    def test_teacher_leaderboard_returns_all_attempts_with_usernames(self):
        self._submit_for(
            self.student1,
            [{'question_id': self.q1.id, 'choice_id': self.q1a.id}],
        )
        self._submit_for(
            self.student2,
            [{'question_id': self.q1.id, 'choice_id': self.q1b.id}],
        )

        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(f'/api/quiz/{self.quiz.id}/leaderboard/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('can_view_all'))
        rows = response.data.get('leaderboard') or []
        usernames = {item.get('user_username') for item in rows}
        self.assertIn(self.student1.username, usernames)
        self.assertIn(self.student2.username, usernames)
