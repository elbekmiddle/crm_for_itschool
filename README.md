# IT School CRM & LMS (Production-Grade)

Ushbu platforma zamonaviy ta'lim markazlari uchun mo'ljallangan bo'lib, quyidagi interfeyslardan tashkil topgan:

## 🚀 Tizim arxitekturasi
- **Backend (NestJS)**: Clean Architecture asosida qurilgan.
- **Frontend (Vite + React)**: Unified portal (Admin/Teacher/Student).
- **Notification (Telegram)**: Interactive callbacks orqali CRM integratsiyasi.

## ✨ Muhim hususiyatlar
- **Unified API Response**: Barcha javoblar `{success, data, message}` formatida.
- **Global Error Handling**: Tizimdagi barcha xatoliklar bir xil formatda qaytadi.
- **AI Exam Engine**: Savollarni avtomatik yaratish va o'qituvchi tomonidan tasdiqlash flow'si.
- **Anti-Cheat System**: 
  - `Visibility Detection`: Oyna almashishni aniqlash.
  - `Multi-tab Protection`: Bir vaqtda bir nechta tabda kirishni taqiqlash.
  - `Auto-submit`: Qoidabuzarliklar soni oshib ketganda avtomatik yakunlash.
- **Interactive CRM**: Telegram orqali Leadlarni bir tugma bilan Studentga aylantirish.

## 🛠 Texnologiyalar
- **Backend**: NestJS, PostgreSQL, Redis (BullMQ), Telegram Bot API.
- **Frontend**: React, Framer Motion, TailwindCSS, Lucia Auth.

- **Student Exam Platform** (`students/`): Students take AI-generated exams, view their real-time score, check attendance, and explore courses. (Also known as students.itschool.uz)
- **Marketing Site** (`itschool/`): High conversion Landing page to capture hot leads, complete with vacancy postings and CRM Webhooks.
- **IT Blog** (`blog/`): Dedicated blog site for SEO.
- **Telegram Reception Bot**: Advanced Grammy-powered user boarding tool (`/start` creates Conversational Flows exactly synced dynamically with our CRM Vacancies and Courses tables).

## 🏗️ Architecture Stack
- **Backend:** NestJS, TypeScript, TypeORM, PostgreSQL, Class-Validator, Socket.IO, Grammy.
- **Frontend(s):** React, Vite, TailwindCSS, React Query, Zustand, Lucide-React.

## ⚙️ Quick Start
We made it extremely simple! No need to open 5 terminals manually:
1. Make sure your PostgreSQL server is up and `.env` files are configured.
2. In the root directory, simply run:
```bash
start_all.bat
```
This batch script will dynamically open parallel windows for your Backend (port 5000) and all 4 Frontends (port 3000, 3001, 3002, 3003).

## 🗄️ Database
Includes `leads`, `students`, `courses`, `attendance`, `payments`, `exams`, `vacancies`, `applications`.
Ensure to execute the initial SQL migrations via your preferred DB management tool.

## 🤝 Contributions
Built specifically to revolutionize how IT Centers automate their routine paperwork and student evaluations using real-time anti-cheat systems and seamless lead conversion pathways.
