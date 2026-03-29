# Exam + Front uchun to‘liq texnik reja (audit natijasi)

Quyidagi ro‘yxat siz so‘raganidek **backend mantiqi + front uchun kerakli page/component/modal**larni to‘liq qamrab oladi.

---

## 1) Hozirgi holat (qisqa audit)

### Backendda bor narsalar
- `exams` modulida quyidagi oqimlar mavjud:
  - exam yaratish
  - examga savol biriktirish
  - AI orqali savol generatsiya qilish (queue orqali)
  - examni grade qilish
  - course bo‘yicha exam listi
  - exam resultlarini olish
- `questions` modulida lesson bo‘yicha savollarni olish va savol yaratish mavjud.

### Hozirgi katta bo‘shliqlar
- `startExam` va `submitExam` servisda yozilgan, lekin controller route sifatida expose qilinmagan.
- Talaba uchun “exam session” API to‘liq emas (attempt boshqaruvi, auto-submit, answer saqlash).
- Frontendlarda (ikkala appda ham) real product page/component arxitekturasi deyarli yo‘q.

---

## 2) Backend uchun to‘liq checklist (Exam logikasi)

## 2.1 Kerakli ma’lumotlar modellari

Minimum schema (amaliy ishlash uchun):

1. `exams`
- `id`
- `course_id`
- `title`
- `created_by`
- `time_limit` (minute)
- `exam_date` (optional)
- `status` (`draft`, `published`, `archived`)
- `created_at`, `updated_at`, `deleted_at`

2. `questions`
- `id`
- `lesson_id`
- `text`
- `level` (`easy|medium|hard`)
- `type` (`single_choice`, `multiple_choice`, `short_text`, `code`)
- `options` (jsonb, choice turlar uchun)
- `correct_answer` (jsonb)
- `explanation` (optional)
- `created_by`
- `created_at`, `updated_at`, `deleted_at`

3. `exam_questions`
- `exam_id`
- `question_id`
- `order_no`
- `points`

4. `exam_attempts` (tavsiya: `exam_results`dan alohida)
- `id`
- `exam_id`
- `student_id`
- `started_at`
- `deadline_at`
- `finished_at`
- `status` (`in_progress`, `submitted`, `timeout`, `cancelled`)
- `score`
- `duration`
- `feedback`

5. `attempt_answers`
- `id`
- `attempt_id`
- `question_id`
- `answer_payload` (jsonb)
- `is_correct`
- `earned_points`
- `answered_at`

6. `exam_access_rules` (optional, lekin productionda kerak)
- `exam_id`
- `allowed_group_ids` / `allowed_student_ids`
- `max_attempts`
- `shuffle_questions`
- `shuffle_options`

> Eslatma: hozirgi kodda `exam_results` ishlatilgan; ammo session + answer tracking uchun `exam_attempts` + `attempt_answers` ancha toza bo‘ladi.

## 2.2 API endpointlar (to‘liq)

### Teacher/Admin panel endpointlari
- `POST /exams` — exam create
- `PATCH /exams/:id` — title/time_limit/status update
- `POST /exams/:id/questions` — savollar biriktirish
- `DELETE /exams/:id/questions/:questionId` — savolni examdan yechish
- `POST /exams/:id/ai-generate` — AI savol ishlab chiqish
- `GET /exams/course/:courseId` — course examlari
- `GET /exams/:id` — exam detail + questions
- `POST /exams/:id/publish` — talabalar uchun ochish
- `POST /exams/:id/archive` — yopish/arxivlash
- `POST /exams/:id/grade` — manual grade (agar kerak bo‘lsa)
- `GET /exams/:id/results` — natijalar
- `GET /exams/:id/results/export` — excel/csv export

### Student app endpointlari
- `GET /student/exams` — studentga tegishli examlar
- `GET /student/exams/:id` — exam metadata
- `POST /student/exams/:id/start` — attempt/session ochish
- `POST /student/exams/:id/answer` — bitta javobni saqlash (autosave)
- `POST /student/exams/:id/submit` — yakuniy topshirish
- `GET /student/exams/:id/attempt` — current attempt holati (resume)
- `GET /student/exams/:id/result` — o‘z natijasi

## 2.3 Biznes qoidalar (backend logika)

1. **Ruxsatlar**
- faqat `ADMIN/MANAGER/TEACHER` exam yaratadi.
- student faqat o‘ziga biriktirilgan examni ochadi.

2. **Status lifecycle**
- `draft -> published -> archived`.
- `draft` paytda student start qila olmaydi.

3. **Attempt boshqaruvi**
- `max_attempts` tekshiriladi.
- bitta aktiv attempt bo‘lsa resume qilinadi.
- `deadline_at` o‘tgan bo‘lsa auto-timeout + auto-submit.

4. **Scoring**
- objective questionlar auto-grade.
- subjective questionlar `pending_review` bo‘lib teacher review kutadi.
- final score = objective + manual-review yig‘indisi.

5. **Integrity**
- exam publish bo‘lgandan keyin question set immutable (yoki versioning bilan).
- submissiondan keyin answer o‘zgarmaydi.

6. **Audit**
- start/submit/timeout eventlari loglanadi.

## 2.4 Validatsiya va xavfsizlik

- DTO validation (class-validator) hamma inputda.
- SQL injectiondan himoya (`$1` parametrlar bilan hozirgi uslub to‘g‘ri).
- rate limit start/submit endpointlarga.
- anti-cheat (minimum):
  - har 20-30 sekund heartbeat endpoint
  - optional browser focus-loss event log
- responseda correct_answer student submitdan oldin qaytmasin.

## 2.5 Performance

- indekslar:
  - `exam_questions(exam_id)`
  - `exam_attempts(exam_id, student_id)`
  - `attempt_answers(attempt_id, question_id)`
- result listlar uchun pagination.
- AI generate joblar queue’da qolishi to‘g‘ri (hozirgi arxitektura yaxshi).

---

## 3) Frontend (Admin/Teacher CRM) uchun to‘liq ro‘yxat

## 3.1 Kerakli pagelar

1. `ExamListPage`
- filter: course, status, date
- table/card list
- create exam CTA

2. `ExamCreatePage`
- title, course, time_limit
- save as draft / publish

3. `ExamBuilderPage` (eng muhim)
- savollar bankidan tanlash
- drag-drop order
- points berish
- AI generate panel

4. `ExamDetailsPage`
- metadata, question preview, active status
- publish/archive amallari

5. `ExamResultsPage`
- studentlar kesimida score
- sort/filter/search
- export

6. `ExamReviewPage` (subjective bo‘lsa)
- answer viewer
- manual grade + feedback

## 3.2 Kerakli componentlar

- `ExamTable`
- `ExamStatusBadge`
- `ExamForm`
- `QuestionBankList`
- `QuestionCard`
- `SelectedQuestionsPanel`
- `AiGenerateForm`
- `TimerInput`
- `ScoreDistributionChart`
- `ResultTable`
- `StudentResultDrawer`
- `ConfirmActionDialog`
- `EmptyState`, `ErrorState`, `LoadingState`

## 3.3 Kerakli modallar

- `CreateExamModal`
- `PublishExamModal`
- `ArchiveExamModal`
- `AddQuestionModal`
- `AiGenerateQuestionsModal`
- `ManualGradeModal`
- `DeleteQuestionConfirmModal`

## 3.4 Front state arxitekturasi

- Server state: React Query (`useQuery`, `useMutation`)
- UI state: Zustand yoki local reducer
- Query keylar:
  - `['exams', courseId, filters]`
  - `['exam', examId]`
  - `['exam-results', examId]`
  - `['question-bank', lessonId]`

## 3.5 UX talablar

- long actionlarda optimistic UI + toast.
- autosave indicator (builderda).
- destructive actionlar uchun 2-step confirm.
- loading skeletonlar.

---

## 4) Frontend (Student Exam App) uchun to‘liq ro‘yxat

## 4.1 Kerakli pagelar

1. `StudentExamListPage`
- available / completed / missed tablar

2. `StudentExamIntroPage`
- exam qoidalari, time limit, attempt info
- “Start exam” tugmasi

3. `StudentExamTakePage`
- timer
- question navigator
- answer panel
- autosave holati

4. `StudentExamSubmitPage`
- final confirm
- unanswered count warning

5. `StudentExamResultPage`
- score, feedback, question breakdown

## 4.2 Kerakli componentlar

- `ExamTimer`
- `QuestionNavigator`
- `SingleChoiceQuestion`
- `MultipleChoiceQuestion`
- `ShortTextQuestion`
- `CodeQuestionEditor` (kerak bo‘lsa)
- `AutosaveBadge`
- `ConnectionStatusBadge`
- `SubmitFooterBar`

## 4.3 Kerakli modallar

- `StartExamConfirmModal`
- `SubmitExamConfirmModal`
- `TimeUpAutoSubmitModal`
- `ResumeAttemptModal`
- `NetworkReconnectModal`

## 4.4 Student flow (aniq ketma-ketlik)

1. Student `ExamList`ga kiradi.
2. `ExamIntro`da qoidalarni ko‘radi.
3. `Start` bosilganda backend `attempt` yaratadi.
4. Har javob `answer` endpointga autosave qilinadi.
5. Timer tugasa auto-submit.
6. Student `ResultPage`da yakuniy natijani ko‘radi.

---

## 5) Integratsiya contract (Front ↔ Backend)

Har endpoint uchun quyidagi contract aniq bo‘lishi kerak:
- request dto
- response dto
- error kodlar (`400`, `401`, `403`, `404`, `409`, `422`)
- `409` holatlari:
  - already submitted
  - time exceeded
  - exam not published

Tavsiya:
- Swagger schema’larni frontend type generationga ulash (`openapi-typescript`).

---

## 6) Sizga amaliy “next step” plan

1. **1-hafta (Backend core)**
- `start/answer/submit` route’larni controllerga chiqarish.
- `attempt_answers` modelini qo‘shish.
- autosave endpoint.

2. **2-hafta (Teacher panel)**
- ExamList, ExamCreate, ExamBuilder page.
- Create/publish/add-questions/AI generate integration.

3. **3-hafta (Student app)**
- ExamList, Intro, Take, Submit, Result page.
- timer + autosave + resume.

4. **4-hafta (hardening)**
- manual grading, export, analytics, testlar.

---

## 7) Minimum test checklist

Backend:
- unit: scoring qoidalari
- unit: attempt lifecycle
- integration: start->answer->submit flow
- e2e: role-based access

Frontend:
- component test: timer, navigator
- integration test: submit flow
- smoke test: exam builder

---

## 8) Qisqa xulosa

Sizning loyiha backendida examning asosiy poydevori bor, lekin **student attempt lifecycle va front arxitekturasi hali to‘liq emas**. Yuqoridagi ro‘yxat bo‘yicha qilsangiz, exam uchun production darajadagi to‘liq frontend+backend modulga chiqasiz.
