from django.urls import path

from .views import CurrentWeeklyChallengeView, PublicTestimonialsView, WeeklyChallengeDetailView


urlpatterns = [
    path('marketing/testimonials/', PublicTestimonialsView.as_view(), name='marketing-testimonials'),
    path('marketing/weekly-challenge/current/', CurrentWeeklyChallengeView.as_view(), name='marketing-weekly-challenge-current'),
    path('marketing/weekly-challenge/<str:code>/', WeeklyChallengeDetailView.as_view(), name='marketing-weekly-challenge-detail'),
]

