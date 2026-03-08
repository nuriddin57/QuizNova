import json
import logging
from abc import ABC, abstractmethod
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from django.conf import settings

logger = logging.getLogger(__name__)


class UniversityProviderError(Exception):
    pass


class BaseUniversityProvider(ABC):
    provider_key = 'base'

    def __init__(self):
        self.api_base_url = settings.UNIVERSITY_API_BASE_URL
        self.client_id = settings.UNIVERSITY_CLIENT_ID
        self.client_secret = settings.UNIVERSITY_CLIENT_SECRET
        self.redirect_uri = settings.UNIVERSITY_REDIRECT_URI
        self.auth_url = settings.UNIVERSITY_AUTH_URL
        self.token_url = settings.UNIVERSITY_TOKEN_URL
        self.userinfo_url = settings.UNIVERSITY_USERINFO_URL
        self.students_endpoint = settings.UNIVERSITY_STUDENTS_ENDPOINT
        self.teachers_endpoint = settings.UNIVERSITY_TEACHERS_ENDPOINT
        self.subjects_endpoint = settings.UNIVERSITY_SUBJECTS_ENDPOINT
        self.service_access_token = settings.UNIVERSITY_SERVICE_ACCESS_TOKEN
        self.timeout = settings.UNIVERSITY_SYNC_TIMEOUT

    @property
    def supports_oauth2(self):
        return bool(self.auth_url and self.token_url and self.userinfo_url and self.client_id and self.redirect_uri)

    @property
    def supports_token_sync(self):
        return bool(self.students_endpoint or self.teachers_endpoint or self.subjects_endpoint)

    @property
    def supports_csv(self):
        return True

    def build_absolute_url(self, value):
        if not value:
            return ''
        if value.startswith('http://') or value.startswith('https://'):
            return value
        if not self.api_base_url:
            raise UniversityProviderError('University API base URL is not configured.')
        return f"{self.api_base_url}/{value.lstrip('/')}"

    def _request_json(self, url, method='GET', headers=None, data=None):
        request_headers = {'Accept': 'application/json', **(headers or {})}
        payload = None
        if data is not None:
            if request_headers.get('Content-Type') == 'application/x-www-form-urlencoded':
                payload = urlencode(data).encode('utf-8')
            else:
                request_headers.setdefault('Content-Type', 'application/json')
                payload = json.dumps(data).encode('utf-8')

        request = Request(url, data=payload, headers=request_headers, method=method)
        try:
            with urlopen(request, timeout=self.timeout) as response:
                body = response.read().decode('utf-8')
        except (HTTPError, URLError) as exc:
            logger.warning('University provider request failed for %s %s: %s', method, url, exc)
            raise UniversityProviderError(f'University provider request failed for {url}.') from exc

        try:
            return json.loads(body)
        except ValueError as exc:
            logger.warning('University provider returned invalid JSON for %s %s.', method, url)
            raise UniversityProviderError(f'University provider returned invalid JSON for {url}.') from exc

    def get_authorization_url(self, state):
        if not self.supports_oauth2:
            raise UniversityProviderError('OAuth2 login is not configured for this provider.')
        query = urlencode({
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': 'openid profile email',
            'state': state,
        })
        separator = '&' if '?' in self.auth_url else '?'
        return f'{self.auth_url}{separator}{query}'

    def exchange_code_for_token(self, code):
        if not self.token_url:
            raise UniversityProviderError('University token URL is not configured.')
        return self._request_json(
            self.token_url,
            method='POST',
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': self.redirect_uri,
                'client_id': self.client_id,
                'client_secret': self.client_secret,
            },
        )

    def get_service_token(self):
        if self.service_access_token:
            return self.service_access_token
        if not (self.token_url and self.client_id and self.client_secret):
            raise UniversityProviderError('No service token configuration available for live sync.')
        payload = self._request_json(
            self.token_url,
            method='POST',
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            data={
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
            },
        )
        token = payload.get('access_token')
        if not token:
            raise UniversityProviderError('Service token response did not include access_token.')
        return token

    def fetch_current_user(self, token):
        if not self.userinfo_url:
            raise UniversityProviderError('University userinfo URL is not configured.')
        return self._request_json(
            self.userinfo_url,
            headers={'Authorization': f'Bearer {token}'},
        )

    def fetch_students(self):
        return self._fetch_collection(self.students_endpoint, 'students')

    def fetch_teachers(self):
        return self._fetch_collection(self.teachers_endpoint, 'teachers')

    def fetch_subjects(self):
        return self._fetch_collection(self.subjects_endpoint, 'subjects')

    def _fetch_collection(self, endpoint, label):
        if not endpoint:
            raise UniversityProviderError(f'University {label} endpoint is not configured.')
        token = self.get_service_token()
        payload = self._request_json(
            self.build_absolute_url(endpoint),
            headers={'Authorization': f'Bearer {token}'},
        )
        if isinstance(payload, dict):
            for key in ('results', 'data', label):
                if isinstance(payload.get(key), list):
                    return payload[key]
        if isinstance(payload, list):
            return payload
        raise UniversityProviderError(f'Unexpected {label} payload shape.')

    @abstractmethod
    def map_remote_role(self, remote_user):
        raise NotImplementedError

    @abstractmethod
    def normalize_user(self, remote_user):
        raise NotImplementedError

    @abstractmethod
    def normalize_subject(self, remote_subject):
        raise NotImplementedError
