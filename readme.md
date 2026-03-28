# IT School CRM PRO

A comprehensive, production-ready educational CRM built with NestJS. This scalable architecture supports Student Management, Group/Course logic, Payments Tracking, Attendance Logging, automated AI Exam Generation, and Teacher Analytical Dashboards.

## Features & Modules 🚀
1. **Users & Auth**: JWT Authentication. Role-based guards (`ADMIN`, `MANAGER`, `TEACHER`). Profile updates with Cloudinary Avatar multipart uploads.
2. **Courses & Groups**: Highly constrained 1-course-per-group architecture with mapping tables. Students can be grouped or individual.
3. **Students**: Registration, CRUD options, and Soft-Deletes.
4. **Attendance**: Track Present/Absent statuses by `lesson_id` per student.
5. **Payments**: Financial billing mapped safely against `group_id` / `student_id`.
6. **Lessons**: Course itinerary structures.
7. **Exams & Questions**: 
   - Interactive question banks mapped via `exam_questions` bridging table.
   - **AI Integration**: Automatically constructs highly relevant JSON question architectures leveraging GPT-4o-mini inside `POST /exams/:id/ai-generate`.
8. **Analytics Insight**:
   - Unique student breakdowns spanning Payments, Lessons Missed, and Exam results.
   - Embedded contextual AI feedback (humor/punishment responses) for significantly misbehaving/absent students.

---

## Database Schema (ERD Logic) 🧠

The Postgres Database is structured to mimic real-world academy requirements securely using constraint indexes and soft deletes (`deleted_at`).

### Core Tables
- `users`: (id, first_name, last_name, avatar_url, email, password, role)
- `courses`: (id, name, price)
- `groups`: (id, name, course_id, teacher_id)
- `students`: (id, first_name, last_name, phone)
- `lessons`: (id, course_id, title)
- `questions`: (id, lesson_id, text, difficulty)
- `exams`: (id, course_id, title, teacher_id)

### Pivot & Action Tables
- `student_courses`: Maps individuals independently to courses.
- `group_students`: Organizes mapped students directly into sub-groups. (Constraint: 1 Group per Course per Student).
- `attendance`: (id, group_id, student_id, lesson_id, status)
- `payments`: (id, student_id, group_id, amount)
- `exam_questions`: Bridges questions directly into exam testing formats.
- `exam_results`: Grade output logs per student per exam.

## Getting Started 🔥

1. **Install Dependencies**
   ```bash
   npm install
   ```
2. **Setup Secrets**
   Copy `.env.example` into `.env` and configure OpenAI API, Cloudinary keys, DB settings and JWT hashes.
3. **Database Spin-Up**
   Ensure Postgres exists, and trigger `database/init.sql` for structure scaling and `database/seed.sql` for test fixtures.
   If using Docker:
   ```bash
   docker-compose up -d
   ```
4. **Launch Application**
   ```bash
   npm run start:dev
   ```

Swagger documentation will be available at: **http://localhost:3000/api/v1/docs**
