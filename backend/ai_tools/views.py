from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from fields.models import StudyField
from users.permissions import IsTeacher

from .serializers import (
    AIBulkAddToQuizRequestSerializer,
    AIQuestionGenerateRequestSerializer,
    AISaveToQuestionBankRequestSerializer,
)
from .services import generate_questions, to_quiz_payload_questions


class GenerateAIQuestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def post(self, request):
        serializer = AIQuestionGenerateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        field_name = (data.get('field_of_study_name') or '').strip()
        field_id = data.get('field_of_study_id')
        if not field_name and field_id:
            field = StudyField.objects.filter(id=field_id).first()
            if field:
                field_name = field.name

        generated = generate_questions(
            topic=data['topic'],
            subject=data['subject'],
            difficulty=data['difficulty'],
            number_of_questions=data['number_of_questions'],
            field_of_study_name=field_name,
        )
        generated['quiz_payload'] = to_quiz_payload_questions(generated['questions'])
        return Response(generated, status=status.HTTP_200_OK)


class BulkAddAIQuestionsToQuizView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def post(self, request):
        serializer = AIBulkAddToQuizRequestSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        created = serializer.create_questions()
        return Response(
            {
                'detail': f'{len(created)} generated questions were added to the quiz.',
                'created_question_ids': [question.id for question in created],
            },
            status=status.HTTP_201_CREATED,
        )


class SaveAIQuestionsToQuestionBankView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def post(self, request):
        serializer = AISaveToQuestionBankRequestSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        entries, created_quiz_question_ids = serializer.save_entries()
        return Response(
            {
                'detail': f'{len(entries)} generated questions were saved to the question bank.',
                'question_bank_ids': [entry.id for entry in entries],
                'created_quiz_question_ids': created_quiz_question_ids,
            },
            status=status.HTTP_201_CREATED,
        )
