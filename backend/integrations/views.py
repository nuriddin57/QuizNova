import logging
import secrets
from urllib.parse import urlencode

from django.conf import settings
from django.core import signing
from django.http import HttpResponseRedirect
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from users.permissions import IsAdminRole

from .models import UniversityIntegrationStatus
from .providers.base import UniversityProviderError
from .providers.sharda_provider import ShardaProvider
from .services.sync_subjects import sync_subjects
from .services.sync_users import sync_students, sync_teachers, sync_university_user

logger = logging.getLogger(__name__)
STATE_COOKIE_NAME = 'quiznova_university_state'
STATE_SALT = 'quiznova-university-sso'


PROVIDERS = {
    'sharda': ShardaProvider,
}


def get_provider():
    provider_cls = PROVIDERS.get(settings.UNIVERSITY_PROVIDER, ShardaProvider)
    return provider_cls()


def get_status_record(provider):
    status_record, _ = UniversityIntegrationStatus.objects.get_or_create(provider_key=provider.provider_key)
    status_record.oauth_enabled = provider.supports_oauth2
    status_record.sync_enabled = provider.supports_token_sync
    status_record.csv_enabled = provider.supports_csv
    status_record.last_status_check_at = timezone.now()
    status_record.save()
    return status_record


def build_frontend_callback_url(**params):
    query = urlencode({key: value for key, value in params.items() if value not in (None, '')})
    return f"{settings.FRONTEND_APP_URL.rstrip('/')}/auth/university/callback#{query}"


class UniversityStatusView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        provider = get_provider()
        status_record = get_status_record(provider)
        return Response({
            'provider': provider.provider_key,
            'supports_oauth2': provider.supports_oauth2,
            'supports_token_sync': provider.supports_token_sync,
            'supports_csv': provider.supports_csv,
            'status': {
                'last_status_check_at': status_record.last_status_check_at,
                'last_students_sync_at': status_record.last_students_sync_at,
                'last_teachers_sync_at': status_record.last_teachers_sync_at,
                'last_subjects_sync_at': status_record.last_subjects_sync_at,
                'last_students_sync_result': status_record.last_students_sync_result,
                'last_teachers_sync_result': status_record.last_teachers_sync_result,
                'last_subjects_sync_result': status_record.last_subjects_sync_result,
                'imported_students_count': status_record.imported_students_count,
                'imported_teachers_count': status_record.imported_teachers_count,
                'imported_subjects_count': status_record.imported_subjects_count,
            },
        })


class UniversityLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        provider = get_provider()
        if not provider.supports_oauth2:
            return Response({'detail': 'University OAuth login is not configured.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            state_payload = {
                'nonce': secrets.token_urlsafe(24),
                'next': request.query_params.get('next', '/dashboard'),
            }
            encoded_state = signing.dumps(state_payload, salt=STATE_SALT)
            redirect_url = provider.get_authorization_url(encoded_state)
            response = HttpResponseRedirect(redirect_url)
            response.set_cookie(
                STATE_COOKIE_NAME,
                encoded_state,
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                max_age=600,
            )
            get_status_record(provider)
            return response
        except UniversityProviderError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class UniversityCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        provider = get_provider()
        state = request.query_params.get('state')
        cookie_state = request.COOKIES.get(STATE_COOKIE_NAME)
        code = request.query_params.get('code')

        try:
            if not state or not cookie_state or state != cookie_state:
                raise UniversityProviderError('Invalid OAuth state.')
            signing.loads(state, salt=STATE_SALT, max_age=600)
            if not code:
                raise UniversityProviderError('Missing authorization code.')

            token_payload = provider.exchange_code_for_token(code)
            access_token = token_payload.get('access_token')
            if not access_token:
                raise UniversityProviderError('University token response is missing access_token.')
            remote_user = provider.fetch_current_user(access_token)
            normalized_user = provider.normalize_user(remote_user)
            user, _ = sync_university_user(normalized_user)

            refresh = RefreshToken.for_user(user)
            refresh['role'] = user.role
            refresh['email'] = user.email
            response = HttpResponseRedirect(build_frontend_callback_url(
                access=str(refresh.access_token),
                refresh=str(refresh),
                role=user.role,
            ))
        except Exception as exc:
            logger.exception('University callback failed.')
            message = str(exc) if isinstance(exc, UniversityProviderError) else 'University login failed.'
            response = HttpResponseRedirect(build_frontend_callback_url(error=message))
        response.delete_cookie(STATE_COOKIE_NAME)
        return response


class UniversitySyncStudentsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def post(self, request):
        provider = get_provider()
        result = sync_students(provider, csv_file=request.FILES.get('file'))
        return Response(result, status=status.HTTP_200_OK)


class UniversitySyncTeachersView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def post(self, request):
        provider = get_provider()
        result = sync_teachers(provider, csv_file=request.FILES.get('file'))
        return Response(result, status=status.HTTP_200_OK)


class UniversitySyncSubjectsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def post(self, request):
        provider = get_provider()
        result = sync_subjects(provider, csv_file=request.FILES.get('file'))
        return Response(result, status=status.HTTP_200_OK)
