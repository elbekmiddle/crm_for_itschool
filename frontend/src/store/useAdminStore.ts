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
  
  // Actions
  setUser: (user: any) => void;
  fetchStats: () => Promise<void>;
  fetchStudents: () => Promise<void>;
  fetchCourses: () => Promise<void>;
  fetchGroups: () => Promise<void>;
  fetchExams: (courseId?: string) => Promise<void>;
  fetchExamResults: (examId: string) => Promise<void>;
  
  createStudent: (data: any) => Promise<void>;
  updateStudent: (id: string, data: any) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  
  createCourse: (data: any) => Promise<void>;
  createGroup: (data: any) => Promise<void>;
  createExam: (data: any) => Promise<void>;
  publishExam: (id: string) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  generateAiExam: (examId: string, options: any) => Promise<void>;
  
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

  setUser: (user) => {
    set({ user });
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  },

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/analytics/dashboard');
      set({ stats: data, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  fetchStudents: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/students');
      set({ students: data || [], isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  fetchCourses: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/courses');
      set({ courses: data, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  fetchGroups: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/groups');
      set({ groups: data, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  fetchExams: async (courseId?: string) => {
    set({ isLoading: true });
    try {
      const url = courseId ? `/exams/course/${courseId}` : '/exams';
      const { data } = await api.get(url);
      set({ exams: data, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  fetchExamResults: async (examId: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/exams/${examId}/results`);
      set({ examResults: data, isLoading: false });
    } catch (e) { set({ isLoading: false }); }
  },
  
  createStudent: async (data: any) => {
    try { await api.post('/students', data); await get().fetchStudents(); }
    catch (e: any) { alert(e.response?.data?.message || 'Xato'); }
  },

  updateStudent: async (id: string, data: any) => {
    try { await api.patch(`/students/${id}`, data); await get().fetchStudents(); }
    catch (e: any) { alert(e.response?.data?.message || 'Xato'); }
  },

  deleteStudent: async (id: string) => {
    try { await api.delete(`/students/${id}`); set({ students: get().students.filter(s => s.id !== id) }); }
    catch (e: any) { alert('O"chirishda xato'); }
  },

  createCourse: async (data: any) => {
    try { await api.post('/courses', data); await get().fetchCourses(); }
    catch (e) { alert('Xato'); }
  },

  createGroup: async (data: any) => {
    try { await api.post('/groups', data); await get().fetchGroups(); }
    catch (e) { alert('Xato'); }
  },

  createExam: async (data: any) => {
    try { await api.post('/exams', data); await get().fetchExams(); }
    catch (e) { alert('Xato'); }
  },

  publishExam: async (id: string) => {
    try { await api.post(`/exams/${id}/publish`); await get().fetchExams(); }
    catch (e) { alert('Nashr qilishda xato'); }
  },

  deleteExam: async (id: string) => {
    try { await api.delete(`/exams/${id}`); await get().fetchExams(); }
    catch (e) { alert('O"chirishda xato'); }
  },

  generateAiExam: async (examId: string, options: any) => {
    try { await api.post(`/exams/${examId}/ai-generate`, options); await get().fetchExams(); }
    catch (e: any) { alert('AI xatosi'); }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null });
    window.location.href = '/login';
  }
}));
