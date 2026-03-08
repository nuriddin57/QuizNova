from django.db.models import Avg, Count, Max, Min, Q
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from games.models import Attempt, AttemptAnswer
from users.permissions import IsTeacher


class TeacherAnalyticsBaseView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get_queryset(self):
        user = self.request.user
        qs = Attempt.objects.select_related(
            'quiz',
            'user',
            'quiz__subject_ref',
            'quiz__topic_ref',
            'quiz__module_ref',
        )
        if not user.is_admin():
            qs = qs.filter(quiz__owner=user)

        field_id = (self.request.query_params.get('field_id') or '').strip()
        subject = (self.request.query_params.get('subject') or '').strip()
        subject_id = (self.request.query_params.get('subject_id') or '').strip()
        topic_id = (self.request.query_params.get('topic_id') or '').strip()
        module_id = (self.request.query_params.get('module_id') or '').strip()
        quiz_id = (self.request.query_params.get('quiz_id') or '').strip()
        student_id = (self.request.query_params.get('student_id') or '').strip()
        semester_code = (self.request.query_params.get('semester_code') or '').strip()
        semester_number = (self.request.query_params.get('semester_number') or '').strip()
        section = (self.request.query_params.get('section') or '').strip()
        semester = (self.request.query_params.get('semester') or '').strip()
        quiz_type = (self.request.query_params.get('quiz_type') or '').strip()
        date_from = (self.request.query_params.get('date_from') or '').strip()
        date_to = (self.request.query_params.get('date_to') or '').strip()

        if field_id:
            try:
                parsed_field_id = int(field_id)
                qs = qs.filter(field_of_study_id=parsed_field_id)
            except (TypeError, ValueError):
                pass
        if subject:
            qs = qs.filter(Q(quiz__subject__iexact=subject) | Q(quiz__subject_ref__name__iexact=subject))
        if subject_id:
            qs = qs.filter(quiz__subject_ref_id=subject_id)
        if topic_id:
            qs = qs.filter(quiz__topic_ref_id=topic_id)
        if module_id:
            qs = qs.filter(quiz__module_ref_id=module_id)
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        if student_id:
            qs = qs.filter(user_id=student_id)
        if semester_code:
            qs = qs.filter(semester_code=semester_code)
        if semester_number:
            qs = qs.filter(semester_number=semester_number)
        if section:
            qs = qs.filter(section__iexact=section)
        if semester:
            qs = qs.filter(quiz__semester=semester)
        if quiz_type:
            qs = qs.filter(quiz__quiz_type=quiz_type)
        if date_from:
            qs = qs.filter(finished_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(finished_at__date__lte=date_to)
        return qs

    def serialize_attempt(self, attempt):
        return {
            'attempt_id': attempt.id,
            'student_id': attempt.user_id,
            'student_name': attempt.student_name_snapshot or (attempt.user.full_name or attempt.user.email if attempt.user else ''),
            'student_email': attempt.user.email if attempt.user else '',
            'student_id_value': attempt.student_id_snapshot,
            'field': attempt.field_name_snapshot or getattr(getattr(attempt, 'field_of_study', None), 'name', ''),
            'semester_code': attempt.semester_code,
            'semester_number': attempt.semester_number,
            'section': attempt.section,
            'quiz_id': attempt.quiz_id,
            'quiz_title': attempt.quiz.title,
            'subject_id': attempt.quiz.subject_ref_id,
            'subject_name': getattr(attempt.quiz.subject_ref, 'name', '') or attempt.quiz.subject,
            'topic_id': attempt.quiz.topic_ref_id,
            'topic_name': getattr(attempt.quiz.topic_ref, 'name', ''),
            'module_id': attempt.quiz.module_ref_id,
            'module_title': getattr(attempt.quiz.module_ref, 'title', ''),
            'score': attempt.score,
            'percentage': attempt.percentage,
            'correct_answers': attempt.correct_answers,
            'wrong_answers': attempt.wrong_answers,
            'duration_taken': attempt.duration_taken,
            'pass_fail_status': attempt.pass_fail_status,
            'submitted_at': attempt.submitted_at or attempt.finished_at,
        }


class TeacherLeaderboardView(TeacherAnalyticsBaseView):
    def get(self, request):
        rows = (
            self.get_queryset()
            .values('user_id', 'user__full_name', 'user__email')
            .annotate(best_score=Max('score'), avg_score=Avg('score'), attempts=Count('id'))
            .order_by('-best_score', '-avg_score', 'user__full_name')[:200]
        )
        leaderboard = [
            {
                'student_id': row['user_id'],
                'student_name': row['user__full_name'] or row['user__email'],
                'student_email': row['user__email'],
                'best_score': float(row['best_score'] or 0.0),
                'avg_score': float(row['avg_score'] or 0.0),
                'attempts': row['attempts'] or 0,
            }
            for row in rows
        ]
        return Response({'leaderboard': leaderboard})


class TeacherScoreSummaryView(TeacherAnalyticsBaseView):
    def get(self, request):
        qs = self.get_queryset()
        total_attempts = qs.count()
        agg = qs.aggregate(
            highest_score=Max('score'),
            lowest_score=Min('score'),
            average_score=Avg('score'),
            pass_count=Count('id', filter=Q(pass_fail_status='pass')),
            fail_count=Count('id', filter=Q(pass_fail_status='fail')),
        )
        unique_students = qs.values('user_id').distinct().count()
        published_quizzes = qs.values('quiz_id').distinct().count() or 1
        completion_rate = (total_attempts / published_quizzes) * 100.0 if published_quizzes else 0.0
        payload = {
            'highest_score': float(agg['highest_score'] or 0.0),
            'lowest_score': float(agg['lowest_score'] or 0.0),
            'average_score': float(agg['average_score'] or 0.0),
            'total_students_attempted': unique_students,
            'pass_count': agg['pass_count'] or 0,
            'fail_count': agg['fail_count'] or 0,
            'quiz_completion_rate': completion_rate,
            'recent_attempt_count': total_attempts,
        }
        return Response(payload)


class HighestScorerView(TeacherAnalyticsBaseView):
    def get(self, request):
        top = self.get_queryset().order_by('-score', '-finished_at').first()
        if not top:
            return Response({'detail': 'No attempts found.'})
        return Response(self.serialize_attempt(top))


class LowestScorerView(TeacherAnalyticsBaseView):
    def get(self, request):
        low = self.get_queryset().order_by('score', '-finished_at').first()
        if not low:
            return Response({'detail': 'No attempts found.'})
        return Response(self.serialize_attempt(low))


class FieldWisePerformanceView(TeacherAnalyticsBaseView):
    def get(self, request):
        rows = (
            self.get_queryset()
            .values('field_of_study_id', 'field_name_snapshot')
            .annotate(
                attempts=Count('id'),
                average_score=Avg('score'),
                pass_count=Count('id', filter=Q(pass_fail_status='pass')),
                fail_count=Count('id', filter=Q(pass_fail_status='fail')),
            )
            .order_by('field_name_snapshot')
        )
        return Response(
            {
                'field_performance': [
                    {
                        'field_id': row['field_of_study_id'],
                        'field_name': row['field_name_snapshot'] or 'Unspecified',
                        'attempts': row['attempts'] or 0,
                        'average_score': float(row['average_score'] or 0.0),
                        'pass_count': row['pass_count'] or 0,
                        'fail_count': row['fail_count'] or 0,
                    }
                    for row in rows
                ]
            }
        )


class SubjectWisePerformanceView(TeacherAnalyticsBaseView):
    def get(self, request):
        rows = (
            self.get_queryset()
            .values('quiz__subject_ref__id', 'quiz__subject_ref__name', 'quiz__subject')
            .annotate(
                attempts=Count('id'),
                average_score=Avg('score'),
                highest_score=Max('score'),
                lowest_score=Min('score'),
            )
            .order_by('quiz__subject_ref__name', 'quiz__subject')
        )
        return Response(
            {
                'subject_performance': [
                    {
                        'subject_id': row['quiz__subject_ref__id'],
                        'subject': row['quiz__subject_ref__name'] or row['quiz__subject'] or 'Unspecified',
                        'attempts': row['attempts'] or 0,
                        'average_score': float(row['average_score'] or 0.0),
                        'highest_score': float(row['highest_score'] or 0.0),
                        'lowest_score': float(row['lowest_score'] or 0.0),
                    }
                    for row in rows
                ]
            }
        )


class SemesterCodePerformanceView(TeacherAnalyticsBaseView):
    def get(self, request):
        rows = (
            self.get_queryset()
            .values('semester_code')
            .annotate(
                attempts=Count('id'),
                average_score=Avg('score'),
                pass_count=Count('id', filter=Q(pass_fail_status='pass')),
                fail_count=Count('id', filter=Q(pass_fail_status='fail')),
            )
            .order_by('semester_code')
        )
        return Response(
            {
                'semester_code_performance': [
                    {
                        'semester_code': row['semester_code'] or 'Unspecified',
                        'attempts': row['attempts'] or 0,
                        'average_score': float(row['average_score'] or 0.0),
                        'pass_count': row['pass_count'] or 0,
                        'fail_count': row['fail_count'] or 0,
                    }
                    for row in rows
                ]
            }
        )


class SemesterNumberPerformanceView(TeacherAnalyticsBaseView):
    def get(self, request):
        rows = (
            self.get_queryset()
            .values('semester_number')
            .annotate(
                attempts=Count('id'),
                average_score=Avg('score'),
                pass_count=Count('id', filter=Q(pass_fail_status='pass')),
                fail_count=Count('id', filter=Q(pass_fail_status='fail')),
            )
            .order_by('semester_number')
        )
        return Response(
            {
                'semester_performance': [
                    {
                        'semester_number': row['semester_number'],
                        'attempts': row['attempts'] or 0,
                        'average_score': float(row['average_score'] or 0.0),
                        'pass_count': row['pass_count'] or 0,
                        'fail_count': row['fail_count'] or 0,
                    }
                    for row in rows
                ]
            }
        )


class SectionPerformanceView(TeacherAnalyticsBaseView):
    def get(self, request):
        rows = (
            self.get_queryset()
            .values('section')
            .annotate(
                attempts=Count('id'),
                average_score=Avg('score'),
                pass_count=Count('id', filter=Q(pass_fail_status='pass')),
                fail_count=Count('id', filter=Q(pass_fail_status='fail')),
            )
            .order_by('section')
        )
        return Response(
            {
                'section_performance': [
                    {
                        'section': row['section'] or 'Unspecified',
                        'attempts': row['attempts'] or 0,
                        'average_score': float(row['average_score'] or 0.0),
                        'pass_count': row['pass_count'] or 0,
                        'fail_count': row['fail_count'] or 0,
                    }
                    for row in rows
                ]
            }
        )


class TopicWisePerformanceView(TeacherAnalyticsBaseView):
    def get(self, request):
        rows = (
            self.get_queryset()
            .values('quiz__topic_ref__id', 'quiz__topic_ref__name', 'quiz__topic_ref__unit_name')
            .annotate(
                attempts=Count('id'),
                average_score=Avg('score'),
                highest_score=Max('score'),
                lowest_score=Min('score'),
            )
            .order_by('quiz__topic_ref__unit_name', 'quiz__topic_ref__name')
        )
        return Response(
            {
                'topic_performance': [
                    {
                        'topic_id': row['quiz__topic_ref__id'],
                        'topic_name': row['quiz__topic_ref__name'] or 'Unspecified',
                        'unit_name': row['quiz__topic_ref__unit_name'] or '',
                        'attempts': row['attempts'] or 0,
                        'average_score': float(row['average_score'] or 0.0),
                        'highest_score': float(row['highest_score'] or 0.0),
                        'lowest_score': float(row['lowest_score'] or 0.0),
                    }
                    for row in rows
                ]
            }
        )


class ModuleWisePerformanceView(TeacherAnalyticsBaseView):
    def get(self, request):
        rows = (
            self.get_queryset()
            .values('quiz__module_ref__id', 'quiz__module_ref__title', 'quiz__topic_ref__name')
            .annotate(
                attempts=Count('id'),
                average_score=Avg('score'),
                highest_score=Max('score'),
                lowest_score=Min('score'),
                completion_rate=Avg('percentage'),
            )
            .order_by('quiz__topic_ref__name', 'quiz__module_ref__title')
        )
        return Response(
            {
                'module_performance': [
                    {
                        'module_id': row['quiz__module_ref__id'],
                        'module_title': row['quiz__module_ref__title'] or 'Unspecified',
                        'topic_name': row['quiz__topic_ref__name'] or '',
                        'attempts': row['attempts'] or 0,
                        'average_score': float(row['average_score'] or 0.0),
                        'highest_score': float(row['highest_score'] or 0.0),
                        'lowest_score': float(row['lowest_score'] or 0.0),
                        'completion_rate': float(row['completion_rate'] or 0.0),
                    }
                    for row in rows
                ]
            }
        )


class QuizWisePerformanceView(TeacherAnalyticsBaseView):
    def get(self, request):
        rows = (
            self.get_queryset()
            .values('quiz_id', 'quiz__title', 'quiz__quiz_type')
            .annotate(
                attempts=Count('id'),
                average_score=Avg('score'),
                average_percentage=Avg('percentage'),
                pass_count=Count('id', filter=Q(pass_fail_status='pass')),
                fail_count=Count('id', filter=Q(pass_fail_status='fail')),
            )
            .order_by('-attempts', 'quiz__title')
        )
        return Response(
            {
                'quiz_performance': [
                    {
                        'quiz_id': row['quiz_id'],
                        'quiz_title': row['quiz__title'],
                        'quiz_type': row['quiz__quiz_type'],
                        'attempts': row['attempts'] or 0,
                        'average_score': float(row['average_score'] or 0.0),
                        'average_percentage': float(row['average_percentage'] or 0.0),
                        'pass_count': row['pass_count'] or 0,
                        'fail_count': row['fail_count'] or 0,
                    }
                    for row in rows
                ]
            }
        )


class SubjectPerformanceSummaryView(TeacherAnalyticsBaseView):
    def get(self, request):
        qs = self.get_queryset()
        rows = (
            qs.values('quiz__subject_ref__id', 'quiz__subject_ref__name', 'quiz__subject')
            .annotate(
                total_quizzes=Count('quiz_id', distinct=True),
                total_students_attempted=Count('user_id', distinct=True),
                average_class_performance=Avg('percentage'),
                top_score=Max('score'),
                weak_score=Min('score'),
            )
            .order_by('quiz__subject_ref__name', 'quiz__subject')
        )
        return Response(
            {
                'subjects': [
                    {
                        'subject_id': row['quiz__subject_ref__id'],
                        'subject_name': row['quiz__subject_ref__name'] or row['quiz__subject'] or 'Unspecified',
                        'total_quizzes': row['total_quizzes'] or 0,
                        'total_students_attempted': row['total_students_attempted'] or 0,
                        'average_class_performance': float(row['average_class_performance'] or 0.0),
                        'top_score': float(row['top_score'] or 0.0),
                        'weak_score': float(row['weak_score'] or 0.0),
                    }
                    for row in rows
                ]
            }
        )


class QuestionAccuracyAnalyticsView(TeacherAnalyticsBaseView):
    ordering = '-accuracy_rate'

    def get_rows(self):
        attempt_ids = list(self.get_queryset().values_list('id', flat=True))
        rows = (
            AttemptAnswer.objects.filter(attempt_id__in=attempt_ids)
            .values('question_id', 'question__text', 'question__module_ref__title')
            .annotate(
                total_attempts=Count('id'),
                correct_count=Count('id', filter=Q(is_correct=True)),
                wrong_count=Count('id', filter=Q(is_correct=False)),
            )
        )
        payload = []
        for row in rows:
            total_attempts = row['total_attempts'] or 0
            accuracy_rate = (float(row['correct_count'] or 0) / float(total_attempts or 1)) * 100.0
            payload.append(
                {
                    'question_id': row['question_id'],
                    'question_text': row['question__text'],
                    'module_title': row['question__module_ref__title'] or '',
                    'total_attempts': total_attempts,
                    'correct_count': row['correct_count'] or 0,
                    'wrong_count': row['wrong_count'] or 0,
                    'accuracy_rate': accuracy_rate,
                }
            )
        reverse = self.ordering.startswith('-')
        key = self.ordering.lstrip('-')
        return sorted(payload, key=lambda item: item.get(key) or 0, reverse=reverse)[:300]

    def get(self, request):
        return Response({'questions': self.get_rows()})


class HardestQuestionsView(QuestionAccuracyAnalyticsView):
    ordering = 'accuracy_rate'

    def get(self, request):
        return Response({'questions': self.get_rows()[:10]})


class EasiestQuestionsView(QuestionAccuracyAnalyticsView):
    ordering = '-accuracy_rate'

    def get(self, request):
        return Response({'questions': self.get_rows()[:10]})


class RecentAttemptsView(TeacherAnalyticsBaseView):
    def get(self, request):
        rows = self.get_queryset().order_by('-finished_at', '-id')[:25]
        return Response({'attempts': [self.serialize_attempt(item) for item in rows]})
