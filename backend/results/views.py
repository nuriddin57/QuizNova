from django.db import transaction
from django.db.models import Avg, Count, Max, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from games.models import Attempt, AttemptAnswer
from quizzes.models import Quiz
from quizzes.serializers import QuestionSerializer
from users.permissions import IsParentRole, IsStudent, IsTeacher

from .serializers import ResultSerializer, StudentMyResultSerializer


def _student_can_access_quiz(student, quiz):
    if quiz.apply_to_all_fields:
        return True
    student_field_id = getattr(student, 'field_of_study_id', None)
    student_semester_code = str(getattr(student, 'semester_code', '') or '').strip()
    student_semester_number = getattr(student, 'semester_number', None)
    student_section = str(getattr(student, 'section', '') or '').strip()
    if not student_field_id:
        return False
    field_match = (
        quiz.target_field_of_study_id == student_field_id
        or quiz.assigned_fields.filter(id=student_field_id).exists()
    )
    if not field_match:
        return False
    if quiz.target_semester_code and quiz.target_semester_code != student_semester_code:
        return False
    if quiz.target_semester_number and quiz.target_semester_number != student_semester_number:
        return False
    if quiz.target_section and quiz.target_section.lower() != student_section.lower():
        return False
    return True


class StartExamView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def post(self, request, quiz_id):
        quiz = get_object_or_404(
            Quiz.objects.prefetch_related('questions__choices', 'assigned_fields'),
            id=quiz_id,
            is_published=True,
        )
        if not _student_can_access_quiz(request.user, quiz):
            return Response({'detail': 'This quiz is not assigned to your field of study.'}, status=403)

        questions = quiz.questions.all().order_by('order')
        payload = QuestionSerializer(questions, many=True, context={'request': request}).data
        return Response(
            {
                'quiz_id': quiz.id,
                'title': quiz.title,
                'subject': quiz.subject,
                'subject_id': quiz.subject_ref_id,
                'topic': getattr(quiz.topic_ref, 'name', ''),
                'difficulty': quiz.difficulty,
                'quiz_type': quiz.quiz_type,
                'target_field_of_study': quiz.target_field_of_study_id,
                'target_semester_code': quiz.target_semester_code,
                'target_semester_number': quiz.target_semester_number,
                'target_section': quiz.target_section,
                'duration_minutes': quiz.duration_minutes,
                'total_marks': quiz.total_marks,
                'passing_marks': quiz.passing_marks,
                'allow_retry': quiz.allow_retry,
                'show_answers_after_submit': quiz.show_answers_after_submit,
                'started_at': timezone.now(),
                'questions': payload,
            }
        )


class SubmitExamView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def post(self, request, quiz_id):
        quiz = get_object_or_404(
            Quiz.objects.prefetch_related('questions__choices', 'assigned_fields'),
            id=quiz_id,
            is_published=True,
        )
        if not _student_can_access_quiz(request.user, quiz):
            return Response({'detail': 'This quiz is not assigned to your field of study.'}, status=403)

        submitted_answers = request.data.get('answers')
        if not isinstance(submitted_answers, list):
            return Response({'detail': 'answers must be a list.'}, status=400)

        duration_taken = max(0.0, float(request.data.get('duration_taken') or 0.0))

        submitted_map = {}
        for item in submitted_answers:
            if not isinstance(item, dict):
                return Response({'detail': 'Invalid answer payload.'}, status=400)
            try:
                question_id = int(item.get('question_id'))
                choice_id = int(item.get('choice_id'))
            except (TypeError, ValueError):
                return Response({'detail': 'question_id and choice_id must be integers.'}, status=400)
            submitted_map[question_id] = choice_id

        questions = list(quiz.questions.all())
        question_ids = {question.id for question in questions}
        choices_by_id = {
            choice.id: choice
            for question in questions
            for choice in question.choices.all()
        }

        for question_id, choice_id in submitted_map.items():
            if question_id not in question_ids:
                return Response({'detail': f'Question {question_id} is not part of this quiz.'}, status=400)
            selected = choices_by_id.get(choice_id)
            if not selected:
                return Response({'detail': f'Choice {choice_id} not found.'}, status=400)
            if selected.question_id != question_id:
                return Response({'detail': f'Choice {choice_id} does not belong to question {question_id}.'}, status=400)

        total_questions = len(questions)
        correct_answers = 0
        wrong_answers = 0
        mark_per_question = float(quiz.total_marks) / float(total_questions) if total_questions else 0.0
        now = timezone.now()
        student_profile = getattr(request.user, 'student_profile', None)
        student_id_snapshot = request.user.student_id or getattr(student_profile, 'student_id', '') or ''
        field_of_study = getattr(request.user, 'field_of_study', None)
        field_name_snapshot = getattr(field_of_study, 'name', '')
        semester_number = request.user.semester_number or getattr(student_profile, 'semester', None)
        section = request.user.section or getattr(student_profile, 'group', '') or ''

        with transaction.atomic():
            attempt = Attempt.objects.create(
                user=request.user,
                quiz=quiz,
                student_name_snapshot=request.user.full_name or request.user.username,
                student_id_snapshot=student_id_snapshot,
                field_of_study=field_of_study,
                field_name_snapshot=field_name_snapshot,
                semester_code=request.user.semester_code or '',
                semester_number=semester_number,
                section=section,
                score=0,
                started_at=now,
                finished_at=now,
                submitted_at=now,
                total_questions=total_questions,
                correct_answers=0,
                wrong_answers=0,
                percentage=0.0,
                duration_taken=duration_taken,
                pass_fail_status='pending',
            )

            attempt_answers = []
            for question in questions:
                selected_choice_id = submitted_map.get(question.id)
                selected_choice = choices_by_id.get(selected_choice_id)
                is_correct = bool(selected_choice and selected_choice.is_correct)
                if is_correct:
                    correct_answers += 1
                else:
                    wrong_answers += 1
                if selected_choice:
                    attempt_answers.append(
                        AttemptAnswer(
                            attempt=attempt,
                            question=question,
                            selected_choice=selected_choice,
                            is_correct=is_correct,
                            time_taken=0.0,
                        )
                    )
            if attempt_answers:
                AttemptAnswer.objects.bulk_create(attempt_answers)

            score = int(round(correct_answers * mark_per_question))
            percentage = (correct_answers / total_questions * 100.0) if total_questions else 0.0
            pass_fail_status = 'pass' if score >= int(quiz.passing_marks or 0) else 'fail'
            attempt.correct_answers = correct_answers
            attempt.wrong_answers = wrong_answers
            attempt.score = score
            attempt.percentage = percentage
            attempt.pass_fail_status = pass_fail_status
            attempt.save(
                update_fields=['correct_answers', 'wrong_answers', 'score', 'percentage', 'pass_fail_status']
            )

        return Response({'result': ResultSerializer(attempt).data}, status=201)


class StudentResultHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        qs = (
            Attempt.objects
            .filter(user=request.user)
            .select_related('quiz', 'quiz__subject_ref', 'quiz__topic_ref', 'quiz__module_ref', 'user')
            .prefetch_related('answers')
        )
        subject = (request.query_params.get('subject') or '').strip()
        subject_id = (request.query_params.get('subject_id') or '').strip()
        quiz_type = (request.query_params.get('quiz_type') or '').strip()
        difficulty = (request.query_params.get('difficulty') or '').strip()

        if subject:
            qs = qs.filter(Q(quiz__subject__iexact=subject) | Q(quiz__subject_ref__name__iexact=subject))
        if subject_id:
            qs = qs.filter(quiz__subject_ref_id=subject_id)
        if quiz_type:
            qs = qs.filter(quiz__quiz_type=quiz_type)
        if difficulty:
            qs = qs.filter(quiz__difficulty=difficulty)

        data = ResultSerializer(qs.order_by('-finished_at')[:200], many=True).data
        return Response({'results': data})


class StudentMyResultsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        qs = (
            Attempt.objects
            .filter(user=request.user)
            .select_related('quiz', 'quiz__subject_ref')
            .order_by('-submitted_at', '-finished_at', '-id')
        )
        subject_id = (request.query_params.get('subject_id') or '').strip()
        subject = (request.query_params.get('subject') or '').strip()

        if subject_id:
            qs = qs.filter(quiz__subject_ref_id=subject_id)
        elif subject:
            qs = qs.filter(Q(quiz__subject_ref__name__iexact=subject) | Q(quiz__subject__iexact=subject))

        data = StudentMyResultSerializer(qs[:200], many=True).data
        return Response({'results': data})


class StudentSubjectPerformanceView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        rows = (
            Attempt.objects.filter(user=request.user)
            .values('quiz__subject_ref__id', 'quiz__subject_ref__name', 'quiz__subject')
            .annotate(
                attempts=Count('id'),
                best_score=Max('score'),
                average_score=Avg('score'),
                pass_count=Count('id', filter=Q(pass_fail_status='pass')),
                fail_count=Count('id', filter=Q(pass_fail_status='fail')),
            )
            .order_by('quiz__subject_ref__name', 'quiz__subject')
        )
        return Response(
            {
                'subjects': [
                    {
                        'subject_id': row['quiz__subject_ref__id'],
                        'subject_name': row['quiz__subject_ref__name'] or row['quiz__subject'] or 'Unspecified',
                        'attempts': row['attempts'] or 0,
                        'best_score': float(row['best_score'] or 0.0),
                        'average_score': float(row['average_score'] or 0.0),
                        'pass_count': row['pass_count'] or 0,
                        'fail_count': row['fail_count'] or 0,
                    }
                    for row in rows
                ]
            }
        )


class TeacherResultsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get(self, request):
        user = request.user
        qs = Attempt.objects.select_related('quiz', 'user').prefetch_related('answers')
        if not user.is_admin():
            qs = qs.filter(quiz__owner=user)

        field_id = (request.query_params.get('field_id') or '').strip()
        subject_id = (request.query_params.get('subject_id') or '').strip()
        semester_code = (request.query_params.get('semester_code') or '').strip()
        semester_number = (request.query_params.get('semester_number') or '').strip()
        section = (request.query_params.get('section') or request.query_params.get('group') or '').strip()
        subject = (request.query_params.get('subject') or '').strip()
        quiz_id = (request.query_params.get('quiz_id') or '').strip()
        student_id = (request.query_params.get('student_id') or '').strip()

        if field_id:
            try:
                parsed_field_id = int(field_id)
                qs = qs.filter(Q(field_of_study_id=parsed_field_id) | Q(quiz__target_field_of_study_id=parsed_field_id)).distinct()
            except (TypeError, ValueError):
                pass
        if semester_code:
            qs = qs.filter(semester_code=semester_code)
        if semester_number:
            qs = qs.filter(semester_number=semester_number)
        if section:
            qs = qs.filter(section__iexact=section)
        if subject:
            qs = qs.filter(quiz__subject__iexact=subject)
        if subject_id:
            qs = qs.filter(quiz__subject_ref_id=subject_id)
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        if student_id:
            qs = qs.filter(user_id=student_id)

        data = ResultSerializer(qs.order_by('-finished_at')[:500], many=True).data
        return Response({'results': data})


class ParentLinkedStudentsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsParentRole]

    def get(self, request):
        profile = getattr(request.user, 'parent_profile', None)
        students = profile.linked_students.select_related('field_of_study').order_by('full_name', 'email') if profile else []
        payload = [
            {
                'id': student.id,
                'full_name': student.full_name or student.username,
                'email': student.email,
                'student_id': student.student_id,
                'field_of_study_name': getattr(student.field_of_study, 'name', ''),
                'semester_code': student.semester_code,
                'semester_number': student.semester_number,
                'section': student.section,
            }
            for student in students
        ]
        return Response({'students': payload})


class ParentProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsParentRole]

    def get(self, request):
        profile = getattr(request.user, 'parent_profile', None)
        linked_ids = list(profile.linked_students.values_list('id', flat=True)) if profile else []
        if not linked_ids:
            return Response({'children': [], 'results': []})

        child_id = (request.query_params.get('child_id') or '').strip()
        qs = Attempt.objects.filter(user_id__in=linked_ids).select_related('quiz', 'user').prefetch_related('answers')
        if child_id:
            qs = qs.filter(user_id=child_id)

        results = ResultSerializer(qs.order_by('-finished_at')[:200], many=True).data
        child_rows = (
            Attempt.objects.filter(user_id__in=linked_ids)
            .values('user_id', 'user__full_name', 'user__email')
            .annotate(
                attempts=Count('id'),
                average_score=Avg('score'),
                best_score=Max('score'),
                last_finished_at=Max('finished_at'),
            )
            .order_by('user__full_name', 'user__email')
        )
        children = [
            {
                'id': row['user_id'],
                'full_name': row['user__full_name'] or row['user__email'],
                'email': row['user__email'],
                'attempts': row['attempts'] or 0,
                'average_score': float(row['average_score'] or 0.0),
                'best_score': float(row['best_score'] or 0.0),
                'last_finished_at': row['last_finished_at'],
            }
            for row in child_rows
        ]
        return Response({'children': children, 'results': results})
