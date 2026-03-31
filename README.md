# 🚀 IT School Ecosystem (CRM + LMS + AI + Marketing + HR)

Welcome to the ultimate **Startup-level full-stack education ecosystem**. This repository contains a fully micro-frontend architecture powered by a monolithic robust NestJS backend.

## 🌟 Modules & Features
Instead of a crowded monolithic interface, the system seamlessly decouples into specialized roles:
- **Admin/Manager CRM** (`crm/`): Control admissions, manage courses, users, and handle HR processing. Leads converting to Students happens securely here.
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
