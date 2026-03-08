import json
from pathlib import Path

from django.conf import settings
from django.core.management import BaseCommand, call_command


class Command(BaseCommand):
    help = (
        "Load demo fixtures (users, quizzes, games, attempts) idempotently and set demo passwords."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            dest="password",
            default="demo1234",
            help="Password to set for demo users (default: demo1234)",
        )
        parser.add_argument(
            "--fixtures",
            nargs="*",
            dest="fixtures",
            help=(
                "Optional explicit fixture file paths. If omitted, the command will load the"
                " standard demo fixtures under <app>/fixtures/*.json"
            ),
        )

    def handle(self, *args, **options):
        password = options.get("password")

        # Determine project base directory
        base_dir = Path(getattr(settings, "BASE_DIR", Path(__file__).resolve().parents[4]))

        default_fixtures = [
            base_dir / "users" / "fixtures" / "users.json",
        ]

        fixtures = options.get("fixtures") or [str(p) for p in default_fixtures]

        loaded = []
        users_fixture = None
        for fx in fixtures:
            fx_path = Path(fx)
            if not fx_path.exists():
                self.stdout.write(self.style.WARNING(f"Fixture not found: {fx_path}"))
                continue
            if fx_path.name.startswith("users"):
                users_fixture = fx_path
                try:
                    synced = self._sync_users_fixture(fx_path)
                    self.stdout.write(self.style.SUCCESS(f"Synced users fixture: {fx_path.name} ({synced} users)"))
                    loaded.append(fx_path)
                except Exception as exc:  # pragma: no cover - defensive
                    self.stdout.write(self.style.ERROR(f"Failed syncing {fx_path.name}: {exc}"))
                continue
            try:
                call_command("loaddata", str(fx_path))
                self.stdout.write(self.style.SUCCESS(f"Loaded fixture: {fx_path.name}"))
                loaded.append(fx_path)
            except Exception as exc:  # pragma: no cover - defensive
                self.stdout.write(self.style.ERROR(f"Failed loading {fx_path.name}: {exc}"))

        if users_fixture and users_fixture.exists():
            try:
                with open(users_fixture, "r", encoding="utf-8") as fh:
                    data = json.load(fh)
            except Exception as exc:  # pragma: no cover - defensive
                self.stdout.write(self.style.ERROR(f"Unable to read users fixture: {exc}"))
                data = []

            usernames = []
            for obj in data:
                model = obj.get("model", "")
                if model.endswith("user") or model.endswith("users.user"):
                    fields = obj.get("fields", {})
                    uname = fields.get("username") or fields.get("email")
                    if uname:
                        usernames.append(uname)

            if not usernames:
                self.stdout.write(self.style.WARNING("No usernames found in users fixture."))
            else:
                # Set passwords for found users
                try:
                    from django.contrib.auth import get_user_model

                    User = get_user_model()
                    for uname in usernames:
                        user = User.objects.filter(username=uname).first()
                        if not user:
                            # fallback: maybe email is stored as username
                            user = User.objects.filter(email=uname).first()
                        if not user:
                            self.stdout.write(self.style.WARNING(f"User not found in DB: {uname}"))
                            continue
                        user.set_password(password)
                        user.save()
                        self.stdout.write(self.style.SUCCESS(f"Set password for user: {user.username}"))
                except Exception as exc:  # pragma: no cover - defensive
                    self.stdout.write(self.style.ERROR(f"Failed to set demo passwords: {exc}"))
        else:
            self.stdout.write(self.style.WARNING("Users fixture not loaded; skipping password setup."))

        self._ensure_subject_catalog()
        self._ensure_demo_quizzes_and_results()
        self.stdout.write(self.style.SUCCESS("Demo seeding complete."))

    def _sync_users_fixture(self, users_fixture):
        from django.contrib.auth import get_user_model

        User = get_user_model()

        with open(users_fixture, "r", encoding="utf-8") as fh:
            data = json.load(fh)

        synced = 0
        for obj in data:
            if obj.get("model") not in {"users.user", "user", "users.User"}:
                continue

            fields = obj.get("fields", {})
            pk = obj.get("pk")
            username = fields.get("username")

            user_by_username = User.objects.filter(username=username).first() if username else None
            user_by_pk = User.objects.filter(pk=pk).first() if pk is not None else None

            user = user_by_username or user_by_pk

            if not user:
                user = User(pk=pk)

            user.username = username or user.username
            user.first_name = fields.get("first_name", user.first_name)
            user.last_name = fields.get("last_name", user.last_name)
            user.email = fields.get("email", user.email)
            user.full_name = fields.get("full_name", user.full_name)
            user.student_id = fields.get("student_id", user.student_id)
            user.role = fields.get("role", user.role)
            user.teacher_department = fields.get("teacher_department", user.teacher_department)
            user.teacher_designation = fields.get("teacher_designation", user.teacher_designation)
            user.is_verified = fields.get("is_verified", user.is_verified)
            user.university_domain_verified = fields.get(
                "university_domain_verified",
                user.university_domain_verified,
            )
            user.is_staff = fields.get("is_staff", user.is_staff)
            user.is_superuser = fields.get("is_superuser", user.is_superuser)
            user.is_active = fields.get("is_active", user.is_active)
            if fields.get("date_joined"):
                user.date_joined = fields["date_joined"]

            user.save()
            synced += 1

        return synced

    def _ensure_subject_catalog(self):
        from fields.models import StudyField
        from subjects.models import Module, Subject, Topic

        catalog = {
            'computer-science': [
                ('CS101', 'Introduction to Programming', 1, 4, [('Programming Basics', 'Variables and Types', ['Syntax', 'Variables']), ('Control Flow', 'Loops and Conditions', ['Loops', 'Branching'])]),
                ('CS202', 'Data Structures', 3, 4, [('Trees', 'Binary Trees', ['Tree Traversal', 'Binary Search Trees']), ('Graphs', 'Traversal', ['BFS', 'DFS'])]),
                ('CS301', 'Database Systems', 4, 4, [('SQL Fundamentals', 'Queries and Joins', ['SELECT Queries', 'JOIN Operations']), ('Normalization', 'Schema Design', ['1NF and 2NF', '3NF'])]),
                ('CS302', 'Operating Systems', 4, 4, [('Memory Management', 'Paging', ['Paging', 'Segmentation', 'Virtual Memory']), ('Process Management', 'Scheduling', ['CPU Scheduling', 'Threads']), ('Scheduling', 'Deadlocks', ['Deadlock Prevention', 'Deadlock Detection'])]),
                ('CS303', 'Software Engineering', 5, 3, [('Requirements', 'User Stories', ['Requirements Gathering', 'Backlog Management']), ('Testing', 'QA', ['Unit Testing', 'Integration Testing'])]),
            ],
            'business-administration': [
                ('BM101', 'Business Management', 1, 3, [('Management Principles', 'Planning', ['Planning Models']), ('Organization', 'Leadership', ['Leadership Styles'])]),
            ],
            'law': [
                ('LAW104', 'Constitutional Law', 2, 3, [('Constitution Basics', 'Fundamental Rights', ['Rights Overview']), ('Judiciary', 'Constitutional Review', ['Review Process'])]),
            ],
            'pharmacy': [
                ('PHAR201', 'Pharmacology', 2, 4, [('Drug Classifications', 'Therapeutics', ['Drug Families']), ('Dosage Forms', 'Administration', ['Routes of Administration'])]),
            ],
            'civil-engineering': [
                ('CE101', 'Civil Engineering Basics', 1, 3, [('Materials', 'Concrete', ['Mix Design']), ('Structures', 'Loads', ['Load Types'])]),
            ],
            'english': [
                ('ENG101', 'English Communication', 1, 2, [('Academic Writing', 'Essays', ['Essay Structure']), ('Presentations', 'Public Speaking', ['Presentation Skills'])]),
            ],
        }

        created_subjects = 0
        created_topics = 0
        created_modules = 0
        for field_code, subjects in catalog.items():
            field = StudyField.objects.filter(code=field_code).first()
            if not field:
                continue
            for code, name, semester, credits, topics in subjects:
                subject, created = Subject.objects.update_or_create(
                    code=code,
                    defaults={
                        'name': name,
                        'description': f'{name} for Sharda University {field.name} students.',
                        'field_of_study': field,
                        'semester': semester,
                        'credits': credits,
                        'is_active': True,
                    },
                )
                created_subjects += int(created)
                for topic_name, unit_name, modules in topics:
                    topic, topic_created = Topic.objects.update_or_create(
                        subject=subject,
                        name=topic_name,
                        unit_name=unit_name,
                        defaults={
                            'description': f'{topic_name} within {name}.',
                            'is_active': True,
                        },
                    )
                    created_topics += int(topic_created)
                    for order, module_title in enumerate(modules, start=1):
                        _, module_created = Module.objects.update_or_create(
                            topic=topic,
                            title=module_title,
                            defaults={'description': f'{module_title} within {topic_name}.', 'order': order, 'is_active': True},
                        )
                        created_modules += int(module_created)
        self.stdout.write(self.style.SUCCESS(f"Ensured subject catalog ({created_subjects} new subjects, {created_topics} new topics, {created_modules} new modules)."))

    def _ensure_demo_quizzes_and_results(self):
        from django.contrib.auth import get_user_model
        from django.utils import timezone

        from games.models import Attempt
        from quizzes.models import Choice, Question, QuestionBank, Quiz, QuizQuestion
        from subjects.models import Module, Subject

        User = get_user_model()
        teacher = User.objects.filter(username='alice_teacher').first()
        students = list(User.objects.filter(username__in=['bob_student', 'carol_student', 'dave_student']).order_by('id'))
        if not teacher:
            return
        cs_field = Subject.objects.filter(code='CS302').select_related('field_of_study').first()
        if cs_field:
            teacher.assigned_fields.set([cs_field.field_of_study])
            teacher.assigned_semester_codes = ['2501', '2403']
            teacher.assigned_semester_numbers = [1, 3]
            teacher.save(update_fields=['assigned_semester_codes', 'assigned_semester_numbers'])
        for index, student in enumerate(students, start=1):
            student.field_of_study = cs_field.field_of_study if cs_field else student.field_of_study
            student.semester_code = '2501' if index < 3 else '2403'
            student.semester_number = 1 if index < 3 else 3
            student.section = 'A' if index != 2 else 'B'
            student.save(update_fields=['field_of_study', 'semester_code', 'semester_number', 'section'])

        quiz_specs = [
            {
                'subject_code': 'CS302',
                'topic_name': 'Memory Management',
                'module_title': 'Paging',
                'title': 'Memory Basics Quiz',
                'quiz_type': 'practice',
                'difficulty': 'medium',
                'questions': [
                    ('What does paging primarily divide memory into?', ['Processes', 'Pages and frames', 'Threads', 'Pipelines'], 'B', 'Paging splits logical memory into pages and physical memory into frames.'),
                    ('A page fault occurs when?', ['CPU overheats', 'Required page is not in main memory', 'Swap file is deleted', 'Cache is full'], 'B', 'The referenced page is absent from RAM.'),
                    ('Which table maps virtual pages to physical frames?', ['Interrupt table', 'Page table', 'Process table', 'File table'], 'B', 'The page table stores page-to-frame mappings.'),
                    ('Paging helps reduce which memory issue?', ['Fragmentation', 'Encryption', 'Compilation', 'Virtualization'], 'A', 'Paging reduces external fragmentation.'),
                    ('TLB is used to?', ['Store files', 'Speed up address translation', 'Schedule processes', 'Encrypt pages'], 'B', 'The translation lookaside buffer caches page table lookups.'),
                    ('Which page replacement algorithm removes the oldest page?', ['LRU', 'FIFO', 'Optimal', 'Clock'], 'B', 'FIFO evicts the page loaded first.'),
                    ('Virtual memory allows a system to?', ['Use disk as memory extension', 'Disable RAM', 'Speed up CPU clocks', 'Avoid multitasking'], 'A', 'Virtual memory extends RAM with disk-backed storage.'),
                ],
            },
            {
                'subject_code': 'CS302',
                'topic_name': 'Memory Management',
                'module_title': 'Virtual Memory',
                'title': 'Paging Fundamentals',
                'quiz_type': 'class_test',
                'difficulty': 'medium',
                'questions': [
                    ('Demand paging loads pages when?', ['At boot only', 'Only when a process exits', 'They are needed', 'On every timer tick'], 'C', 'Demand paging delays loading until first use.'),
                    ('Thrashing happens when?', ['Pages are compiled', 'Too much time is spent swapping pages', 'Memory is encrypted', 'Disks stop spinning'], 'B', 'Thrashing is excessive paging activity.'),
                    ('The working set refers to?', ['All files in storage', 'Pages actively used by a process', 'CPU registers', 'Kernel logs'], 'B', 'It is the set of currently needed pages.'),
                    ('Segmentation differs from paging because segments are?', ['Fixed size', 'Always encrypted', 'Logical and variable size', 'Stored only in cache'], 'C', 'Segments reflect logical variable-sized program units.'),
                    ('Copy-on-write is commonly used to?', ['Avoid page tables', 'Delay copying until modification', 'Increase external fragmentation', 'Disable forks'], 'B', 'Pages are copied only when a write occurs.'),
                    ('The optimal replacement algorithm is mainly used for?', ['Real hardware deployment', 'Reference benchmarking', 'Security scans', 'Disk formatting'], 'B', 'Optimal requires future knowledge and is a benchmark.'),
                    ('Swap space is typically located on?', ['GPU memory', 'Disk storage', 'CPU cache', 'BIOS ROM'], 'B', 'Swap resides on disk.'),
                ],
            },
            {
                'subject_code': 'CS302',
                'topic_name': 'Process Management',
                'module_title': 'CPU Scheduling',
                'title': 'Process Scheduling Test',
                'quiz_type': 'exam',
                'difficulty': 'hard',
                'questions': [
                    ('Round Robin scheduling is best known for using?', ['Static priorities', 'A time quantum', 'Random choice', 'No preemption'], 'B', 'Round Robin rotates processes using a fixed time slice.'),
                    ('Shortest Job First minimizes?', ['Response time in all cases', 'Average waiting time under ideal knowledge', 'Disk usage', 'Context switching'], 'B', 'SJF is optimal for average waiting time when burst lengths are known.'),
                    ('Starvation is most likely in?', ['FCFS', 'Round Robin', 'Priority scheduling', 'FIFO paging'], 'C', 'Low-priority tasks may never run under strict priority.'),
                    ('Context switching overhead occurs when?', ['A process changes state', 'A page is encrypted', 'A file is deleted', 'Cache is flushed manually'], 'A', 'Switching CPU context costs time.'),
                    ('Deadlock requires which condition?', ['Only one process', 'Circular wait', 'Infinite RAM', 'Single-core CPU'], 'B', 'Circular wait is one of Coffman conditions.'),
                    ('A semaphore is used for?', ['Memory compaction', 'Process synchronization', 'Address translation', 'Disk partitioning'], 'B', 'Semaphores coordinate concurrent access.'),
                ],
            },
        ]

        created_quizzes = 0
        created_bank_entries = 0
        for spec in quiz_specs:
            subject = Subject.objects.filter(code=spec['subject_code']).first()
            if not subject:
                continue
            topic = subject.topics.filter(name=spec['topic_name']).first()
            module = Module.objects.filter(topic=topic, title=spec['module_title']).first() if topic else None
            quiz, created = Quiz.objects.update_or_create(
                title=spec['title'],
                owner=teacher,
                defaults={
                    'description': f"{spec['title']} for {subject.name}.",
                    'category': subject.field_of_study.name,
                    'subject': subject.name,
                    'semester': subject.semester,
                    'subject_ref': subject,
                    'topic_ref': topic,
                    'module_ref': module,
                    'unit_name': module.title if module else (topic.unit_name if topic else ''),
                    'difficulty': spec['difficulty'],
                    'quiz_type': spec['quiz_type'],
                    'duration_minutes': 20,
                    'total_marks': 100,
                    'passing_marks': 50,
                    'is_published': True,
                    'apply_to_all_fields': False,
                    'target_field_of_study': subject.field_of_study,
                    'target_semester_code': '2501' if spec['title'] != 'Process Scheduling Test' else '2403',
                    'target_semester_number': 1 if spec['title'] != 'Process Scheduling Test' else 3,
                    'target_section': 'A',
                    'randomize_questions': False,
                    'randomize_options': False,
                    'allow_retry': True,
                    'show_answers_after_submit': True,
                    'visibility': 'private',
                    'strict_structure': False,
                },
            )
            quiz.assigned_fields.set([subject.field_of_study])
            quiz.questions.all().delete()
            quiz.quiz_question_links.all().delete()
            for order, (question_text, options, correct_answer, explanation) in enumerate(spec['questions']):
                bank_entry = QuestionBank.objects.create(
                    subject_ref=subject,
                    topic_ref=topic,
                    module_ref=module,
                    field_of_study=subject.field_of_study,
                    semester=subject.semester,
                    topic=topic.name if topic else '',
                    unit_name=module.title if module else (topic.unit_name if topic else ''),
                    question_text=question_text,
                    question_type='mcq',
                    difficulty=spec['difficulty'],
                    option_a=options[0],
                    option_b=options[1],
                    option_c=options[2],
                    option_d=options[3],
                    correct_answer=correct_answer,
                    explanation=explanation,
                    marks=50,
                    created_by=teacher,
                )
                created_bank_entries += 1
                question = Question.objects.create(
                    quiz=quiz,
                    subject_ref=subject,
                    topic_ref=topic,
                    module_ref=module,
                    text=question_text,
                    explanation=explanation,
                    question_type='mcq',
                    difficulty=spec['difficulty'],
                    marks=50,
                    timer_seconds=30,
                    order=order,
                )
                for option_index, option in enumerate(options):
                    Choice.objects.create(
                        question=question,
                        text=option,
                        is_correct=chr(65 + option_index) == correct_answer,
                        order=option_index,
                    )
                QuizQuestion.objects.create(
                    quiz=quiz,
                    question=question,
                    question_bank_reference=bank_entry,
                    order=order,
                )
            created_quizzes += int(created)

            if students and not Attempt.objects.filter(quiz=quiz).exists():
                for index, student in enumerate(students, start=1):
                    score = 90 - (index * 15)
                    correct_answers = max(0, min(len(spec['questions']), len(spec['questions']) - (index - 1)))
                    Attempt.objects.create(
                        user=student,
                        quiz=quiz,
                        score=score,
                        started_at=timezone.now(),
                        finished_at=timezone.now(),
                        total_questions=len(spec['questions']),
                        correct_answers=correct_answers,
                        wrong_answers=len(spec['questions']) - correct_answers,
                        percentage=(correct_answers / len(spec['questions'])) * 100.0,
                        duration_taken=300 + (index * 20),
                        pass_fail_status='pass' if score >= 50 else 'fail',
                    )

        self.stdout.write(self.style.SUCCESS(f"Ensured demo academic quizzes ({created_quizzes} new quizzes, {created_bank_entries} sample bank entries)."))
