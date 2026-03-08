from django.db import migrations


def create_demo_data(apps, schema_editor):
    User = apps.get_model('users', 'User')
    Quiz = apps.get_model('quizzes', 'Quiz')
    Question = apps.get_model('quizzes', 'Question')
    Choice = apps.get_model('quizzes', 'Choice')
    GameSession = apps.get_model('games', 'GameSession')
    Player = apps.get_model('games', 'Player')
    Attempt = apps.get_model('games', 'Attempt')
    AttemptAnswer = apps.get_model('games', 'AttemptAnswer')

    from django.utils import timezone

    from django.contrib.auth.hashers import make_password

    # Create users that satisfy the university-only login validation rules.
    teacher, _ = User.objects.get_or_create(
        username='alice_teacher',
        defaults={
            'email': 'john.doe@shardauniversity.uz',
            'full_name': 'John Doe',
            'role': 'teacher',
            'teacher_department': 'Computer Science',
            'teacher_designation': 'Lecturer',
            'is_verified': True,
            'university_domain_verified': True,
            'is_staff': True,
        },
    )
    teacher.email = 'john.doe@shardauniversity.uz'
    teacher.full_name = 'John Doe'
    teacher.role = 'teacher'
    teacher.teacher_department = 'Computer Science'
    teacher.teacher_designation = 'Lecturer'
    teacher.is_verified = True
    teacher.university_domain_verified = True
    teacher.is_staff = True
    teacher.password = make_password('demo1234')
    teacher.save()

    students = []
    sample_students = [
        ('bob_student', 'Student One', 'demo.student1@ug.shardauniversity.uz', '202499123'),
        ('carol_student', 'Student Two', 'demo.student2@ug.shardauniversity.uz', '202499124'),
        ('dave_student', 'Student Three', 'demo.student3@ug.shardauniversity.uz', '202499125'),
    ]
    for username, full_name, email, student_id in sample_students:
        u, _ = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'full_name': full_name,
                'student_id': student_id,
                'role': 'student',
                'is_verified': True,
                'university_domain_verified': True,
            },
        )
        u.email = email
        u.full_name = full_name
        u.student_id = student_id
        u.role = 'student'
        u.is_verified = True
        u.university_domain_verified = True
        u.password = make_password('demo1234')
        u.save()
        students.append(u)

    # Avoid duplicating demo quizzes
    if Quiz.objects.filter(title='Demo: Math Basics').exists():
        return

    # Create Quiz 1
    quiz1 = Quiz.objects.create(title='Demo: Math Basics', description='Simple arithmetic quiz', category='Math', owner=teacher)
    q1 = Question.objects.create(quiz=quiz1, text='What is 2 + 2?', timer_seconds=15, order=0)
    Choice.objects.create(question=q1, text='3', is_correct=False)
    Choice.objects.create(question=q1, text='4', is_correct=True)
    Choice.objects.create(question=q1, text='22', is_correct=False)
    Choice.objects.create(question=q1, text='5', is_correct=False)

    q2 = Question.objects.create(quiz=quiz1, text='What is 5 * 6?', timer_seconds=20, order=1)
    Choice.objects.create(question=q2, text='30', is_correct=True)
    Choice.objects.create(question=q2, text='11', is_correct=False)
    Choice.objects.create(question=q2, text='56', is_correct=False)
    Choice.objects.create(question=q2, text='60', is_correct=False)

    q3 = Question.objects.create(quiz=quiz1, text='What is 10 - 4?', timer_seconds=12, order=2)
    Choice.objects.create(question=q3, text='6', is_correct=True)
    Choice.objects.create(question=q3, text='4', is_correct=False)
    Choice.objects.create(question=q3, text='5', is_correct=False)
    Choice.objects.create(question=q3, text='7', is_correct=False)

    # Create Quiz 2
    quiz2 = Quiz.objects.create(title='Demo: Science Basics', description='Basic science trivia', category='Science', owner=teacher)
    s1 = Question.objects.create(quiz=quiz2, text='Water freezes at what temperature (°C)?', timer_seconds=15, order=0)
    Choice.objects.create(question=s1, text='0', is_correct=True)
    Choice.objects.create(question=s1, text='100', is_correct=False)
    Choice.objects.create(question=s1, text='-10', is_correct=False)
    Choice.objects.create(question=s1, text='10', is_correct=False)

    s2 = Question.objects.create(quiz=quiz2, text='The chemical symbol for water is?', timer_seconds=12, order=1)
    Choice.objects.create(question=s2, text='H2O', is_correct=True)
    Choice.objects.create(question=s2, text='O2', is_correct=False)
    Choice.objects.create(question=s2, text='CO2', is_correct=False)
    Choice.objects.create(question=s2, text='NaCl', is_correct=False)

    s3 = Question.objects.create(quiz=quiz2, text='Which planet is known as the Red Planet?', timer_seconds=18, order=2)
    Choice.objects.create(question=s3, text='Mars', is_correct=True)
    Choice.objects.create(question=s3, text='Venus', is_correct=False)
    Choice.objects.create(question=s3, text='Jupiter', is_correct=False)
    Choice.objects.create(question=s3, text='Saturn', is_correct=False)

    # Create a sample session for quiz1 and players
    session = GameSession.objects.create(quiz=quiz1, host=teacher, code='DEMOG1')
    p_objs = []
    for s in students:
        p = Player.objects.create(session=session, user=s, name=s.username)
        p_objs.append(p)

    now = timezone.now()

    # Create attempts for leaderboard demo
    # Student 1: good score
    a1 = Attempt.objects.create(user=students[0], player=p_objs[0], session=session, quiz=quiz1, score=2700, started_at=now, finished_at=now, total_questions=3, correct_answers=3)
    AttemptAnswer.objects.create(attempt=a1, question=q1, selected_choice=Choice.objects.filter(question=q1, is_correct=True).first(), is_correct=True, time_taken=1.2)
    AttemptAnswer.objects.create(attempt=a1, question=q2, selected_choice=Choice.objects.filter(question=q2, is_correct=True).first(), is_correct=True, time_taken=2.5)
    AttemptAnswer.objects.create(attempt=a1, question=q3, selected_choice=Choice.objects.filter(question=q3, is_correct=True).first(), is_correct=True, time_taken=1.0)

    # Student 2: partial score
    a2 = Attempt.objects.create(user=students[1], player=p_objs[1], session=session, quiz=quiz1, score=1500, started_at=now, finished_at=now, total_questions=3, correct_answers=1)
    AttemptAnswer.objects.create(attempt=a2, question=q1, selected_choice=Choice.objects.filter(question=q1, is_correct=True).first(), is_correct=True, time_taken=3.0)
    AttemptAnswer.objects.create(attempt=a2, question=q2, selected_choice=Choice.objects.filter(question=q2, is_correct=False).first(), is_correct=False, time_taken=4.2)
    AttemptAnswer.objects.create(attempt=a2, question=q3, selected_choice=Choice.objects.filter(question=q3, is_correct=False).first(), is_correct=False, time_taken=2.1)

    # Student 3: low score
    a3 = Attempt.objects.create(user=students[2], player=p_objs[2], session=session, quiz=quiz1, score=0, started_at=now, finished_at=now, total_questions=3, correct_answers=0)
    AttemptAnswer.objects.create(attempt=a3, question=q1, selected_choice=Choice.objects.filter(question=q1, is_correct=False).first(), is_correct=False, time_taken=2.2)
    AttemptAnswer.objects.create(attempt=a3, question=q2, selected_choice=Choice.objects.filter(question=q2, is_correct=False).first(), is_correct=False, time_taken=3.5)
    AttemptAnswer.objects.create(attempt=a3, question=q3, selected_choice=Choice.objects.filter(question=q3, is_correct=False).first(), is_correct=False, time_taken=2.8)


def remove_demo_data(apps, schema_editor):
    User = apps.get_model('users', 'User')
    Quiz = apps.get_model('quizzes', 'Quiz')
    GameSession = apps.get_model('games', 'GameSession')

    # Remove demo attempts/sessions/quizzes/users created by this migration
    GameSession.objects.filter(code='DEMOG1').delete()
    Quiz.objects.filter(title__startswith='Demo:').delete()
    # remove demo users (students and teacher)
    User.objects.filter(username__in=['alice_teacher','bob_student','carol_student','dave_student']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('games', '0001_initial'),
        ('quizzes', '0001_initial'),
        ('users', '0002_university_profile_fields'),
    ]

    operations = [
        migrations.RunPython(create_demo_data, reverse_code=remove_demo_data),
    ]
