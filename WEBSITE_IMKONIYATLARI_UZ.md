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
- `parent`: bog'langan talabalar natijalari va weekly challenge holatini ko'radi.
- `guest`: ayrim live o'yinlarda nickname bilan qo'shilish ssenariysi mavjud.

## 3. Asosiy imkoniyatlar
- Ro'yxatdan o'tish, login, token refresh va profilni olish.
- University login callback va student uchun field selection oqimi.
- Role-based dashboard: teacher, student va admin uchun alohida yo'nalishlar.
- Parent uchun alohida dashboard va info sahifasi mavjud.
- Quiz yaratish, tahrirlash, o'chirish, publish/unpublish qilish.
- Quizlarni qidirish, filterlash va saralash.
- Quizni subject, topic, module, semester, section va field bo'yicha biriktirish.
- Public/private visibility va `mine=true` ko'rinishida shaxsiy quizlarni ajratish.
- Quizga savollarni qo'lda qo'shish yoki question bank'dan biriktirish.
- Question bank yaratish, qayta ishlatish va bulk import qilish.
- AI yordamida savollar generatsiya qilish, alohida savolni regenerate qilish va quizga/bankka saqlash.
- Student uchun exam start/submit oqimi.
- Natijani ball, foiz, to'g'ri/noto'g'ri javob va pass/fail holati bilan hisoblash.
- Student result history va subject performance sahifalari.
- Teacher analytics va quiz-wise performance ko'rish.
- Parent linked students natijalari va weekly challenge kartalari.
- Landing va parent dashboard orqali weekly challenge va testimonial bloklari.
- Live lobby yaratish, room code/link orqali qo'shilish.
- WebSocket orqali real-time savol yuborish, javob olish va live leaderboard.
- Discover, subjects, topics, modules va set detail sahifalari.
- Ko'p til: `uz`, `ru`, `en` va sahifa title'lari ham lokalizatsiya qilingan.
- Theme: `light` / `dark`.
- Navbar ichida API health holatini ko'rsatish.

## 4. Batafsil funksional bloklar

### 4.1 Auth va account
- Email yoki ayrim student login formatlari bilan tizimga kirish.
- `register`, `login`, `refresh token`, `me` endpointlari mavjud.
- Student, teacher, parent va admin route'lari himoyalangan.
- Admin uchun alohida users sahifasi bor.
- Student email domeni va teacher email domeni bo'yicha rolga mos kirish tekshiruvi mavjud.

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
- Generatsiya qilingan savollar backend tomonda tozalanadi, duplicate va yaqin duplicate savollar rad qilinadi.
- Savol matni tugallanmagan yoki sifatsiz bo'lsa qayta generatsiya qilinadi.
- Variantlar server tomonda shuffle qilinadi va correct answer mapping saqlanadi.
- Har bir savol preview kartasida alohida `Regenerate Question` tugmasi mavjud.
- `10` ta savol generatsiya qilinganda qat'iy format ishlaydi:
  - `5 ta A/B/C` savol
  - `5 ta True/False` savol
- Generatsiya qilingan savollarni bevosita quiz banki, tanlangan quiz yoki yangi quiz sifatida saqlash mumkin.
- Bu qo'lda savol tayyorlash vaqtini qisqartiradi va teacher review jarayonini tezlashtiradi.

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
- Parent linked studentlar bo'yicha recent results va progress ko'ra oladi.

### 4.8 Akademik katalog
- Subjects ro'yxati.
- Har bir subject ichida related quizzes.
- Topic detail va module detail sahifalari.
- Set detail va discover orqali tayyor kontentni ko'rish.

### 4.9 Marketing va weekly challenge
- Landing sahifasida weekly challenge spotlight, testimonials va audience benefits bloklari mavjud.
- Parent info sahifasi ota-onalar uchun platforma foydasini tushuntiradi.
- Parent dashboard ichida weekly challenge deadline va recent results kartalari bor.
- Weekly challenge detail sahifasi public ochilishi mumkin.

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

AI:
- `POST /api/ai/questions/generate/`
- `POST /api/ai/questions/regenerate/`
- `POST /api/ai/questions/analyze/`
- `POST /api/ai/questions/bulk-add/`
- `POST /api/ai/questions/save-to-bank/`

Marketing:
- `GET /api/marketing/testimonials/`
- `GET /api/marketing/weekly-challenge/current/`
- `GET /api/marketing/weekly-challenge/{code}/`

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
- Parent dashboard (`/parent/dashboard`)
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
- Parent info (`/parents`)
- Weekly challenge detail (`/challenges/:code`)
- Game lobby (`/host`, `/join`, `/lobby`, `/room/:code`)
- Game play (`/play`, `/game/:id`)
- Admin users (`/admin/users`)
- Legal pages (`/privacy`, `/terms`, `/support`)

## 7. Kim nima qila oladi
- `admin`: foydalanuvchilarni boshqaradi, tizim bo'ylab nazorat qiladi.
- `teacher`: quiz yaratadi, publish qiladi, savollar bankidan foydalanadi, AI generate ishlatadi, host qiladi, analytics ko'radi.
- `parent`: bog'langan studentlar progressi, recent results va weekly challenge ma'lumotlarini ko'radi.
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
- AI generator 10 ta savolda 5 ta `A/B/C` va 5 ta `True/False` savol qaytaradigan qilib sozlangan.
- AI generatsiyada sifatsiz yoki juda o'xshash savollar backend darajasida filtrlanadi.
- Preview ichida bitta savolni alohida regenerate qilish mumkin.
- Agar quiz endpointlarda `500` chiqsa, migratsiyalarni tekshirish kerak.
