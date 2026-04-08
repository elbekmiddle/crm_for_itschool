# Productionga chiqarish (CRM + exam-platform)

## Backend (Nest)

1. **Muhit**
   - `NODE_ENV=production`
   - `JWT_SECRET`, `JWT_REFRESH_SECRET` — kuchli, tasodifiy qiymatlar (dev’dagi default’lar ishlatilmaydi).
   - `ALLOWED_ORIGINS` — faqat haqiqiy frontend domen(lar)i (vergul bilan), `credentials` uchun aniq origin kerak.

2. **Ma’lumotlar bazasi**
   - Yangi serverda bir marta: `cd backend && npm run db:migrate`
   - `DB_*` o‘zgaruvchilari production PostgreSQL’ga yo‘naltirilgan bo‘lsin.

3. **Ishga tushirish**
   - `npm run build` keyin `npm run start:prod` (yoki PM2/systemd orqali `node dist/main`).
   - Port: `PORT` (masalan, 5001) va reverse proxy (nginx) HTTPS.

4. **Swagger**
   - Productionda odatda **o‘chiq** (`NODE_ENV=production`). Kerak bo‘lsa staging yoki vaqtinchalik: `ENABLE_SWAGGER=true`.

5. **Sog‘liq tekshiruvi**
   - `GET /api/v1/health` — load balancer / monitoring uchun (throttle qo‘llanmaydi).

6. **Redis**
   - Kod va rate limit uchun tavsiya etiladi. Yo‘q bo‘lsa ayrim joylar in-memory fallback ishlatishi mumkin; hajmni hisobga oling.

7. **Telegram**
   - Bir token bilan faqat **bitta** jarayon `getUpdates` polling qilishi kerak. Ikkinchi instansiya 409 beradi. Kerak bo‘lmasa: `TELEGRAM_RECEPTION_POLLING=false`.

8. **Xavfsizlik (allaqachon koddagi asoslar)**
   - Helmet, compression, validation pipe, CORS, cookie-parser — `main.ts` ichida.

## Frontend (Vite CRM)

1. `.env.production` yoki build vaqtida: `VITE_API_URL=https://api.sizning-domen.uz/api/v1` (loyihadagi aniq o‘zgaruvchi nomiga moslang).
2. `npm run build` — chiqish `dist/`; statik fayllarni CDN yoki nginx orqali xizmat qiling.

## Exam-platform (agar alohida deploy bo‘lsa)

1. O‘z `VITE_*` / API base URL’ini productionga moslang.
2. `npm run build` va statik hosting.

## Tekshiruv ro‘yxati (qisqa)

- [ ] `NODE_ENV=production`, JWT va DB parollari almashtirilgan
- [ ] `ALLOWED_ORIGINS` to‘g‘ri
- [ ] `db:migrate` bajarilgan
- [ ] Frontend build API URL production
- [ ] HTTPS + proxy
- [ ] Telegram: bitta poller yoki polling o‘chirilgan
- [ ] `/api/v1/health` monitoringda
