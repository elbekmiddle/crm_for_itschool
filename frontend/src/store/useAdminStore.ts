import { create } from 'zustand';
import api from '../lib/api';

interface AdminState {
  user: any | null;
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
  lessons: any[];
  questions: any[];
  attendance: any[];
  
  // Actions
  setUser: (user: any) => void;
  fetchStats: () => Promise<void>;
  
  // Students
  fetchStudents: (page?: number, limit?: number) => Promise<void>;
  createStudent: (data: any) => Promise<void>;
  updateStudent: (id: string, data: any) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  enrollStudent: (studentId: string, courseId: string) => Promise<void>;
  
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
  fetchExamResults: (examId: string) => Promise<void>;
  
  // Users
  fetchUsers: () => Promise<void>;
  createUser: (data: any) => Promise<void>;
  updateUser: (id: string, data: any) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  // Payments
  fetchPayments: () => Promise<void>;
  createPayment: (data: any) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  getStudentPayments: (studentId: string) => Promise<any>;
  
  // Attendance
  fetchAttendance: (groupId: string) => Promise<void>;
  markAttendance: (data: any) => Promise<void>;
  updateAttendance: (id: string, status: string) => Promise<void>;
  
  // Lessons & Questions
  fetchLessons: (courseId: string) => Promise<void>;
  createLesson: (data: any) => Promise<void>;
  fetchQuestions: (lessonId: string) => Promise<void>;
  createQuestion: (data: any) => Promise<void>;
  
  // Analytics
  fetchTeacherDashboard: () => Promise<any>;
  
  logout: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
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
  lessons: [],
  questions: [],
  attendance: [],

  setUser: (user) => {
    set({ user });
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  },

  // ──── Analytics ────
  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/analytics/dashboard');
      set({ stats: data, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  fetchTeacherDashboard: async () => {
    try {
      const { data } = await api.get('/analytics/teacher/dashboard');
      return data;
    } catch (e) { return null; }
  },

  // ──── Students ────
  fetchStudents: async (page = 1, limit = 100) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/students?page=${page}&limit=${limit}`);
      set({ students: Array.isArray(data) ? data : (data.data || []), isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  createStudent: async (data: any) => {
    try { 
      await api.post('/students', data); 
      await get().fetchStudents(); 
    } catch (e: any) { alert(e.response?.data?.message || 'Talaba yaratishda xato'); }
  },

  updateStudent: async (id, data) => {
    try { 
      await api.patch(`/students/${id}`, data); 
      await get().fetchStudents(); 
    } catch (e: any) { alert(e.response?.data?.message || 'Tahrirlashda xato'); }
  },

  deleteStudent: async (id) => {
    try { 
      await api.delete(`/students/${id}`); 
      set({ students: get().students.filter(s => s.id !== id) }); 
    } catch (e: any) { alert('O\'chirishda xato'); }
  },

  enrollStudent: async (studentId, courseId) => {
    try {
      await api.post(`/students/${studentId}/enroll`, { course_id: courseId });
      alert('Talaba kursga muvaffaqiyatli yozildi!');
    } catch (e: any) { alert(e.response?.data?.message || 'Kursga yozishda xato'); }
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
    try { await api.post('/courses', data); await get().fetchCourses(); }
    catch (e: any) { alert(e.response?.data?.message || 'Kurs yaratishda xato'); }
  },

  updateCourse: async (id, data) => {
    try { await api.patch(`/courses/${id}`, data); await get().fetchCourses(); }
    catch (e: any) { alert(e.response?.data?.message || 'Tahrirlashda xato'); }
  },

  deleteCourse: async (id) => {
    try { await api.delete(`/courses/${id}`); set({ courses: get().courses.filter(c => c.id !== id) }); }
    catch (e: any) { alert('O\'chirishda xato'); }
  },

  // ──── Groups ────
  fetchGroups: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/groups');
      set({ groups: data, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  createGroup: async (data) => {
    try { await api.post('/groups', data); await get().fetchGroups(); }
    catch (e: any) { alert(e.response?.data?.message || 'Guruh yaratishda xato'); }
  },

  updateGroup: async (id, data) => {
    try { await api.patch(`/groups/${id}`, data); await get().fetchGroups(); }
    catch (e: any) { alert(e.response?.data?.message || 'Tahrirlashda xato'); }
  },

  deleteGroup: async (id) => {
    try { await api.delete(`/groups/${id}`); set({ groups: get().groups.filter(g => g.id !== id) }); }
    catch (e: any) { alert('O\'chirishda xato'); }
  },

  addStudentToGroup: async (groupId, studentId) => {
    try { await api.post(`/groups/${groupId}/add-student`, { student_id: studentId }); }
    catch (e: any) { alert(e.response?.data?.message || 'Talaba qo\'shishda xato'); }
  },

  removeStudentFromGroup: async (groupId, studentId) => {
    try { await api.delete(`/groups/${groupId}/remove-student`, { data: { student_id: studentId } }); }
    catch (e: any) { alert(e.response?.data?.message || 'Olib tashlashda xato'); }
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
      const url = courseId ? `/exams/course/${courseId}` : '/exams/course/all';
      const { data } = await api.get(url);
      set({ exams: Array.isArray(data) ? data : [], isLoading: false });
    } catch (e: any) { set({ exams: [], isLoading: false }); }
  },

  createExam: async (data) => {
    try { await api.post('/exams', data); await get().fetchExams(); }
    catch (e: any) { alert(e.response?.data?.message || 'Imtihon yaratishda xato'); }
  },

  updateExam: async (id, data) => {
    try { await api.patch(`/exams/${id}`, data); await get().fetchExams(); }
    catch (e: any) { alert('Tahrirlashda xato'); }
  },

  deleteExam: async (id) => {
    try { await api.delete(`/exams/${id}`); set({ exams: get().exams.filter(e => e.id !== id) }); }
    catch (e: any) { alert('O\'chirishda xato'); }
  },

  publishExam: async (id) => {
    try { await api.post(`/exams/${id}/publish`); await get().fetchExams(); }
    catch (e: any) { alert('Nashr qilishda xato'); }
  },

  addQuestionsToExam: async (examId, questionIds) => {
    try { await api.post(`/exams/${examId}/questions`, { question_ids: questionIds }); }
    catch (e: any) { alert('Savollar qo\'shishda xato'); }
  },

  removeQuestionFromExam: async (examId, questionId) => {
    try { await api.delete(`/exams/${examId}/questions/${questionId}`); }
    catch (e: any) { alert('Savol olib tashlashda xato'); }
  },

  generateAiExam: async (examId, options) => {
    try { await api.post(`/exams/${examId}/ai-generate`, options); await get().fetchExams(); }
    catch (e: any) { alert('AI xatosi: ' + (e.response?.data?.message || 'Noma\'lum xato')); }
  },

  fetchExamResults: async (examId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/exams/${examId}/results`);
      set({ examResults: data, isLoading: false });
    } catch (e) { set({ examResults: [], isLoading: false }); }
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
    try { await api.post('/users', data); await get().fetchUsers(); }
    catch (e: any) { alert(e.response?.data?.message || 'Foydalanuvchi yaratishda xato'); }
  },

  updateUser: async (id, data) => {
    try { await api.patch(`/users/${id}`, data); await get().fetchUsers(); }
    catch (e: any) { alert(e.response?.data?.message || 'Tahrirlashda xato'); }
  },

  deleteUser: async (id) => {
    try { await api.delete(`/users/${id}`); set({ users: get().users.filter(u => u.id !== id) }); }
    catch (e: any) { alert('O\'chirishda xato'); }
  },

  // ──── Payments ────
  fetchPayments: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/payments');
      set({ payments: data, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  createPayment: async (data) => {
    try { await api.post('/payments', data); await get().fetchPayments(); }
    catch (e: any) { alert(e.response?.data?.message || 'To\'lov yaratishda xato'); }
  },

  deletePayment: async (id) => {
    try { await api.delete(`/payments/${id}`); set({ payments: get().payments.filter(p => p.id !== id) }); }
    catch (e: any) { alert('O\'chirishda xato'); }
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

  markAttendance: async (data) => {
    try { await api.post('/attendance', data); }
    catch (e: any) { alert(e.response?.data?.message || 'Davomat belgilashda xato'); }
  },

  updateAttendance: async (id, status) => {
    try { await api.patch(`/attendance/${id}`, { status }); }
    catch (e: any) { alert('Davomat yangilashda xato'); }
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
    catch (e: any) { alert(e.response?.data?.message || 'Dars yaratishda xato'); }
  },

  // ──── Questions ────
  fetchQuestions: async (lessonId) => {
    try {
      const { data } = await api.get(`/questions/lesson/${lessonId}`);
      set({ questions: data });
    } catch (e) { set({ questions: [] }); }
  },

  createQuestion: async (data) => {
    try { await api.post('/questions', data); }
    catch (e: any) { alert(e.response?.data?.message || 'Savol yaratishda xato'); }
  },

  // ──── Auth ────
  logout: () => {
    const token = localStorage.getItem('token');
    if (token) {
      api.post('/auth/logout').catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null });
    window.location.href = '/login';
  }
}));
