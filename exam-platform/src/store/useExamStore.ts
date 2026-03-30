import { create } from 'zustand';
import api from '../lib/api';

interface ExamState {
  examId: string | null;
  attemptId: string | null;
  questions: any[];
  answers: Record<string, any>;
  timeLeft: number; 
  isExamStarted: boolean;
  isExamFinished: boolean;
  currentQuestionIndex: number;
  
  attendance: any[];
  payments: any[];
  history: any[];
  results: any;
  exams: any[];
  isLoading: boolean;
  violations: number;
  
  // Actions
  fetchExams: () => Promise<void>;
  startExam: (examId: string) => Promise<void>;
  setAnswer: (questionId: string, answer: any) => Promise<void>;
  tick: () => void;
  incrementViolations: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  finishExam: () => Promise<void>;
  fetchHistory: (studentId: string) => Promise<void>;
  reset: () => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
  examId: null,
  attemptId: null,
  questions: [],
  answers: {},
  timeLeft: 0,
  isExamStarted: false,
  isExamFinished: false,
  currentQuestionIndex: 0,
  
  attendance: [],
  payments: [],
  history: [],
  results: [],
  exams: [],
  isLoading: false,
  violations: 0,

  incrementViolations: () => set((state) => ({ violations: state.violations + 1 })),

  fetchExams: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/exams/student/available');
      set({ exams: data, isLoading: false });
    } catch (e) { set({ isLoading: false }); }
  },

  startExam: async (examId) => {
    set({ isLoading: true });
    try {
      const { data: attempt } = await api.post(`/exams/${examId}/start`);
      const { data: questions } = await api.get(`/exams/attempt/${attempt.id}/questions`);
      
      const deadline = new Date(attempt.deadline_at).getTime();
      const now = new Date().getTime();
      const timeLeft = Math.max(0, Math.floor((deadline - now) / 1000));

      set({
        examId,
        attemptId: attempt.id,
        questions,
        timeLeft,
        isExamStarted: true,
        isExamFinished: false,
        isLoading: false
      });
    } catch (e) {
      set({ isLoading: false });
      alert('Imtihonni boshlab bo"lmadi');
    }
  },

  setAnswer: async (questionId, answer) => {
    const { attemptId, answers } = get();
    if (!attemptId) return;

    set({ answers: { ...answers, [questionId]: answer } });
    try {
      await api.post(`/exams/attempt/${attemptId}/answer`, {
        question_id: questionId,
        answer_payload: answer
      });
    } catch (e) { console.error('Autosave failed'); }
  },

  tick: () => {
    const newTime = get().timeLeft - 1;
    set({ timeLeft: newTime });
    if (newTime <= 0 && get().isExamStarted && !get().isExamFinished) {
      get().finishExam();
    }
  },

  nextQuestion: () => {
    const nextIndex = get().currentQuestionIndex + 1;
    if (nextIndex < get().questions.length) set({ currentQuestionIndex: nextIndex });
  },

  prevQuestion: () => {
    const prevIndex = get().currentQuestionIndex - 1;
    if (prevIndex >= 0) set({ currentQuestionIndex: prevIndex });
  },

  jumpToQuestion: (index) => set({ currentQuestionIndex: index }),

  finishExam: async () => {
    const { attemptId } = get();
    if (!attemptId) return;
    try {
      await api.post(`/exams/attempt/${attemptId}/submit`);
      set({ isExamFinished: true, isExamStarted: false });
    } catch (e) { alert('Topshirishda xato'); }
  },

  fetchHistory: async (studentId) => {
    set({ isLoading: true });
    try {
      const [att, pay, hist] = await Promise.all([
        api.get(`/attendance/student/${studentId}`),
        api.get(`/payments/student/${studentId}`),
        api.get(`/exams/results/student/${studentId}`)
      ]);
      set({ attendance: att.data, payments: pay.data, history: hist.data, isLoading: false });
    } catch (e) { set({ isLoading: false }); }
  },

  reset: () => set({
    examId: null,
    attemptId: null,
    questions: [],
    answers: {},
    timeLeft: 0,
    isExamStarted: false,
    isExamFinished: false,
    currentQuestionIndex: 0
  })
}));
