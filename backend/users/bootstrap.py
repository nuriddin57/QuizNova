import logging
import os

from django.contrib.auth import get_user_model
from django.db.utils import OperationalError, ProgrammingError


logger = logging.getLogger(__name__)
_bootstrap_attempted = False


def _is_enabled(value):
    return str(value).strip().lower() in {'1', 'true', 'yes', 'on'}


def create_superuser_from_env():
    global _bootstrap_attempted

    if _bootstrap_attempted:
        return
    _bootstrap_attempted = True

    if not _is_enabled(os.getenv('DJANGO_CREATE_SUPERUSER', '0')):
        return

    email = (os.getenv('DJANGO_SUPERUSER_EMAIL') or '').strip()
    password = os.getenv('DJANGO_SUPERUSER_PASSWORD') or ''

    if not email or not password:
        logger.warning('Superuser bootstrap skipped: required environment variables are missing.')
        return

    User = get_user_model()
    try:
        if User.objects.filter(email=email).exists():
            return

        User.objects.create_superuser(
            email=email,
            password=password,
        )
    except (OperationalError, ProgrammingError):
        logger.warning('Superuser bootstrap skipped: database is not ready.', exc_info=True)
