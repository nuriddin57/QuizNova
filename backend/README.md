# Backend (Django)

Requirements: create a virtualenv and install dependencies from ../requirements.txt

Development run (sqlite default):

```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r ..\requirements.txt
cd backend
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

If using Redis for Channels, set `REDIS_URL` env var and ensure `channels-redis` is installed.

Running tests:

```powershell
cd backend
\.venv\Scripts\activate
pip install -r ..\requirements.txt
python manage.py test
```

Migrations:

- Use `python manage.py makemigrations` to generate migrations after model changes.
- Commit generated migrations and run `python manage.py migrate` before running the server or tests.

Stress testing:
- See STRESS_TEST.md for a basic stress-test scenario and guidelines.
