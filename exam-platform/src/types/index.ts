// ── Student ──
export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  parent_name?: string;
  image_url?: string;
  role: string;
}

// ── Course ──
export interface CourseInfo {
  id: string;
  name: string;
  group_name?: string;
  group_type?: 'GROUP' | 'INDIVIDUAL';
  teacher_name: string;
  progress_level?: 'basic' | 'intermediate' | 'advanced';
}

// ── Attendance ──
export interface AttendanceRecord {
  id: string;
  lesson_title?: string;
  date: string;
  status: 'PRESENT' | 'ABSENT';
}

export interface AttendanceStats {
  total_lessons: number;
  present_count: number;
  absent_count: number;
  attendance_percentage: number;
}

// ── Payment ──
export interface Payment {
  id: string;
  amount: number;
  month: string;
  status: 'PAID' | 'UNPAID' | 'PARTIAL';
  created_at: string;
}

// ── Exam ──
export type ExamStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Exam {
  id: string;
  title: string;
  description?: string;
  duration: number; // in minutes
  questions_count: number;
  status: ExamStatus;
  created_at?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'text';
  options: QuestionOption[];
  order?: number;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  deadline_at: string;
  submitted_at?: string;
  is_submitted: boolean;
}

export interface ExamResult {
  exam_title: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken?: string;
  submitted_at?: string;
  details: ExamResultDetail[];
}

export interface ExamResultDetail {
  question_text: string;
  student_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
}

// ── Student Stats ──
export interface StudentStats {
  total_exams: number;
  average_score: number;
  attendance_percentage: number;
  missed_lessons: number;
  total_payments: number;
  ai_status?: string;
}

// ── Notification ──
export interface Notification {
  id: string;
  student_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}
