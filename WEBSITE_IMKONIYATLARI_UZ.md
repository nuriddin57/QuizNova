# Blooket Loyihasi: Veb-sayt Imkoniyatlari (Uzbek)

## 1. Loyiha haqida
Ushbu veb-sayt Blooket uslubidagi ta'limiy quiz/o'yin platformasi bo'lib, o'qituvchi quiz yaratishi, jonli o'yin (live game) ochishi va o'quvchilar game code orqali qo'shilishi mumkin.

Frontend: React + Vite
Backend: Django + Django REST Framework + Channels (WebSocket)

## 2. Foydalanuvchi rollari
Sayt quyidagi rollar bilan ishlaydi:

- O'qituvchi (`teacher`)
- O'quvchi (`student`)
- Mehmon (`guest`, akkauntsiz qo'shilish)

### O'qituvchi nimalar qila oladi
- Tizimga kirish / ro'yxatdan o'tish
- Quiz (savollar to'plami) yaratish va tahrirlash
- Jonli o'yin sessiyasi (`session`) yaratish
- O'yinni boshlash / keyingi savolga o'tish / yakunlash

### O'quvchi nimalar qila oladi
- Akkaunt bilan kirish (ixtiyoriy)
- O'yin kod orqali sessiyaga qo'shilish
- Savollarga real vaqtda javob berish
- Reyting (leaderboard)ni ko'rish

### Mehmon nimalar qila oladi
- Akkauntsiz nickname bilan game code orqali o'yinga qo'shilish
- Savollarga javob berish

## 3. Autentifikatsiya (Auth)
Saytda JWT asosidagi autentifikatsiya ishlatiladi.

Mavjud endpointlar:
- `POST /api/auth/register/` - ro'yxatdan o'tish
- `POST /api/auth/login/` - tizimga kirish
- `POST /api/auth/password-reset/` - parolni yangilash (username/email + yangi parol)
- `POST /api/auth/token/refresh/` - token yangilash
- `GET /api/auth/me/` - joriy foydalanuvchi ma'lumoti

Frontend tokenlarni localStorage ichida saqlaydi va avtomatik refresh qilishga harakat qiladi.

### Forgot Password (MVP reset)
- Login sahifasidagi `Forgot password?` tugmasi ishlaydi
- Foydalanuvchi `username` yoki `email` va `new password` kiritib parolni yangilashi mumkin
- Bu hozircha lokal/MVP reset oqimi (email link/OTP emas)

## 4. Quiz (Savollar to'plami) funksiyalari
### Mavjud imkoniyatlar
- Quiz ro'yxatini olish
- Quiz detail ko'rish
- Quiz yaratish
- Quiz tahrirlash
- Savollar va variantlarni yuborish (multiple-choice format)

### Quiz tarkibi
- Quiz title
- Description
- Category (agar berilgan bo'lsa)
- Savollar ro'yxati
- Har bir savolda:
  - matn
  - timer
  - variantlar
  - to'g'ri javob flag (`is_correct`)

## 5. Jonli o'yin (Live Game) / Lobby funksiyalari
### O'qituvchi uchun
- Quiz tanlab `Create Lobby` qilish
- Rejim tanlash (`classic`, `factory-lite`)
- 7 xonali game code generatsiya qilish
- Lobby ichidagi o'yinchilarni real vaqtda ko'rish
- `Start Game` tugmasi bilan o'yinni boshlash
- Join code bilan birga to'liq join havolasini (`/room/<CODE>`) nusxalash

### O'quvchi / mehmon uchun
- Game code kiritib qo'shilish (`Join by Code`)
- To'liq join linkni inputga qo'yib qo'shilish (kod avtomatik ajratib olinadi)
- Nickname bilan sessiyaga kirish
- Lobby holatini ko'rish
- So'nggi ishlatilgan kodlarni tez tanlash (`localStorage` orqali recent codes)

### Backend join endpointlari
- `POST /api/sessions/{id}/join/`
- `POST /api/sessions/join-by-code/`

## 6. Real-time (WebSocket) gameplay imkoniyatlari
WebSocket orqali lobby va o'yin holati yangilanadi.

### WebSocket manzili
- `ws://127.0.0.1:8001/ws/game/<CODE>/`
  (yoki production hostga mos ravishda)

### Qo'llab-quvvatlanadigan action lar
- `state` - joriy holatni olish
- `start` - o'yinni boshlash
- `next` - keyingi savolga o'tish
- `answer` - javob yuborish
- `end` - o'yinni yakunlash va natijalarni finalize qilish

### WebSocket event lar (server -> client)
- `players` - o'yinchilar ro'yxati va score
- `question` - joriy savol va phase (`lobby`, `question`, `finished`)
- `answer_ack` - yuborilgan javob bo'yicha tasdiq (`correct/incorrect`)
- `leaderboard_update` - final leaderboard

## 7. Scoring va natijalar
### Live score (o'yin davomida)
- To'g'ri javoblar asosida soddalashtirilgan live score yangilanadi

### Final natija (o'yin tugaganda)
- Backend `Attempt` va `AttemptAnswer` yozuvlarini yaratadi
- Ballar `time_taken` va to'g'rilik asosida hisoblanadi
- Leaderboard qayta hisoblanadi va yuboriladi

## 8. Statistikalar (Student Stats)
Mavjud endpoint:
- `GET /api/stats/me/`

Qaytarilishi mumkin bo'lgan ma'lumotlar:
- total attempts
- average score
- highest score
- accuracy
- question-level performance

## 9. UI / Frontend qo'shimcha imkoniyatlar
### i18n (til almashtirish)
Saytda 3 til qo'llab-quvvatlanadi:
- Uzbek (`uz`)
- Russian (`ru`)
- English (`en`)

### Til aniqlash tartibi
1. `localStorage['lang']`
2. brauzer tili (`uz/ru/en`)
3. fallback: `en`

### Theme (mavzu) almashtirish
- Light (default)
- Dark

### Theme aniqlash tartibi
1. `localStorage['theme']`
2. tizim (`prefers-color-scheme`)
3. fallback: `light`

### Combined control
Navbar o'ng yuqori qismida quyidagilar mavjud:
- Til dropdown (`UZ / RU / EN`)
- Theme toggle (light/dark)
- API holati indikatori (`API online/offline`)

### i18n holati (amaliy)
- Login/Register/Lobby/Gameplay sahifalarida tarjima ancha to'liq ishlaydi
- Navbar, modal, asosiy button/label/title matnlar tarjimaga ulangan
- Katta sahifalardagi ayrim `dummyData` kontent matnlari hali hardcoded bo'lishi mumkin

## 10. Hozirda ishlaydigan asosiy sahifalar
- Landing
- Login
- Register
- Dashboard (qisman demo/dummy data bilan)
- Discover (qisman API + fallback data)
- Game Lobby (REST + WebSocket ulangan)
- Game Play (WebSocket ulangan)

## 10.1. Brend va logo assetlari
Loyihaga original `QuizNova` mascot-logo (SVG) assetlari qo'shilgan:
- icon-only
- horizontal logo
- stacked logo
- dark variant
- bir nechta expression variantlar

Joylashuvi:
- `frontend/src/assets/brand/quiznova/`

## 11. Hali to'liq yakunlanmagan qismlar (roadmap)
Quyidagi funksiyalar to'liq ishlab chiqilmagan yoki qisman demo ko'rinishida:

- Market (pack opening, drop rates)
- Inventory (blook collection)
- Tokens / XP economy (daily cap logic)
- QR code join
- Teacher reports export CSV
- To'liq 2+ game mode mechanics
- Barcha sahifalarni to'liq i18n ga o'tkazish (ayniqsa dummyData kontentlarini locale keylarga ko'chirish)
- Email link/OTP asosidagi xavfsiz password reset oqimi

## 12. Lokal ishga tushirish (Windows)
### Backend
1. `cd backend`
2. `.\\venv\\Scripts\\pip.exe install -r requirements.txt`
3. `.\\venv\\Scripts\\python.exe manage.py migrate`
4. `.\\venv\\Scripts\\python.exe manage.py runserver 8001`

### Frontend
1. `cd frontend`
2. `cmd /c npm install`
3. `cmd /c npm run dev`

## 13. Qisqa xulosa
Hozirgi holatda loyiha MVP darajasida quyidagilarni amalda bajara oladi:
- Auth (teacher/student)
- Quiz CRUD (asosiy)
- Live lobby yaratish
- Game code bilan join (guest ham)
- Game code yoki to'liq join link orqali join qilish
- Real-time savol yuborish va javob olish
- Leaderboard / finalize logikasi
- Join code/join linkni nusxalash va recent codes bilan tez qayta qo'shilish
- i18n (uz/ru/en) + dark/light theme toggle
- Forgot password (MVP password reset)
- API online/offline health status ko'rsatish

Keyingi bosqichda platformani to'liq Blooket-like v1 darajaga olib chiqish uchun economy, market, inventory, reports va qo'shimcha game mode larni qo'shish mumkin.
