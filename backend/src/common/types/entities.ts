// --- Core Entities ---

export interface User {
  id: string;
  phone: string;
  first_name: string;
  last_name?: string;
  role: 'ADMIN' | 'MANAGER' | 'TEACHER' | 'STUDENT';
  branch_id?: string;
  telegram_chat_id?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Student extends User {
  parent_name?: string;
  is_verified: boolean;
  status: 'active' | 'suspended' | 'graduated';
}

export interface Lead {
  id: string;
  first_name: string;
  last_name?: string;
  phone: string;
  parent_name?: string;
  course_id?: string;
  source: 'site' | 'telegram' | 'manual';
  status: 'new' | 'called' | 'converted' | 'rejected';
  created_at: Date;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_months: number;
  created_at: Date;
}

export interface Group {
  id: string;
  name: string;
  course_id: string;
  teacher_id: string;
  days: string[]; // ['mon', 'wed', 'fri']
  start_time: string;
  created_at: Date;
}

export interface Attendance {
  id: string;
  student_id: string;
  group_id: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent';
  created_at: Date;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  month: string; // YYYY-MM
  paid_at: Date;
  created_at: Date;
}

// --- Exam Entities ---

export interface Exam {
  id: string;
  title: string;
  course_id: string;
  teacher_id: string;
  time_limit: number; // minutes
  status: 'pending' | 'published';
  created_at: Date;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: any;
  level: 'easy' | 'medium' | 'hard';
  type: 'multiple_choice' | 'boolean' | 'text';
  status: 'draft' | 'approved';
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  score?: number;
  status: 'in_progress' | 'submitted' | 'timed_out';
  deadline_at: Date;
  started_at: Date;
  finished_at?: Date;
}

// --- Content Entities ---

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  author_id: string;
  status: 'draft' | 'published';
  created_at: Date;
}

export interface Vacancy {
  id: string;
  title: string;
  description: string;
  salary?: string;
  status: 'open' | 'closed';
  created_at: Date;
}
