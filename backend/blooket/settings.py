
import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')


def csv_to_list(env_name, fallback):
    raw = os.getenv(env_name, fallback)
    return [value.strip() for value in raw.split(',') if value.strip()]


SECRET_KEY = os.getenv('SECRET_KEY', 'changeme-local')
DEBUG = os.getenv('DEBUG', '0') == '1'
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development').strip().lower()
if ENVIRONMENT == 'production' and SECRET_KEY == 'changeme-local':
    raise RuntimeError('SECRET_KEY must be set in production.')

ALLOWED_HOSTS = csv_to_list('ALLOWED_HOSTS', '127.0.0.1,localhost,.onrender.com')

CORS_ALLOWED_ORIGINS = csv_to_list(
    'CORS_ALLOWED_ORIGINS',
    'http://127.0.0.1:5173,http://localhost:5173,https://quiz-nova-woad.vercel.app'
)

CSRF_TRUSTED_ORIGINS = csv_to_list(
    'CSRF_TRUSTED_ORIGINS',
    'https://quiz-nova-woad.vercel.app'
)

INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework.authtoken',
    'corsheaders',
    'channels',
    'fields.apps.FieldsConfig',
    'subjects.apps.SubjectsConfig',
    'users',
    'quizzes',
    'games',
    'ai_tools.apps.AIToolsConfig',
    'results.apps.ResultsConfig',
    'analytics.apps.AnalyticsConfig',
    'integrations.apps.IntegrationsConfig',
    'marketing.apps.MarketingConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'blooket.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'blooket.wsgi.application'
ASGI_APPLICATION = 'blooket.asgi.application'

DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=int(os.getenv('DB_CONN_MAX_AGE', '600')),
            ssl_require=os.getenv('DB_SSL_REQUIRE', '0') == '1',
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = os.getenv('MEDIA_URL', '/media/')
MEDIA_ROOT = BASE_DIR / os.getenv('MEDIA_ROOT', 'media')
STATICFILES_DIRS = []
LOCAL_STATIC_DIR = BASE_DIR / 'static'
FRONTEND_DIST_DIR = LOCAL_STATIC_DIR / 'frontend'
for directory in (LOCAL_STATIC_DIR, FRONTEND_DIST_DIR):
    if directory.exists():
        STATICFILES_DIRS.append(directory)
FRONTEND_INDEX_FILE = FRONTEND_DIST_DIR / 'index.html'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# Pagination for quiz listing
REST_FRAMEWORK.update({
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': os.getenv('THROTTLE_ANON', '80/minute'),
        'user': os.getenv('THROTTLE_USER', '300/minute'),
        'join': os.getenv('THROTTLE_JOIN', '30/minute'),
        'host_create': os.getenv('THROTTLE_HOST_CREATE', '30/hour'),
    },
})

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('JWT_ACCESS_MINUTES', '60'))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_REFRESH_DAYS', '14'))),
    'ROTATE_REFRESH_TOKENS': os.getenv('JWT_ROTATE_REFRESH_TOKENS', '1') == '1',
    'BLACKLIST_AFTER_ROTATION': os.getenv('JWT_BLACKLIST_AFTER_ROTATION', '0') == '1',
    'AUTH_HEADER_TYPES': ('Bearer',),
}

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = os.getenv('CORS_ALLOW_ALL_ORIGINS', '0') == '1'
CORS_ALLOWED_ORIGINS = csv_to_list(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173',
)
CSRF_TRUSTED_ORIGINS = csv_to_list(
    'CSRF_TRUSTED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173',
)

FRONTEND_APP_URL = os.getenv('FRONTEND_APP_URL') or (CORS_ALLOWED_ORIGINS[0] if CORS_ALLOWED_ORIGINS else 'http://127.0.0.1:5173')
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', '0') == '1'
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', '0') == '1'
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', '0') == '1'
SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '0'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv('SECURE_HSTS_INCLUDE_SUBDOMAINS', '0') == '1'
SECURE_HSTS_PRELOAD = os.getenv('SECURE_HSTS_PRELOAD', '0') == '1'
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

USE_X_FORWARDED_HOST = os.getenv('USE_X_FORWARDED_HOST', '1') == '1'

UNIVERSITY_PROVIDER = os.getenv('UNIVERSITY_PROVIDER', 'sharda')
UNIVERSITY_API_BASE_URL = os.getenv('UNIVERSITY_API_BASE_URL', '').rstrip('/')
UNIVERSITY_CLIENT_ID = os.getenv('UNIVERSITY_CLIENT_ID', '')
UNIVERSITY_CLIENT_SECRET = os.getenv('UNIVERSITY_CLIENT_SECRET', '')
UNIVERSITY_REDIRECT_URI = os.getenv('UNIVERSITY_REDIRECT_URI', '')
UNIVERSITY_AUTH_URL = os.getenv('UNIVERSITY_AUTH_URL', '')
UNIVERSITY_TOKEN_URL = os.getenv('UNIVERSITY_TOKEN_URL', '')
UNIVERSITY_USERINFO_URL = os.getenv('UNIVERSITY_USERINFO_URL', '')
UNIVERSITY_STUDENTS_ENDPOINT = os.getenv('UNIVERSITY_STUDENTS_ENDPOINT', '')
UNIVERSITY_TEACHERS_ENDPOINT = os.getenv('UNIVERSITY_TEACHERS_ENDPOINT', '')
UNIVERSITY_SUBJECTS_ENDPOINT = os.getenv('UNIVERSITY_SUBJECTS_ENDPOINT', '')
UNIVERSITY_SERVICE_ACCESS_TOKEN = os.getenv('UNIVERSITY_SERVICE_ACCESS_TOKEN', '')
UNIVERSITY_SYNC_TIMEOUT = int(os.getenv('UNIVERSITY_SYNC_TIMEOUT', '20'))

# Channels config: prefer Redis via env, else in-memory for development
REDIS_URL = os.getenv('REDIS_URL')
if REDIS_URL:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {"hosts": [REDIS_URL]},
        },
    }
else:
    CHANNEL_LAYERS = {
        'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}
    }

JAZZMIN_SETTINGS = {
    'site_title': 'QuizNova Jazzmin',
    'site_header': 'QuizNova University Admin',
    'site_brand': 'QuizNova Jazzmin',
    'welcome_sign': 'Sharda University QuizNova administration',
    'copyright': 'QuizNova',
}
