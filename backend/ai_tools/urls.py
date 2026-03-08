from django.urls import path

from .views import BulkAddAIQuestionsToQuizView, GenerateAIQuestionsView, SaveAIQuestionsToQuestionBankView

urlpatterns = [
    path('ai/questions/generate', GenerateAIQuestionsView.as_view(), name='ai-generate-no-slash'),
    path('ai/questions/generate/', GenerateAIQuestionsView.as_view(), name='ai-generate'),
    path('ai/questions/bulk-add', BulkAddAIQuestionsToQuizView.as_view(), name='ai-bulk-add-no-slash'),
    path('ai/questions/bulk-add/', BulkAddAIQuestionsToQuizView.as_view(), name='ai-bulk-add'),
    path('ai/questions/save-to-bank', SaveAIQuestionsToQuestionBankView.as_view(), name='ai-save-to-bank-no-slash'),
    path('ai/questions/save-to-bank/', SaveAIQuestionsToQuestionBankView.as_view(), name='ai-save-to-bank'),
]
