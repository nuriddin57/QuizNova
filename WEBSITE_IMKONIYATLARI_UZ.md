# QuizNova veb-sayti: Imkoniyatlar

## 1. Platforma nima qiladi
QuizNova - quiz, exam va live game formatlarini birlashtirgan ta'limiy platforma. O'qituvchi quiz yaratadi, savollar bankini boshqaradi, jonli o'yin yoki assignment tayyorlaydi. Talaba esa o'ziga biriktirilgan quizlarni ishlaydi, natijalarini ko'radi va live sessiyalarda qatnashadi.

Texnologiyalar:
- Frontend: React + Vite
- Backend: Django + DRF + Channels (WebSocket)

## 2. Foydalanuvchi rollari
- `admin`: tizim foydalanuvchilarini boshqaradi, barcha quiz va natijalarni ko'rishi mumkin.
- `teacher`: quiz yaratadi, tahrirlaydi, publish qiladi, savollar bankidan foydalanadi, analytics ko'radi, live game ochadi.
- `student`: o'ziga mos quizlarni ko'radi, exam topshiradi, natijalar tarixini kuzatadi, live game'ga qo'shiladi.
- `guest`: ayrim live o'yinlarda nickname bilan qo'shilish ssenariysi mavjud.

## 3. Asosiy imkoniyatlar
- Ro'yxatdan o'tish, login, token refresh va profilni olish.
- University login callback va student uchun field selection oqimi.
- Role-based dashboard: teacher, student va admin uchun alohida yo'nalishlar.
- Quiz yaratish, tahrirlash, o'chirish, publish/unpublish qilish.
- Quizlarni qidirish, filterlash va saralash.
- Quizni subject, topic, module, semester, section va field bo'yicha biriktirish.
- Public/private visibility va `mine=true` ko'rinishida shaxsiy quizlarni ajratish.
- Quizga savollarni qo'lda qo'shish yoki question bank'dan biriktirish.
- Question bank yaratish, qayta ishlatish va bulk import qilish.
- AI yordamida savollar generatsiya qilish va quizga saqlash.
- Student uchun exam start/submit oqimi.
- Natijani ball, foiz, to'g'ri/noto'g'ri javob va pass/fail holati bilan hisoblash.
- Student result history va subject performance sahifalari.
- Teacher analytics va quiz-wise performance ko'rish.
- Live lobby yaratish, room code/link orqali qo'shilish.
- WebSocket orqali real-time savol yuborish, javob olish va live leaderboard.
- Discover, subjects, topics, modules va set detail sahifalari.
- Ko'p til: `uz`, `ru`, `en`.
- Theme: `light` / `dark`.
- Navbar ichida API health holatini ko'rsatish.

## 4. Batafsil funksional bloklar

### 4.1 Auth va account
- Email yoki ayrim student login formatlari bilan tizimga kirish.
- `register`, `login`, `refresh token`, `me` endpointlari mavjud.
- Student va teacher route'lari himoyalangan.
- Admin uchun alohida users sahifasi bor.

### 4.2 Quiz boshqaruvi
- Teacher/admin yangi quiz yaratadi.
- Mavjud quizni yangilaydi yoki o'chiradi.
- Quizni `practice`, `live`, `assignment`, `exam` kabi formatlarda yuritish mumkin.
- Difficulty, duration, total marks, passing marks, retry va answer reveal kabi qoidalar saqlanadi.
- Quiz owner yoki admin publish flag'ini yoqib/o'chira oladi.

### 4.3 Quiz targeting
- Quiz barcha field'lar uchun yoki faqat tanlangan field uchun ochilishi mumkin.
- Subject, topic va module bilan bog'lash mumkin.
- Semester code, semester number va section bo'yicha cheklash mavjud.
- Student faqat o'ziga mos publish qilingan quizlarni ko'radi.

### 4.4 Question bank va import
- Subject/topic/module bo'yicha reusable savollar banki ishlaydi.
- Savollarni bankdan quizga bir klikda qo'shish mumkin.
- CSV, JSON yoki boshqa bulk import ssenariylari uchun import oqimi mavjud.
- Savol turi, difficulty, marks va explanation bilan saqlanadi.

### 4.5 AI savol generatsiyasi
- Teacher uchun AI question generation sahifasi mavjud.
- Generatsiya qilingan savollarni bevosita quiz banki yoki tanlangan quizga saqlash mumkin.
- Bu qo'lda savol tayyorlash vaqtini qisqartiradi.

### 4.6 Live game
- Teacher host sifatida room ochadi.
- Student room code yoki link bilan join qiladi.
- Lobby, room va play sahifalari mavjud.
- Real-time yangilanishlar WebSocket orqali ishlaydi.
- Sessiya davomida live score va yakunda leaderboard ko'rsatiladi.

### 4.7 Exam va natijalar
- Student published quizni boshlaydi.
- Savollar serverdan tartiblangan holda olinadi.
- Submit qilinganda score, percentage, correct/wrong va pass/fail hisoblanadi.
- Natijalar urinishlar tarixi sifatida saqlanadi.
- Student o'z history va subject performance bo'limini ko'radi.
- Teacher o'zi yaratgan quizlar bo'yicha umumiy natijalarni filter bilan ko'radi.

### 4.8 Akademik katalog
- Subjects ro'yxati.
- Har bir subject ichida related quizzes.
- Topic detail va module detail sahifalari.
- Set detail va discover orqali tayyor kontentni ko'rish.

## 5. Muhim API endpointlar
Auth:
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/token/refresh/`
- `GET /api/auth/me/`

Quiz:
- `GET /api/quizzes/`
- `POST /api/quizzes/`
- `PUT /api/quizzes/{id}/`
- `DELETE /api/quizzes/{id}/`
- `POST /api/quizzes/{id}/publish/`
- `POST /api/quizzes/{id}/add-bank-questions/`
- `GET /api/sets/`

Exam / Results:
- `POST /api/exams/{quiz_id}/start/`
- `POST /api/exams/{quiz_id}/submit/`

Subjects:
- `GET /api/subjects/`
- `GET /api/subjects/{id}/quizzes/`
- `GET /api/topics/{id}/quizzes/`
- `GET /api/modules/{id}/quizzes/`

Game:
- `POST /api/rooms/create`
- `POST /api/rooms/join`
- `ws://<host>/ws/game/<CODE>/`

Health:
- `GET /api/health/`

## 6. Hozirda bor sahifalar
- Landing (`/`)
- Login / Register (`/login`, `/register`)
- Dashboard redirect (`/dashboard`)
- Student dashboard (`/student/dashboard`)
- Teacher dashboard (`/teacher/dashboard`)
- Field selection (`/field-selection`)
- Discover (`/discover`)
- Subjects (`/subjects`)
- Subject / Topic / Module detail (`/subjects/:id`, `/topics/:id`, `/modules/:id`)
- Quiz create (`/teacher/quiz/create`)
- My sets / admin panel (`/my-sets`, `/admin-panel`)
- Question bank (`/teacher/question-bank`)
- Bulk import (`/teacher/bulk-import`)
- AI generate (`/teacher/ai-generate`)
- Teacher analytics (`/teacher/analytics`)
- Subject analytics (`/teacher/analytics/subjects`)
- Results (`/results`)
- Set detail (`/sets/:id`)
- Game lobby (`/host`, `/join`, `/lobby`, `/room/:code`)
- Game play (`/play`, `/game/:id`)
- Admin users (`/admin/users`)
- Legal pages (`/privacy`, `/terms`, `/support`)

## 7. Kim nima qila oladi
- `admin`: foydalanuvchilarni boshqaradi, tizim bo'ylab nazorat qiladi.
- `teacher`: quiz yaratadi, publish qiladi, savollar bankidan foydalanadi, AI generate ishlatadi, host qiladi, analytics ko'radi.
- `student`: o'z fieldiga mos quizlarni ishlaydi, natijani ko'radi, live game'ga qo'shiladi.
- `guest`: to'liq akademik panel emas, lekin ayrim join oqimlarida ishlatilishi mumkin.

## 8. Qisman yoki keyingi bosqichdagilar
- Market / inventory / economy bloklari
- Qo'shimcha game mode'lar
- To'liq export/report pipeline
- To'liq email yoki OTP asosidagi password reset

## 9. Lokal ishga tushirish
Backend:
1. `cd backend`
2. `python manage.py migrate`
3. `python manage.py runserver`

Frontend:
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## 10. Qisqa eslatma
- `student` host qila olmaydi, lekin join, exam topshirish va natijani ko'rish ishlaydi.
- Quizlar studentga field, semester, section va publish holatiga qarab ko'rinadi.
- Agar quiz endpointlarda `500` chiqsa, migratsiyalarni tekshirish kerak.
