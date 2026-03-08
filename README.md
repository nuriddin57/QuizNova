# QuizNova (Blooket Style)

Full-stack playground that pairs a Django REST backend with a Vite/React frontend. Follow the checklist below to bring the entire stack up on Windows PowerShell.

## Run Checklist (fresh clone)
1. **Backend env & deps**
	- `cd backend`
	- `python -m venv venv`
	- `venv\Scripts\activate`
	- `pip install -r requirements.txt`
	- `copy .env.example .env` (edit `SECRET_KEY` if desired)
2. **Database & admin user**
	- `python manage.py migrate`
	- `python manage.py createsuperuser`
3. **Start backend API**
	- `python manage.py runserver` → http://127.0.0.1:8000
	- Verify health endpoint: `curl http://127.0.0.1:8000/api/health/` (expect `{"status":"ok"}`)
4. **Frontend setup** (new terminal)
	- `cd frontend`
	- `copy .env.example .env`
	- `npm install`
	- `npm run dev` → http://localhost:5173 (proxy forwards `/api` calls to Django)

## Troubleshooting
- **ModuleNotFoundError (e.g., `django`, `rest_framework`, `corsheaders`)**: ensure the virtualenv is active and re-run `pip install -r backend/requirements.txt`.
- **/login or /register blank**: `npm run dev` must be running so React Router can serve those routes.
- **API call fails / CORS**: confirm the backend console logs show requests, check `backend/.env` has the frontend origins, and hit `curl http://127.0.0.1:8000/api/health/`.

## Demo Login
- If you seeded demo data with `python manage.py seed_demo`, the default password is `demo1234`.
- Teacher login: `john.doe@shardauniversity.uz` + `demo1234`
- Student login by ID: `202499123` + `demo1234`
- Student login by email: `demo.student1@ug.shardauniversity.uz` + `demo1234`

## Project Layout
- `backend/` – Django project (`blooket`), DRF, Channels, JWT auth, `/api/health` endpoint.
- `frontend/` – React + Vite + Tailwind, router for `/`, `/login`, `/register`, `/dashboard`, `/discover`, API health badge in the navbar.

See `backend/README.md` for legacy notes and `frontend/src` for UI structure.
