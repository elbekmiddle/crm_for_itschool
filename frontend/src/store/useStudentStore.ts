import { create } from 'zustand';
import api from '../lib/api';

interface StudentState {
  exams: any[];
  activeAttempt: any | null;
  timeLeft: number;
  isLoading: boolean;
  error: string | null;

  fetchExams: () => Promise<void>;
  startExam: (examId: string) => Promise<void>;
  saveAnswer: (attemptId: string, questionId: string, answer: any) => Promise<void>;
  submitExam: (attemptId: string) => Promise<void>;
  fetchResult: (attemptId: string) => Promise<any>;
  
  // Local state for timer
  setTimeLeft: (time: number) => void;
  decrementTime: () => void;
  resetAttempt: () => void;
}

export const useStudentStore = create<StudentState>((set) => ({
  exams: [],
  activeAttempt: null,
  timeLeft: 0,
  isLoading: false,
  error: null,

  fetchExams: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/exams/student/available');
      set({ exams: data, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  startExam: async (examId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post(`/exams/${examId}/start`);
      set({ 
        activeAttempt: data, 
        timeLeft: (data.exam.duration_minutes || 30) * 60,
        isLoading: false 
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  saveAnswer: async (attemptId, questionId, answer) => {
    try {
      await api.post(`/exams/attempt/${attemptId}/answer`, { question_id: questionId, answer_payload: answer });
    } catch (e) {
      console.error('Auto-save failed:', e);
    }
  },

  submitExam: async (attemptId) => {
    set({ isLoading: true });
    try {
      await api.post(`/exams/attempt/${attemptId}/submit`);
      set({ activeAttempt: null, timeLeft: 0, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  fetchResult: async (id) => {
    try {
      const { data } = await api.get(`/exams/attempt/${id}/result`);
      return data;
    } catch (e) {
      return null;
    }
  },

  setTimeLeft: (time) => set({ timeLeft: time }),
  decrementTime: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),
  resetAttempt: () => set({ activeAttempt: null, timeLeft: 0 }),
}));
