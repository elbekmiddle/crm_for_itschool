import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { CheckCircle2, Save, Trash2 } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useConfirmLeave } from '../hooks/useConfirm';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Q_TYPES = [
  { id: 'multiple_choice', label: '4 variant (MCQ)' },
  { id: 'true_false', label: "To'g'ri / noto'g'ri" },
  { id: 'multiple_select', label: 'Bir nechta to‘g‘ri' },
  { id: 'text', label: 'Ochiq javob (matn)' },
] as const;

function defaultQuestion(type: string) {
  switch (type) {
    case 'text':
      return { text: '', options: [] as string[], correct_answer: '', type: 'text' as const };
    case 'true_false':
      return {
        text: '',
        options: ["To'g'ri", "Noto'g'ri"],
        correct_answer: 0,
        type: 'true_false' as const,
      };
    case 'multiple_select':
      return {
        text: '',
        options: ['Variant A', 'Variant B', 'Variant C'],
        correct_answer: [0, 1] as number[],
        type: 'multiple_select' as const,
      };
    default:
      return {
        text: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        type: 'multiple_choice' as const,
      };
  }
}

export default function TeacherExamReview() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useConfirmLeave(isDirty);

  useEffect(() => {
    fetchExamData();
  }, [examId]);

  const fetchExamData = async () => {
    try {
      setLoading(true);
      const { data: payload } = await api.get(`/exams/${examId}`);
      setExam(payload);
      const qs = (payload?.questions || []).map((q: any) => ({
        ...q,
        type: String(q.type || 'multiple_choice').replace(/-/g, '_'),
      }));
      setQuestions(qs);
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const markDirty = () => setIsDirty(true);

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      await api.patch(`/exams/${examId}`, { title: exam.title });

      const nextQs = [...questions];
      for (let i = 0; i < nextQs.length; i++) {
        const q = nextQs[i];
        const body: any = {
          text: q.text,
          options: q.options,
          type: q.type || 'multiple_choice',
          correct_answer: q.correct_answer,
          level: q.level || 'medium',
        };
        if (q.id) {
          await api.patch(`/exams/${examId}/questions/${q.id}`, body);
        } else {
          const res = await api.post(`/exams/${examId}/questions/new`, body);
          const created = res.data;
          if (created?.id) nextQs[i] = { ...q, id: created.id };
        }
      }
      setQuestions(nextQs);
      toast.success('Muvaffaqiyatli saqlandi');
      setIsDirty(false);
    } catch {
      toast.error('Saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAll = async () => {
    const ok = await confirm({
      title: 'Hamma savollarni tasdiqlash?',
      message: "Barcha draft savollar approved holatiga o'tib, imtihon o'quvchilarga ko'rina boshlaydi.",
      type: 'warning',
      confirmText: 'TASDIQLASH',
    });
    if (ok) {
      try {
        await api.post(`/exams/${examId}/approve-all`);
        toast.success('Muvaffaqiyatli tasdiqlandi');
        navigate('/exams');
      } catch {
        toast.error('Tasdiqlashda xatolik');
      }
    }
  };

  const deleteQuestion = async (qId: string | number) => {
    const ok = await confirm({
      title: "Savolni o'chirish?",
      message: 'Ushbu savol tizimdan butunlay o‘chiriladi.',
      type: 'danger',
      confirmText: "O'CHIRISH",
    });
    if (ok) {
      try {
        await api.delete(`/exams/${examId}/questions/${qId}`);
        setQuestions(questions.filter((q) => q.id !== qId));
        toast.success("O'chirildi");
      } catch {
        toast.error("O'chirishda xatolik");
      }
    }
  };

  const updateQuestion = (idx: number, field: string, val: any) => {
    const newQs = [...questions];
    newQs[idx] = { ...newQs[idx], [field]: val };
    setQuestions(newQs);
    markDirty();
  };

  const setQuestionType = (idx: number, type: string) => {
    const base = defaultQuestion(type);
    const newQs = [...questions];
    newQs[idx] = { ...newQs[idx], ...base, id: newQs[idx].id };
    setQuestions(newQs);
    markDirty();
  };

  const toggleCorrectMulti = (qIdx: number, optIdx: number) => {
    const q = questions[qIdx];
    const cur = Array.isArray(q.correct_answer) ? [...q.correct_answer] : [];
    const i = cur.indexOf(optIdx);
    if (i >= 0) cur.splice(i, 1);
    else cur.push(optIdx);
    cur.sort((a, b) => a - b);
    updateQuestion(qIdx, 'correct_answer', cur);
  };

  const addOptionRow = useCallback(
    (qIdx: number) => {
      const q = questions[qIdx];
      const opts = [...(q.options || [])];
      if (q.type === 'multiple_select' && opts.length >= 6) return;
      if (q.type === 'multiple_choice' && opts.length >= 6) return;
      opts.push('');
      updateQuestion(qIdx, 'options', opts);
    },
    [questions],
  );

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Yuklanmoqda...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pt-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex-1 w-full">
            <input
              value={exam?.title || ''}
              onChange={(e) => {
                setExam({ ...exam, title: e.target.value });
                markDirty();
              }}
              className="text-3xl font-black text-slate-800 dark:text-white bg-transparent border-none focus:ring-0 w-full p-0"
              placeholder="Imtihon nomi..."
            />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">
              Jami savollar: {questions.length} • Status: {exam?.status}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveAll}
              className="flex-1 md:flex-none px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
            <button
              type="button"
              onClick={handleApproveAll}
              className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" /> Tasdiqlash
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {questions.map((q, qIdx) => (
              <motion.div
                key={q.id ?? `new-${qIdx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 relative group"
              >
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                  <span className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400">
                    {qIdx + 1}
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Tur
                    </label>
                    <select
                      value={q.type || 'multiple_choice'}
                      onChange={(e) => setQuestionType(qIdx, e.target.value)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200"
                    >
                      {Q_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {q.id && (
                      <button
                        type="button"
                        onClick={() => deleteQuestion(q.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={q.text}
                  onChange={(e) => updateQuestion(qIdx, 'text', e.target.value)}
                  className="w-full text-xl font-bold bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 mb-6 text-slate-800 dark:text-white"
                  rows={2}
                  placeholder="Savol matni..."
                />

                {q.type === 'text' && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-2">
                      Namunaviy / kalit javob (AI baholash uchun)
                    </label>
                    <textarea
                      value={String(q.correct_answer ?? '')}
                      onChange={(e) => updateQuestion(qIdx, 'correct_answer', e.target.value)}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 text-slate-700 dark:text-slate-200 font-semibold"
                    />
                  </div>
                )}

                {(q.type === 'multiple_choice' ||
                  q.type === 'true_false' ||
                  q.type === 'multiple_select') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(q.options || []).map((opt: string, oIdx: number) => (
                      <div
                        key={oIdx}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                          q.type === 'multiple_select'
                            ? Array.isArray(q.correct_answer) && q.correct_answer.includes(oIdx)
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10'
                              : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30'
                            : q.correct_answer === oIdx
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10'
                              : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30'
                        }`}
                      >
                        {q.type === 'multiple_select' ? (
                          <input
                            type="checkbox"
                            checked={Array.isArray(q.correct_answer) && q.correct_answer.includes(oIdx)}
                            onChange={() => toggleCorrectMulti(qIdx, oIdx)}
                            className="w-5 h-5 rounded text-indigo-600"
                          />
                        ) : (
                          <input
                            type="radio"
                            name={`q-${qIdx}`}
                            checked={q.correct_answer === oIdx}
                            onChange={() => updateQuestion(qIdx, 'correct_answer', oIdx)}
                            className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                          />
                        )}
                        <input
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...(q.options || [])];
                            newOpts[oIdx] = e.target.value;
                            updateQuestion(qIdx, 'options', newOpts);
                          }}
                          className="flex-1 bg-transparent border-none p-0 font-bold text-slate-700 dark:text-slate-300 focus:ring-0"
                          placeholder={`Variant ${String.fromCharCode(65 + oIdx)}...`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'multiple_select' && (
                  <p className="text-xs text-slate-400 mt-3 font-bold">
                    To‘g‘ri deb hisoblangan variantlarni belgilang (kamida 2 ta tavsiya etiladi).
                  </p>
                )}

                {(q.type === 'multiple_choice' || q.type === 'multiple_select') && (
                  <button
                    type="button"
                    onClick={() => addOptionRow(qIdx)}
                    className="mt-4 text-xs font-black text-indigo-600 uppercase tracking-wider"
                  >
                    + Variant qo‘shish
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={() => {
            const nq = defaultQuestion('multiple_choice');
            setQuestions([...questions, { ...nq, status: 'draft' }]);
            markDirty();
          }}
          className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 font-bold hover:border-indigo-500 hover:text-indigo-500 transition-all uppercase tracking-widest text-xs"
        >
          + Yangi savol qo'shish
        </button>
      </div>
    </div>
  );
}
