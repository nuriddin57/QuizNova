# QuizNova Deployment

## Backend

Backend path: `backend/`

### Production env vars

Required:

- `ENVIRONMENT=production`
- `SECRET_KEY=<strong-random-secret>`
- `DEBUG=0`
- `DATABASE_URL=<postgresql-connection-url>`
- `ALLOWED_HOSTS=<backend-domain-without-protocol>`
- `CORS_ALLOWED_ORIGINS=<frontend-origin>`
- `CSRF_TRUSTED_ORIGINS=<frontend-origin>`

Recommended:

- `DB_SSL_REQUIRE=1`
- `DB_CONN_MAX_AGE=600`
- `REDIS_URL=<redis-url>`
- `FRONTEND_APP_URL=<frontend-origin>`
- `SECURE_SSL_REDIRECT=1`
- `SESSION_COOKIE_SECURE=1`
- `CSRF_COOKIE_SECURE=1`
- `SECURE_HSTS_SECONDS=31536000`
- `SECURE_HSTS_INCLUDE_SUBDOMAINS=1`
- `SECURE_HSTS_PRELOAD=1`
- `USE_X_FORWARDED_HOST=1`
- `JWT_ACCESS_MINUTES=60`
- `JWT_REFRESH_DAYS=14`
- `GUNICORN_WORKERS=3`
- `GUNICORN_THREADS=2`
- `GUNICORN_TIMEOUT=120`

### Build/start commands

Build command:

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
```

Start command:

```bash
gunicorn blooket.wsgi:application -c gunicorn.conf.py
```

### Render / Railway steps

1. Create a PostgreSQL database.
2. Set backend root directory to `backend`.
3. Add the env vars listed above.
4. Use the build/start commands above.
5. After first deploy, optionally load fixtures:

```bash
python manage.py loaddata marketing/fixtures/marketing.json
python manage.py loaddata users/fixtures/parents.json
```

## Frontend

Frontend path: `frontend/`

### Production env vars

- `VITE_API_URL=https://<your-backend-domain>`
- `VITE_APP_ENV=production`

### Build command

```bash
npm install
npm run build
```

### Vercel / Netlify steps

1. Set root directory to `frontend`.
2. Add `VITE_API_URL` pointing to the backend origin.
3. Add `VITE_APP_ENV=production`.
4. Build command: `npm run build`
5. Output directory: `dist`

## Migration and static commands

```bash
cd backend
python manage.py migrate
python manage.py collectstatic --noinput
```

## Deployment checklist

- Backend deploys with `DEBUG=0`
- PostgreSQL is connected through `DATABASE_URL`
- `ALLOWED_HOSTS` contains the backend hostname
- `CORS_ALLOWED_ORIGINS` contains the frontend origin
- `CSRF_TRUSTED_ORIGINS` contains the frontend origin with protocol
- Frontend `VITE_API_URL` points to backend HTTPS origin
- `python manage.py migrate` ran successfully
- `python manage.py collectstatic --noinput` ran successfully
- Health check works at `/api/health/`
- Login works from frontend against production backend
- Static files load correctly in admin
- If using websockets, Redis is configured

## Troubleshooting

- `DisallowedHost`: add the backend hostname to `ALLOWED_HOSTS`
- `CORS` errors: fix `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`
- DB SSL errors on managed Postgres: set `DB_SSL_REQUIRE=1`
- Admin/static assets missing: run `collectstatic --noinput`
- Frontend calling localhost in production: set `VITE_API_URL` and redeploy
