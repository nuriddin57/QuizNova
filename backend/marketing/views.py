from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Testimonial, WeeklyChallenge
from .serializers import TestimonialSerializer, WeeklyChallengeSerializer


class PublicTestimonialsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        queryset = Testimonial.objects.filter(is_active=True).order_by('-created_at')[:6]
        serializer = TestimonialSerializer(queryset, many=True, context={'request': request})
        return Response({'results': serializer.data})


class CurrentWeeklyChallengeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        challenge = (
            WeeklyChallenge.objects
            .filter(is_active=True, deadline__gte=timezone.now())
            .order_by('deadline', '-created_at')
            .first()
        )
        if not challenge:
            return Response({'challenge': None})
        serializer = WeeklyChallengeSerializer(challenge, context={'request': request})
        return Response({'challenge': serializer.data})


class WeeklyChallengeDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, code):
        challenge = WeeklyChallenge.objects.filter(code__iexact=code).first()
        if not challenge:
            return Response({'detail': 'Challenge not found.'}, status=404)
        serializer = WeeklyChallengeSerializer(challenge, context={'request': request})
        return Response(serializer.data)

