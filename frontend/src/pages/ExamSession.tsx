import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Send } from 'lucide-react';
import api from '../lib/api';
import { useExamAntiCheat } from '../hooks/useExamAntiCheat';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

function normType(t?: string) {
  const x = String(t || 'multiple_choice').toLowerCase().replace(/-/g, '_');
  if (x === 'select' || x === 'mcq') return 'multiple_choice';
  if (x === 'boolean' || x === 'tf') return 'true_false';
  return x;
}

function isAnswered(q: any, val: any): boolean {
  if (val === undefined || val === null) return false;
  const t = normType(q?.type);
  if (t === 'text') return String(val).trim().length > 0;
  if (t === 'multiple_select' || t === 'multi_select') {
    return Array.isArray(val) && val.length > 0;
  }
  return true;
}

const ExamSession: React.FC = () => {
  const { id: attemptId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savePayload = useCallback(
    async (questionId: string, payload: any) => {
      try {
        await api.post(`/exams/attempt/${attemptId}/answer`, {
          question_id: questionId,
          answer_payload: payload,
        });
      } catch {
        /* autosave — shovqin qilmaymiz */
      }
    },
    [attemptId],
  );

  const scheduleAutosave = useCallback(
    (questionId: string, payload: any) => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
      autosaveRef.current = setTimeout(() => savePayload(questionId, payload), 800);
    },
    [savePayload],
  );

  const submitExam = useCallback(
    async (isAuto = false) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        await api.post(`/exams/attempt/${attemptId}/submit`);
        showToast(
          isAuto ? 'Qoidabuzarlik tufayli yakunlandi' : 'Imtihon muvaffaqiyatli topshirildi',
          'success',
        );
        navigate(`/student/exams/${attemptId}/result`);
      } catch {
        showToast('Topshirishda xatolik', 'error');
        setIsSubmitting(false);
      }
    },
    [attemptId, navigate, isSubmitting, showToast],
  );

  const { warnings } = useExamAntiCheat({
    examId: attemptId || 'active',
    onWarning: (cnt) => {
      showToast(`DIQQAT! Oynani tark etmang (${cnt}/3)`, 'error');
    },
    onAutoSubmit: () => submitExam(true),
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [qRes, aRes] = await Promise.all([
          api.get(`/exams/attempt/${attemptId}/questions`),
          api.get(`/exams/attempt/${attemptId}/answers`).catch(() => ({ data: {} as Record<string, any> })),
        ]);
        const raw = qRes.data;
        const list = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.data) ? (raw as any).data : [];
        setQuestions(
          list.map((q: any) => ({
            ...q,
            type: normType(q.type),
            options: Array.isArray(q.options) ? q.options : [],
          })),
        );
        const amap = aRes.data && typeof aRes.data === 'object' ? aRes.data : {};
        setAnswers(amap);
        setTimeLeft(1800);
      } catch {
        showToast("Sessiyani yuklab bo'lmadi", 'error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [attemptId, showToast]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0) submitExam();
      return;
    }
    const timer = setInterval(() => setTimeLeft((p) => (p || 0) - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitExam]);

  const handleMcqOrTf = (qId: string, optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: optIdx }));
    scheduleAutosave(qId, optIdx);
  };

  const toggleMulti = (qId: string, optIdx: number) => {
    setAnswers((prev) => {
      const cur = Array.isArray(prev[qId]) ? [...prev[qId]] : [];
      const i = cur.indexOf(optIdx);
      if (i >= 0) cur.splice(i, 1);
      else cur.push(optIdx);
      cur.sort((a, b) => a - b);
      scheduleAutosave(qId, cur);
      return { ...prev, [qId]: cur };
    });
  };

  const handleText = (qId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: text }));
    scheduleAutosave(qId, text);
  };

  const handleFinalConfirm = async () => {
    const ok = await confirm({
      title: 'Imtihonni topshirish?',
      message: "Barcha javoblar saqlanadi va qayta o'zgartirib bo'lmaydi.",
      type: 'warning',
      confirmText: 'TOPSHIRISH',
    });
    if (ok) submitExam();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-slate-400 animate-pulse">
        SESSIYA TAYYORLANMOQDA...
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!currentQ) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">
        Savollar topilmadi
      </div>
    );
  }

  const qt = normType(currentQ.type);

  const optionLabel = (opt: any) =>
    opt != null && typeof opt === 'object' && 'text' in opt
      ? String((opt as { text?: string }).text ?? '')
      : String(opt ?? '');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-20">
      <div className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-40 px-8 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 px-4 py-2 rounded-2xl text-white font-black shadow-lg shadow-indigo-600/20 flex items-center gap-2">
            <Clock className="w-5 h-5" /> {formatTime(timeLeft || 0)}
          </div>
          {warnings > 0 && (
            <div className="bg-red-500/10 text-red-500 px-3 py-2 rounded-xl text-xs font-black border border-red-500/20 animate-pulse uppercase tracking-wider">
              Ogohlantirish: {warnings}/3
            </div>
          )}
        </div>
        <button
          onClick={handleFinalConfirm}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <Send className="w-4 h-4" /> YAKUNLASH
        </button>
      </div>

      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 p-6 flex-1">
        <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 self-start sticky top-24">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
            Savollar ro'yxati
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id || idx}
                onClick={() => setCurrentIdx(idx)}
                className={`aspect-square rounded-xl font-black text-sm transition-all ${
                  currentIdx === idx
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : isAnswered(q, answers[q.id])
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-sm border border-slate-200 dark:border-slate-800"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                {qt === 'multiple_choice' && 'Bitta tanlov'}
                {qt === 'true_false' && 'To‘g‘ri / noto‘g‘ri'}
                {qt === 'multiple_select' && 'Bir nechta tanlov'}
                {qt === 'text' && 'Ochiq javob'}
              </p>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-10 leading-relaxed">
                {currentIdx + 1}. {currentQ?.text}
              </h2>

              {(qt === 'multiple_choice' || qt === 'true_false') && (
                <div className="space-y-4">
                  {(currentQ?.options || []).map((opt: unknown, idx: number) => {
                    const sel = answers[currentQ.id] === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleMcqOrTf(currentQ.id, idx)}
                        className={`w-full group p-6 rounded-3xl border-2 transition-all flex items-center gap-5 text-left ${
                          sel
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${
                            sel
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-200 dark:border-slate-700 text-slate-300'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span
                          className={`text-lg font-bold ${sel ? 'text-indigo-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          {optionLabel(opt)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {qt === 'multiple_select' && (
                <div className="space-y-4">
                  {(currentQ?.options || []).map((opt: unknown, idx: number) => {
                    const cur = Array.isArray(answers[currentQ.id]) ? answers[currentQ.id] : [];
                    const sel = cur.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleMulti(currentQ.id, idx)}
                        className={`w-full group p-6 rounded-3xl border-2 transition-all flex items-center gap-5 text-left ${
                          sel
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-sm ${
                            sel
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-200 dark:border-slate-700 text-slate-300'
                          }`}
                        >
                          {sel ? '✓' : ''}
                        </div>
                        <span
                          className={`text-lg font-bold ${sel ? 'text-indigo-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          {optionLabel(opt)}
                        </span>
                      </button>
                    );
                  })}
                  <p className="text-xs text-slate-400 font-bold">
                    Bir yoki bir nechta variantni belgilang (IELTS multiple matching uslubi).
                  </p>
                </div>
              )}

              {qt === 'text' && (
                <textarea
                  value={answers[currentQ.id] ?? ''}
                  onChange={(e) => handleText(currentQ.id, e.target.value)}
                  rows={8}
                  placeholder="Javobingizni yozing..."
                  className="w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6 text-lg font-semibold text-slate-800 dark:text-white focus:border-indigo-500 focus:ring-0 outline-none resize-y min-h-[200px]"
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setCurrentIdx((p) => p - 1)}
              disabled={currentIdx === 0}
              className="px-8 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 font-bold hover:bg-slate-50 transition-all disabled:opacity-0"
            >
              ← ORQAGA
            </button>
            <div className="text-xs font-black text-slate-300 uppercase tracking-widest">
              {currentIdx + 1} / {questions.length}
            </div>
            <button
              type="button"
              onClick={() =>
                currentIdx === questions.length - 1 ? handleFinalConfirm() : setCurrentIdx((p) => p + 1)
              }
              className="px-8 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 font-black hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all"
            >
              {currentIdx === questions.length - 1 ? 'YAKUNLASH' : 'KEYINGISI →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamSession;
