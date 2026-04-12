from rest_framework import serializers

from .models import Testimonial, WeeklyChallenge


def _resolve_language(request):
    header = (getattr(request, 'headers', {}) or {}).get('Accept-Language', '')
    normalized = header.lower()
    if normalized.startswith('uz'):
        return 'uz'
    if normalized.startswith('ru'):
        return 'ru'
    return 'en'


def _localized_value(instance, field_name, lang_code):
    localized = getattr(instance, f'{field_name}_{lang_code}', '')
    return localized or getattr(instance, field_name, '')


class TestimonialSerializer(serializers.ModelSerializer):
    quote = serializers.SerializerMethodField()
    role_label = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = Testimonial
        fields = (
            'id',
            'name',
            'role',
            'role_label',
            'school',
            'quote',
            'avatar',
            'created_at',
        )

    def get_quote(self, obj):
        return _localized_value(obj, 'quote', _resolve_language(self.context.get('request')))


class WeeklyChallengeSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    reward = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyChallenge
        fields = (
            'id',
            'title',
            'description',
            'reward',
            'deadline',
            'code',
            'is_active',
            'is_expired',
            'created_at',
        )

    def get_title(self, obj):
        return _localized_value(obj, 'title', _resolve_language(self.context.get('request')))

    def get_description(self, obj):
        return _localized_value(obj, 'description', _resolve_language(self.context.get('request')))

    def get_reward(self, obj):
        return _localized_value(obj, 'reward', _resolve_language(self.context.get('request')))

    def get_is_expired(self, obj):
        from django.utils import timezone

        return obj.deadline <= timezone.now()

