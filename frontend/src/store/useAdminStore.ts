import { create } from 'zustand';
import api from '../lib/api';
import { disconnectRealtimeSocket, reconnectRealtimeSocket } from '../lib/realtimeSocket';

interface AdminState {
  user: any | null;
  isInitialized: boolean;
  stats: any | null;
  isLoading: boolean;
  error: string | null;
  
  students: any[];
  courses: any[];
  groups: any[];
  exams: any[];
  examResults: any[];
  users: any[];
  payments: any[];
  debtors: any[];
  lessons: any[];
  questions: any[];
  questionStats: any | null;
  attendance: any[];
  leads: any[];
  
  // Actions
  setUser: (user: any) => void;
  fetchStats: () => Promise<void>;
  
  // Students
  fetchStudents: (page?: number, limit?: number, compact?: boolean) => Promise<void>;
  createStudent: (data: any) => Promise<void>;
  updateStudent: (id: string, data: any) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  enrollStudent: (studentId: string, courseId: string) => Promise<void>;
  
  // Leads
  fetchLeads: () => Promise<void>;
  convertLead: (id: string, data: { branch_id?: string, group_id?: string }) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  
  // Courses
  fetchCourses: () => Promise<void>;
  createCourse: (data: any) => Promise<void>;
  updateCourse: (id: string, data: any) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  
  // Groups
  fetchGroups: () => Promise<void>;
  createGroup: (data: any) => Promise<void>;
  updateGroup: (id: string, data: any) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  addStudentToGroup: (groupId: string, studentId: string) => Promise<void>;
  removeStudentFromGroup: (groupId: string, studentId: string) => Promise<void>;
  fetchGroupStudents: (groupId: string) => Promise<any[]>;
  
  // Exams
  fetchExams: (courseId?: string) => Promise<void>;
  createExam: (data: any) => Promise<void>;
  updateExam: (id: string, data: any) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  publishExam: (id: string) => Promise<void>;
  addQuestionsToExam: (examId: string, questionIds: string[]) => Promise<void>;
  removeQuestionFromExam: (examId: string, questionId: string) => Promise<void>;
  generateAiExam: (examId: string, options: any) => Promise<void>;
  addManualExamQuestion: (
    examId: string,
    payload: { text: string; options: string[]; correctIndex: number; level?: string },
  ) => Promise<void>;
  fetchExamForManage: (examId: string) => Promise<any>;
  updateExamQuestion: (examId: string, questionId: string, body: Record<string, unknown>) => Promise<void>;
  approveExamQuestion: (examId: string, questionId: string) => Promise<void>;
  approveAllExamQuestions: (examId: string) => Promise<void>;
  fetchExamResults: (examId: string) => Promise<void>;
  
  // Users
  fetchUsers: () => Promise<void>;
  createUser: (data: any) => Promise<void>;
  updateUser: (id: string, data: any) => Promise<void>;
  uploadUserPhoto: (id: string, file: File) => Promise<string>;
  deleteUser: (id: string) => Promise<void>;
  
  // Payments
  fetchPayments: () => Promise<void>;
  createPayment: (data: any) => Promise<void>;
  updatePayment: (id: string, data: Partial<{ amount: number; paid_at: string; description: string | null }>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  getStudentPayments: (studentId: string) => Promise<any>;
  
  // Attendance
  fetchAttendance: (groupId: string) => Promise<void>;
  /** Guruhga kirmagan talaba (group_id null yozuvlar) */
  fetchIndividualAttendance: (studentId: string) => Promise<void>;
  markAttendance: (data: any) => Promise<void>;
  updateAttendance: (id: string, status: string) => Promise<void>;
  
  // Lessons & Questions
  fetchLessons: (courseId: string) => Promise<void>;
  createLesson: (data: any) => Promise<void>;
  fetchQuestions: (lessonId: string) => Promise<void>;
  createQuestion: (data: any) => Promise<void>;
  fetchQuestionStats: () => Promise<void>;
  
  // Analytics
  fetchTeacherDashboard: () => Promise<any>;
  fetchMe: () => Promise<void>;
  
  logout: () => void;
}

const CRM_USER_KEY = 'crm_user';
const LEGACY_USER_KEY = 'user';

function readCrmUserFromStorage(): any | null {
  const raw = localStorage.getItem(CRM_USER_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  const leg = localStorage.getItem(LEGACY_USER_KEY);
  if (!leg) return null;
  try {
    const p = JSON.parse(leg);
    const staff = ['TEACHER', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OWNER', 'ACCOUNTANT'];
    if (p?.role && staff.includes(String(p.role))) {
      localStorage.setItem(CRM_USER_KEY, leg);
      return p;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function persistCrmUser(user: any | null) {
  if (user) {
    const s = JSON.stringify(user);
    localStorage.setItem(CRM_USER_KEY, s);
    const staff = ['TEACHER', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OWNER', 'ACCOUNTANT'];
    if (user.role && staff.includes(String(user.role))) {
      localStorage.removeItem(LEGACY_USER_KEY);
    }
  } else {
    localStorage.removeItem(CRM_USER_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    localStorage.removeItem('access_token');
  }
}

/** API xatolikda ham KPI kartochkalari ishlashi uchun minimal stats */
const FALLBACK_DASHBOARD_STATS: Record<string, unknown> = {
  totalStudents: 0,
  totalCourses: 0,
  totalGroups: 0,
  totalRevenue: 0,
  pendingPayments: 0,
  pendingAmount: 0,
  frozenAccounts: 0,
  topCourses: [],
  attendanceAvg: 0,
  growthTrend: [],
  growthTrendWeek: [],
  growthTrendYearly: [],
  revenueMonthOverMonthPct: 0,
  debtorStudentCount: 0,
  overdue60DayStudentCount: 0,
  topStudents: [],
  collectionRate: 100,
};

export const useAdminStore = create<AdminState>((set, get) => ({
  user: readCrmUserFromStorage(),
  isInitialized: false,
  stats: null,
  isLoading: false,
  error: null,
  students: [],
  courses: [],
  groups: [],
  exams: [],
  examResults: [],
  users: [],
  payments: [],
  debtors: [],
  lessons: [],
  questions: [],
  questionStats: null,
  attendance: [],
  leads: [],

  setUser: (user) => {
    set({ user });
    persistCrmUser(user);
  },

  // ──── Analytics ────
  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/analytics/dashboard');
      set({ stats: data, isLoading: false, error: null });
    } catch (e: any) {
      const prev = get().stats;
      set({
        stats: prev ?? (FALLBACK_DASHBOARD_STATS as AdminState['stats']),
        isLoading: false,
        error: e?.message ?? 'fetch_stats_failed',
      });
    }
  },

  fetchTeacherDashboard: async () => {
    try {
      const { data } = await api.get('/analytics/teacher/dashboard');
      return data;
    } catch (e) { return null; }
  },

  // ──── Students ────
  fetchStudents: async (page = 1, limit = 500, compact = false) => {
    set({ isLoading: true });
    try {
      const c = compact ? '&compact=1' : '';
      const { data } = await api.get(`/students?page=${page}&limit=${limit}${c}`);
      set({ students: Array.isArray(data) ? data : (data.data || []), isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  createStudent: async (data: any) => {
    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      ...(data.parent_name ? { parent_name: data.parent_name } : {}),
      ...(data.parent_phone ? { parent_phone: data.parent_phone } : {}),
    };
    const res = await api.post('/students', payload);
    const student = (res as { data?: { id?: string } }).data;
    if (data.course_id && student?.id) {
      await api.post(`/students/${student.id}/enroll`, { course_id: data.course_id });
    }
    await get().fetchStudents();
  },

  updateStudent: async (id, data) => {
    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      parent_name: data.parent_name,
      parent_phone: data.parent_phone,
      status: data.status,
    };
    await api.patch(`/students/${id}`, payload);
    await get().fetchStudents();
  },

  deleteStudent: async (id) => {
    await api.delete(`/students/${id}`); 
    set({ students: get().students.filter(s => s.id !== id) }); 
  },

  enrollStudent: async (studentId, courseId) => {
    await api.post(`/students/${studentId}/enroll`, { course_id: courseId });
  },

  // ──── Leads ────
  fetchLeads: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/leads');
      set({ leads: data, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  convertLead: async (id, data) => {
    await api.post(`/leads/${id}/convert`, data);
    await get().fetchLeads();
    await get().fetchStudents();
  },

  deleteLead: async (id) => {
    try {
      await api.delete(`/leads/${id}`);
      set({ leads: get().leads.filter(l => l.id !== id) });
    } catch (e: any) { alert("O'chirishda xatolik yuz berdi"); }
  },

  // ──── Courses ────
  fetchCourses: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/courses');
      set({ courses: data, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  createCourse: async (data) => {
    await api.post('/courses', data); await get().fetchCourses();
  },

  updateCourse: async (id, data) => {
    await api.patch(`/courses/${id}`, data); await get().fetchCourses();
  },

  deleteCourse: async (id) => {
    await api.delete(`/courses/${id}`); set({ courses: get().courses.filter(c => c.id !== id) });
  },

  // ──── Groups ────
  fetchGroups: async () => {
    set({ isLoading: true });
    try {
      const role = get().user?.role;
      const path = role === 'TEACHER' ? '/groups/my-groups' : '/groups';
      const { data } = await api.get(path);
      set({ groups: data, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  createGroup: async (data) => {
    await api.post('/groups', data); await get().fetchGroups();
  },

  updateGroup: async (id, data) => {
    await api.patch(`/groups/${id}`, data); await get().fetchGroups();
  },

  deleteGroup: async (id) => {
    await api.delete(`/groups/${id}`); set({ groups: get().groups.filter(g => g.id !== id) });
  },

  addStudentToGroup: async (groupId, studentId) => {
    await api.post(`/groups/${groupId}/add-student`, { student_id: studentId });
  },

  removeStudentFromGroup: async (groupId, studentId) => {
    await api.delete(`/groups/${groupId}/remove-student`, { data: { student_id: studentId } });
  },

  fetchGroupStudents: async (groupId) => {
    try {
      const { data } = await api.get(`/groups/${groupId}/students`);
      return data;
    } catch (e) { return []; }
  },

  // ──── Exams ────
  fetchExams: async (courseId?: string) => {
    set({ isLoading: true });
    try {
      const url = courseId ? `/exams/course/${courseId}` : '/exams';
      const { data } = await api.get(url);
      set({ exams: Array.isArray(data) ? data : [], isLoading: false });
    } catch (e: any) { set({ exams: [], isLoading: false }); }
  },

  createExam: async (data) => {
    try {
      await api.post('/exams', data);
      await get().fetchExams();
    } catch (e: any) {
      const raw = e.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(', ') : raw || e.message;
      throw new Error(typeof msg === 'string' ? msg : "Imtihon yaratishda xatolik");
    }
  },

  updateExam: async (id, data) => {
    try {
      await api.patch(`/exams/${id}`, data);
      await get().fetchExams();
    } catch (e: any) {
      const raw = e.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(', ') : raw || e.message;
      throw new Error(typeof msg === 'string' ? msg : 'Yangilashda xatolik');
    }
  },

  deleteExam: async (id) => {
    await api.delete(`/exams/${id}`); set({ exams: get().exams.filter(e => e.id !== id) });
  },

  publishExam: async (id) => {
    try {
      await api.post(`/exams/${id}/publish`);
      await get().fetchExams();
    } catch (e: any) {
      const msg =
        e.response?.data?.message ||
        (Array.isArray(e.response?.data?.message) ? e.response.data.message.join(', ') : null) ||
        e.message;
      throw new Error(typeof msg === 'string' ? msg : "Nashr qilishda xatolik");
    }
  },

  addQuestionsToExam: async (examId, questionIds) => {
    try { await api.post(`/exams/${examId}/questions`, { question_ids: questionIds }); }
    catch (e: any) { alert("Savollar qo'shishda xatolik yuz berdi"); }
  },

  removeQuestionFromExam: async (examId, questionId) => {
    try {
      await api.delete(`/exams/${examId}/questions/${questionId}`);
      await get().fetchExams();
    } catch (e: any) {
      const raw = e.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(', ') : raw || e.message;
      throw new Error(typeof msg === 'string' ? msg : 'Savolni olib tashlashda xatolik');
    }
  },

  generateAiExam: async (examId, options) => {
    try {
      await api.post(`/exams/${examId}/ai-generate`, options);
      await get().fetchExams();
    } catch (e: any) {
      const raw = e.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(', ') : raw || e.message;
      throw new Error(typeof msg === 'string' ? msg : 'AI yaratishda xatolik');
    }
  },

  fetchExamForManage: async (examId) => {
    try {
      const { data } = await api.get(`/exams/manage/${examId}`);
      return data;
    } catch (e: any) {
      const raw = e.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(', ') : raw || e.message;
      throw new Error(typeof msg === 'string' ? msg : 'Imtihon ma’lumotini yuklashda xatolik');
    }
  },

  updateExamQuestion: async (examId, questionId, body) => {
    try {
      await api.patch(`/exams/${examId}/questions/${questionId}`, body);
      await get().fetchExams();
    } catch (e: any) {
      const raw = e.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(', ') : raw || e.message;
      throw new Error(typeof msg === 'string' ? msg : 'Savolni yangilashda xatolik');
    }
  },

  approveExamQuestion: async (examId, questionId) => {
    try {
      await api.post(`/exams/${examId}/questions/${questionId}/approve`);
      await get().fetchExams();
    } catch (e: any) {
      const raw = e.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(', ') : raw || e.message;
      throw new Error(typeof msg === 'string' ? msg : 'Tasdiqlashda xatolik');
    }
  },

  approveAllExamQuestions: async (examId) => {
    try {
      await api.post(`/exams/${examId}/approve-all`);
      await get().fetchExams();
    } catch (e: any) {
      const raw = e.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(', ') : raw || e.message;
      throw new Error(typeof msg === 'string' ? msg : 'Tasdiqlashda xatolik');
    }
  },

  addManualExamQuestion: async (examId, { text, options, correctIndex, level }) => {
    const slots = options.map((o) => String(o || '').trim());
    const opts = slots.filter(Boolean);
    if (!text?.trim() || opts.length < 2) {
      throw new Error('Savol matni va kamida 2 ta javob varianti kerak');
    }
    const cSlot = correctIndex;
    if (cSlot < 0 || cSlot > 3 || !slots[cSlot]) {
      throw new Error("To'g'ri javob uchun to'ldirilgan variantni tanlang");
    }
    const correct_answer = opts.indexOf(slots[cSlot]);
    if (correct_answer < 0) {
      throw new Error("To'g'ri javob indeksi noto'g'ri");
    }
    await api.post(`/exams/${examId}/questions/new`, {
      text: text.trim(),
      level: level || 'medium',
      type: 'multiple_choice',
      options: opts,
      correct_answer,
      lesson_id: null,
    });
    await get().fetchExams();
  },

  fetchExamResults: async (examId) => {
    try {
      const { data } = await api.get(`/exams/${examId}/results`);
      const rows = Array.isArray(data) ? data : [];
      set({ examResults: rows });
    } catch (e) {
      set({ examResults: [] });
    }
  },

  // ──── Users ────
  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/users');
      set({ users: data, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  createUser: async (data) => {
    await api.post('/users', data); await get().fetchUsers();
  },

  updateUser: async (id, data) => {
    await api.patch(`/users/${id}`, data); 
    await get().fetchUsers();
    if (get().user?.id === id) {
       const { data: me } = await api.get('/auth/me');
       set({ user: me });
    }
  },

  uploadUserPhoto: async (id, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const { data } = await api.post(`/users/${id}/upload-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    await get().fetchUsers();
    if (get().user?.id === id) {
       set({ user: { ...get().user, photo_url: data.photo_url } });
    }
    return data.photo_url;
  },

  deleteUser: async (id) => {
    await api.delete(`/users/${id}`);
    await get().fetchUsers();
  },

  // ──── Payments ────
  fetchPayments: async () => {
    set({ isLoading: true });
    try {
      const [payRes, debtRes] = await Promise.all([
        api.get('/payments'),
        api.get('/payments/debtors').catch(() => ({ data: [] })),
      ]);
      const debtRaw = debtRes?.data;
      set({
        payments: payRes.data,
        debtors: Array.isArray(debtRaw) ? debtRaw : [],
        isLoading: false,
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  createPayment: async (data) => {
    await api.post('/payments', data);
    await get().fetchPayments();
    await get().fetchStats();
  },

  updatePayment: async (id, data) => {
    await api.patch(`/payments/${id}`, data);
    await get().fetchPayments();
    await get().fetchStats();
  },

  deletePayment: async (id) => {
    try { await api.delete(`/payments/${id}`); set({ payments: get().payments.filter(p => p.id !== id) }); }
    catch (e: any) { alert("O'chirishda xatolik yuz berdi"); }
  },

  getStudentPayments: async (studentId) => {
    try {
      const { data } = await api.get(`/payments/student/${studentId}`);
      return data;
    } catch (e) { return null; }
  },

  // ──── Attendance ────
  fetchAttendance: async (groupId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/attendance/group/${groupId}`);
      set({ attendance: data, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  fetchIndividualAttendance: async (studentId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/attendance/individual/${studentId}`);
      set({ attendance: Array.isArray(data) ? data : [], isLoading: false });
    } catch (e: any) {
      set({ attendance: [], isLoading: false });
    }
  },

  markAttendance: async (data) => {
    await api.post('/attendance', data);
  },

  updateAttendance: async (id, status) => {
    try { await api.patch(`/attendance/${id}`, { status }); }
    catch (e: any) { alert('Davomat yangilashda xatolik yuz berdi'); }
  },

  // ──── Lessons ────
  fetchLessons: async (courseId) => {
    try {
      const { data } = await api.get(`/lessons/course/${courseId}`);
      set({ lessons: data });
    } catch (e) { set({ lessons: [] }); }
  },

  createLesson: async (data) => {
    try { await api.post('/lessons', data); }
    catch (e: any) { alert(e.response?.data?.message || 'Dars yaratishda xatolik yuz berdi'); }
  },

  // ──── Questions ────
  fetchQuestions: async (lessonId) => {
    try {
      const { data } = await api.get(`/questions/lesson/${lessonId}`);
      set({ questions: data });
    } catch (e) { set({ questions: [] }); }
  },

  createQuestion: async (data: any) => {
    try { await api.post('/questions', data); await get().fetchQuestionStats(); }
    catch (e: any) { alert(e.response?.data?.message || 'Savol yaratishda xatolik yuz berdi'); }
  },

  fetchQuestionStats: async () => {
    try {
      const { data } = await api.get('/questions/stats');
      set({ questionStats: data });
    } catch (e) { set({ questionStats: null }); }
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      get().setUser(data);
      set({ isInitialized: true });
      reconnectRealtimeSocket();
    } catch (e) {
      persistCrmUser(null);
      set({ user: null, isInitialized: true });
    }
  },

  // ──── Auth ────
  logout: async () => {
    try {
      disconnectRealtimeSocket();
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout xatosi:', e);
    } finally {
      persistCrmUser(null);
      set({ user: null, isInitialized: true });
      window.location.href = '/login';
    }
  }
}));
