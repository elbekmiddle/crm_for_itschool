import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import { socket } from '../lib/socket';
import type { Question } from '../types';

interface ExamState {
  // Session
  examId: string | null;
  attemptId: string | null;
  examTitle: string;
  questions: Question[];
  answers: Record<string, any>;
  flagged: Set<string>;
  currentQuestionIndex: number;
  startedAt: string | null;
  deadlineAt: string | null;
  timeLeft: number;
  isExamStarted: boolean;
  isExamFinished: boolean;
  violations: number;
  isLoading: boolean;

  // Lists
  exams: any[];
  history: any[];
  results: any;
  
  // Offline queue
  pendingAnswers: Array<{ questionId: string; answer: any }>;

  // Actions
  fetchExams: () => Promise<void>;
  startExam: (examId: string) => Promise<void>;
  setAnswer: (questionId: string, answer: any) => void;
  syncAnswer: (questionId: string, answer: any) => Promise<void>;
  toggleFlag: (questionId: string) => void;
  tick: () => void;
  incrementViolations: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  finishExam: () => Promise<void>;
  fetchHistory: (studentId: string) => Promise<void>;
  restoreSession: () => void;
  reset: () => void;
}

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      examId: null,
      attemptId: null,
      examTitle: '',
      questions: [],
      answers: {},
      flagged: new Set(),
      currentQuestionIndex: 0,
      startedAt: null,
      deadlineAt: null,
      timeLeft: 0,
      isExamStarted: false,
      isExamFinished: false,
      violations: 0,
      isLoading: false,
      exams: [],
      history: [],
      results: null,
      pendingAnswers: [],

      fetchExams: async () => {
        set({ isLoading: true });
        try {
          const { data } = await api.get('/exams/student/available');
          set({ exams: Array.isArray(data) ? data : [], isLoading: false });
        } catch {
          set({ exams: [], isLoading: false });
        }
      },

      startExam: async (examId) => {
        set({ isLoading: true });
        try {
          // Set multi-tab lock
          localStorage.setItem('exam-lock', examId);

          const { data: attempt } = await api.post(`/exams/${examId}/start`);
          const { data: questions } = await api.get(`/exams/attempt/${attempt.id}/questions`);
          
          // Fetch existing answers for restoration
          let existingAnswers = {};
          try {
            const { data: savedAnswers } = await api.get(`/exams/attempt/${attempt.id}/answers`);
            existingAnswers = savedAnswers || {};
          } catch (e) {
            console.error('Failed to fetch existing answers', e);
          }

          const deadline = new Date(attempt.deadline_at).getTime();
          const now = Date.now();
          const timeLeft = Math.max(0, Math.floor((deadline - now) / 1000));

          set({
            examId,
            attemptId: attempt.id,
            examTitle: attempt.exam_title || attempt.title || '',
            questions: Array.isArray(questions) ? questions : [],
            answers: existingAnswers,
            flagged: new Set(),
            timeLeft,
            startedAt: attempt.started_at,
            deadlineAt: attempt.deadline_at,
            isExamStarted: true,
            isExamFinished: false,
            isLoading: false,
            currentQuestionIndex: 0,
            violations: 0,
          });
        } catch (e: any) {
          set({ isLoading: false });
          throw e;
        }
      },

      setAnswer: (questionId, answer) => {
        const { answers } = get();
        set({ answers: { ...answers, [questionId]: answer } });
        // Debounced sync
        get().syncAnswer(questionId, answer);
      },

      syncAnswer: async (questionId, answer) => {
        const { attemptId } = get();
        if (!attemptId) return;
        try {
          await api.post(`/exams/attempt/${attemptId}/answer`, {
            question_id: questionId,
            answer_payload: answer,
          });

          // Sync via socket for real-time visibility (if needed by teacher)
          if (socket.connected) {
            socket.emit('student_answered', { attemptId, questionId });
          }

          // Remove from pending if synced
          set((s) => ({
            pendingAnswers: s.pendingAnswers.filter((p) => p.questionId !== questionId),
          }));
        } catch {
          // Queue for retry
          set((s) => ({
            pendingAnswers: [
              ...s.pendingAnswers.filter((p) => p.questionId !== questionId),
              { questionId, answer },
            ],
          }));
        }
      },

      toggleFlag: (questionId) => {
        set((state) => {
          const newFlagged = new Set(state.flagged);
          if (newFlagged.has(questionId)) {
            newFlagged.delete(questionId);
          } else {
            newFlagged.add(questionId);
          }
          return { flagged: newFlagged };
        });
      },

      tick: () => {
        const { timeLeft, isExamStarted, isExamFinished, deadlineAt } = get();
        
        // Recalculate from server time if available
        let newTime = timeLeft - 1;
        if (deadlineAt) {
          const deadline = new Date(deadlineAt).getTime();
          const serverBased = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
          // Use server-based time to prevent cheating
          newTime = serverBased;
        }

        set({ timeLeft: Math.max(0, newTime) });
        
        if (newTime <= 0 && isExamStarted && !isExamFinished) {
          get().finishExam();
        }
      },

      incrementViolations: () => {
        const newCount = get().violations + 1;
        set({ violations: newCount });
        if (newCount >= 3 && get().isExamStarted && !get().isExamFinished) {
          get().finishExam();
        }
      },

      nextQuestion: () => {
        const { currentQuestionIndex, questions } = get();
        if (currentQuestionIndex + 1 < questions.length) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },

      prevQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },

      jumpToQuestion: (index) => set({ currentQuestionIndex: index }),

      finishExam: async () => {
        const { attemptId, isExamFinished } = get();
        if (!attemptId || isExamFinished) return;
        
        set({ isExamFinished: true, isExamStarted: false });
        localStorage.removeItem('exam-lock');
        
        try {
          await api.post(`/exams/attempt/${attemptId}/submit`);
        } catch {
          console.error('Submit failed');
        }
      },

      fetchHistory: async (studentId) => {
        set({ isLoading: true });
        try {
          const { data } = await api.get(`/exams/results/student/${studentId}`);
          set({ history: Array.isArray(data) ? data : [], isLoading: false });
        } catch {
          set({ history: [], isLoading: false });
        }
      },

      restoreSession: () => {
        const { deadlineAt, isExamStarted, isExamFinished } = get();
        if (isExamStarted && !isExamFinished && deadlineAt) {
          const deadline = new Date(deadlineAt).getTime();
          const timeLeft = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
          set({ timeLeft });
          if (timeLeft <= 0) {
            get().finishExam();
          }
        }
      },

      reset: () => {
        localStorage.removeItem('exam-lock');
        set({
          examId: null,
          attemptId: null,
          examTitle: '',
          questions: [],
          answers: {},
          flagged: new Set(),
          timeLeft: 0,
          startedAt: null,
          deadlineAt: null,
          isExamStarted: false,
          isExamFinished: false,
          currentQuestionIndex: 0,
          violations: 0,
          pendingAnswers: [],
        });
      },
    }),
    {
      name: 'exam-storage',
      partialize: (state) => ({
        examId: state.examId,
        attemptId: state.attemptId,
        examTitle: state.examTitle,
        questions: state.questions,
        answers: state.answers,
        flagged: Array.from(state.flagged),
        currentQuestionIndex: state.currentQuestionIndex,
        startedAt: state.startedAt,
        deadlineAt: state.deadlineAt,
        isExamStarted: state.isExamStarted,
        isExamFinished: state.isExamFinished,
        violations: state.violations,
        pendingAnswers: state.pendingAnswers,
      }),
      merge: (persisted: any, current) => ({
        ...current,
        ...persisted,
        flagged: new Set(persisted?.flagged || []),
      }),
    }
  )
);
