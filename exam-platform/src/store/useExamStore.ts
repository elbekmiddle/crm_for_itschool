import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import { socket } from '../lib/socket';
import type { Question } from '../types';

const answerSyncTimers = new Map<string, ReturnType<typeof setTimeout>>();
const ANSWER_SYNC_DEBOUNCE_MS = 450;
const ANSWER_POST_RETRIES = 3;

function isTransientNetworkError(e: unknown): boolean {
  const err = e as { response?: unknown; code?: string; message?: string };
  if (err?.response) return false;
  const code = err?.code;
  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || code === 'ECONNREFUSED') return true;
  const msg = String(err?.message ?? '');
  return /Network Error|CONNECTION_REFUSED|Failed to fetch/i.test(msg);
}

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
  finishReason: 'time_up' | 'manual' | 'cheating' | null;
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
  retryPending: () => Promise<void>;
  toggleFlag: (questionId: string) => void;
  tick: () => void;
  incrementViolations: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  finishExam: (reason?: 'time_up' | 'manual' | 'cheating') => Promise<void>;
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
      finishReason: null,
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
        const prev = answerSyncTimers.get(questionId);
        if (prev) clearTimeout(prev);
        answerSyncTimers.set(
          questionId,
          setTimeout(() => {
            answerSyncTimers.delete(questionId);
            const latest = get().answers[questionId];
            get().syncAnswer(questionId, latest);
          }, ANSWER_SYNC_DEBOUNCE_MS),
        );
      },

      syncAnswer: async (questionId, answer) => {
        const { attemptId } = get();
        if (!attemptId) return;
        for (let i = 0; i < ANSWER_POST_RETRIES; i++) {
          try {
            await api.post(`/exams/attempt/${attemptId}/answer`, {
              question_id: questionId,
              answer_payload: answer,
            });

            if (socket.connected) {
              socket.emit('student_answered', { attemptId, questionId });
            }

            set((s) => ({
              pendingAnswers: s.pendingAnswers.filter((p) => p.questionId !== questionId),
            }));
            return;
          } catch (e) {
            const transient = isTransientNetworkError(e);
            if (!transient || i === ANSWER_POST_RETRIES - 1) {
              set((s) => ({
                pendingAnswers: [
                  ...s.pendingAnswers.filter((p) => p.questionId !== questionId),
                  { questionId, answer },
                ],
              }));
              return;
            }
            await new Promise((r) => setTimeout(r, 400 * (i + 1)));
          }
        }
      },

      retryPending: async () => {
        const { pendingAnswers, attemptId } = get();
        if (!attemptId || !pendingAnswers.length) return;
        const batch = [...pendingAnswers];
        for (const { questionId, answer } of batch) {
          await get().syncAnswer(questionId, answer);
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
          get().finishExam('time_up');
        }
      },

      incrementViolations: () => {
        const newCount = get().violations + 1;
        set({ violations: newCount });
        if (newCount >= 3 && get().isExamStarted && !get().isExamFinished) {
          get().finishExam('cheating');
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

      finishExam: async (reason: 'time_up' | 'manual' | 'cheating' = 'manual') => {
        const { attemptId, isExamFinished, answers } = get();
        if (!attemptId || isExamFinished) return;

        answerSyncTimers.forEach((t) => clearTimeout(t));
        answerSyncTimers.clear();

        await get().retryPending();
        const flush = Object.entries(answers).map(([qid, val]) => get().syncAnswer(qid, val));
        await Promise.allSettled(flush);
        await get().retryPending();

        set({ isExamFinished: true, isExamStarted: false, finishReason: reason });
        localStorage.removeItem('exam-lock');

        try {
          await api.post(`/exams/attempt/${attemptId}/submit`, { reason });
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
        finishReason: state.finishReason,
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
