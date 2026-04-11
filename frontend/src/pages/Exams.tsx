import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import {
  ClipboardList, Plus, Search, Loader2, Pencil, Trash2, X,
  Play, ChevronLeft, ChevronRight, Radio, FileText, Sparkles, PenLine,
  ListChecks, CheckCircle, Eye,
} from 'lucide-react';

import { useConfirm } from '../context/ConfirmContext';
import { toast } from 'react-hot-toast';
import { useModalOverlayEffects } from '../hooks/useModalOverlayEffects';
import { motion, AnimatePresence } from 'framer-motion';

const statusMap: Record<string, { label: string; cls: string }> = {
  draft: { label: 'DRAFT', cls: 'pill-draft' },
  published: { label: 'PUBLISHED', cls: 'pill-published' },
  active: { label: 'ACTIVE', cls: 'pill-active' },
  completed: { label: 'COMPLETED', cls: 'pill-completed' },
};

const ExamsPage: React.FC = () => {
  const {
    user,
    groups,
    exams,
    courses,
    fetchExams,
    fetchCourses,
    fetchGroups,
    createExam,
    updateExam,
    deleteExam,
    publishExam,
    generateAiExam,
    addManualExamQuestion,
    fetchExamForManage,
    updateExamQuestion,
    approveExamQuestion,
    approveAllExamQuestions,
    removeQuestionFromExam,
    fetchExamResults,
    examResults,
    isLoading,
  } = useAdminStore();
  const confirm = useConfirm();
  const [modal, setModal] = useState<
    'create' | 'edit' | 'ai' | 'manual' | 'review' | 'results' | null
  >(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [targetExam, setTargetExam] = useState<any>(null);
  const [form, setForm] = useState({
    title: '',
    course_id: '',
    group_id: '',
    duration_minutes: '',
    passing_score: '',
  });
  const [aiForm, setAiForm] = useState({ topic: '', level: 'medium', count: '10' });
  const [manualForm, setManualForm] = useState({
    text: '',
    o0: '',
    o1: '',
    o2: '',
    o3: '',
    correct: 0,
    level: 'medium',
  });
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [aiGenerating, setAiGenerating] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewData, setReviewData] = useState<any | null>(null);
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [editQForm, setEditQForm] = useState({
    text: '',
    o0: '',
    o1: '',
    o2: '',
    o3: '',
    correct: 0,
    level: 'medium',
  });
  const [noGroupStudents, setNoGroupStudents] = useState<any[]>([]);
  const [selectedIndividualIds, setSelectedIndividualIds] = useState<string[]>([]);

  useEffect(() => {
    fetchExams();
    fetchCourses();
    if (user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'MANAGER') fetchGroups();
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'TEACHER') return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/groups/my-individual-students');
        if (!cancelled) setNoGroupStudents(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setNoGroupStudents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  const filteredNoGroupStudents = useMemo(
    () =>
      noGroupStudents.filter(
        (s: any) => !form.course_id || String(s.course_id) === String(form.course_id),
      ),
    [noGroupStudents, form.course_id],
  );

  useModalOverlayEffects(!!modal, {
    onEscape: () => {
      if (aiGenerating || reviewLoading || resultsLoading) return;
      setModal(null);
    },
  });

  const filtered = exams
    .filter((e: any) => tab === 'all' || e.status?.toLowerCase() === tab)
    .filter((e: any) => e.title?.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openCreate = () => {
    setForm({ title: '', course_id: '', group_id: '', duration_minutes: '30', passing_score: '60' });
    setSelectedIndividualIds([]);
    setModal('create');
  };

  const openEdit = (e: any) => {
    setTargetExam(e);
    setForm({
      title: e.title,
      course_id: e.course_id || '',
      group_id: e.group_id || '',
      duration_minutes: e.duration_minutes?.toString() || '30',
      passing_score: e.passing_score?.toString() || '60',
    });
    setSelectedIndividualIds(Array.isArray(e.individual_student_ids) ? e.individual_student_ids : []);
    setModal('edit');
  };

  const toggleIndividualStudent = (id: string) => {
    setSelectedIndividualIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    if (user?.role === 'TEACHER' && modal === 'create') {
      if (!form.group_id && selectedIndividualIds.length === 0) {
        toast.error("Guruhni tanlang yoki 1–4 tagacha alohida talabani belgilang.");
        return;
      }
      if (selectedIndividualIds.length > 0 && !form.course_id) {
        toast.error('Alohida talabalar uchun avval kursni tanlang.');
        return;
      }
    }
    const payload: Record<string, unknown> = {
      title: form.title,
      course_id: form.course_id,
      duration_minutes: Number(form.duration_minutes),
      passing_score: Number(form.passing_score),
    };
    if (form.group_id) payload.group_id = form.group_id;
    if (modal === 'create' && selectedIndividualIds.length > 0) {
      payload.individual_student_ids = selectedIndividualIds;
    }
    try {
      if (modal === 'create') await createExam(payload as any);
      else if (targetExam) await updateExam(targetExam.id, payload);
      setModal(null);
    } catch (e: any) {
      toast.error(e?.message || 'Saqlashda xatolik');
    }
  };

  const handleAiGenerate = async () => {
    if (!targetExam) return;
    setAiGenerating(true);
    try {
      await generateAiExam(targetExam.id, {
        ...aiForm,
        topic: (aiForm.topic || targetExam.title || '').trim(),
        count: Number(aiForm.count),
        lesson_id: null,
      });
      toast.success('AI savollar yaratildi. Tekshirish uchun «Savollar» ni bosing.');
      setModal(null);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        (Array.isArray(e?.response?.data?.message) ? e.response.data.message.join(', ') : null) ||
        e?.message ||
        'AI xatolik';
      toast.error(typeof msg === 'string' ? msg : 'AI xatolik');
    } finally {
      setAiGenerating(false);
    }
  };

  const loadReview = async (examId: string) => {
    setReviewLoading(true);
    try {
      const data = await fetchExamForManage(examId);
      setReviewData(data);
    } catch (e: any) {
      toast.error(e?.message || 'Imtihon savollarini yuklab bo‘lmadi');
      setReviewData(null);
    } finally {
      setReviewLoading(false);
    }
  };

  const openReview = async (exam: any) => {
    setTargetExam(exam);
    setEditingQId(null);
    setModal('review');
    await loadReview(exam.id);
  };

  const openResults = async (exam: any) => {
    setTargetExam(exam);
    setModal('results');
    setResultsLoading(true);
    try {
      await fetchExamResults(exam.id);
    } finally {
      setResultsLoading(false);
    }
  };

  const startEditQuestion = (q: any) => {
    const opts = Array.isArray(q.options) ? q.options : [];
    const o = [...opts, '', '', '', ''].slice(0, 4).map((x: any) => String(x ?? ''));
    let correct = 0;
    const ca = q.correct_answer;
    if (typeof ca === 'number' && !Number.isNaN(ca)) correct = Math.min(Math.max(0, ca), 3);
    else if (typeof ca === 'string' && /^\d+$/.test(ca)) correct = Math.min(Math.max(0, parseInt(ca, 10)), 3);
    setEditQForm({
      text: q.text || '',
      o0: o[0],
      o1: o[1],
      o2: o[2],
      o3: o[3],
      correct,
      level: q.level || 'medium',
    });
    setEditingQId(q.id);
  };

  const saveEditQuestion = async () => {
    if (!targetExam || !editingQId) return;
    const slots = [editQForm.o0, editQForm.o1, editQForm.o2, editQForm.o3].map((s) =>
      String(s || '').trim(),
    );
    const filled = slots.filter(Boolean);
    if (!editQForm.text.trim() || filled.length < 2) {
      toast.error('Matn va kamida 2 ta variant kerak');
      return;
    }
    const cSlot = editQForm.correct;
    if (cSlot < 0 || cSlot > 3 || !slots[cSlot]) {
      toast.error('To‘g‘ri javob uchun to‘ldirilgan variantni tanlang');
      return;
    }
    const opts = filled;
    const correct_answer = opts.indexOf(slots[cSlot]);
    if (correct_answer < 0) {
      toast.error('To‘g‘ri javob indeksini tekshiring');
      return;
    }
    try {
      await updateExamQuestion(targetExam.id, editingQId, {
        text: editQForm.text.trim(),
        options: opts,
        correct_answer,
        level: editQForm.level,
      });
      toast.success('Savol yangilandi');
      setEditingQId(null);
      await loadReview(targetExam.id);
    } catch (e: any) {
      toast.error(e?.message || 'Saqlashda xatolik');
    }
  };

  const handleApproveOne = async (qid: string) => {
    if (!targetExam) return;
    try {
      await approveExamQuestion(targetExam.id, qid);
      toast.success('Tasdiqlandi');
      await loadReview(targetExam.id);
    } catch (e: any) {
      toast.error(e?.message || 'Tasdiqlashda xatolik');
    }
  };

  const handleApproveAll = async () => {
    if (!targetExam) return;
    const ok = await confirm({
      title: 'Barcha qoralama savollar?',
      message:
        'Draft savollar tasdiqlanadi. Eslatma: tizim imtihonni ham nashr (published) qilishi mumkin.',
      confirmText: 'TASDIQLASH',
      type: 'warning',
    });
    if (!ok) return;
    try {
      await approveAllExamQuestions(targetExam.id);
      toast.success('Barchasi tasdiqlandi');
      await loadReview(targetExam.id);
    } catch (e: any) {
      toast.error(e?.message || 'Xatolik');
    }
  };

  const handleRemoveQuestion = async (qid: string) => {
    if (!targetExam) return;
    const ok = await confirm({
      title: 'Savolni olib tashlash?',
      message: 'Savol imtihondan uziladi (bazadan o‘chmaydi).',
      confirmText: 'OLIB TASHLASH',
      type: 'warning',
    });
    if (!ok) return;
    try {
      await removeQuestionFromExam(targetExam.id, qid);
      toast.success('Olib tashlandi');
      await loadReview(targetExam.id);
    } catch (e: any) {
      toast.error(e?.message || 'Xatolik');
    }
  };

  const openManualQuestion = (exam: any) => {
    setTargetExam(exam);
    setManualForm({ text: '', o0: '', o1: '', o2: '', o3: '', correct: 0, level: 'medium' });
    setModal('manual');
  };

  const handleManualQuestion = async () => {
    if (!targetExam) return;
    try {
      await addManualExamQuestion(targetExam.id, {
        text: manualForm.text,
        options: [manualForm.o0, manualForm.o1, manualForm.o2, manualForm.o3],
        correctIndex: manualForm.correct,
        level: manualForm.level,
      });
      toast.success("Savol qo'shildi");
      setModal(null);
    } catch (e: any) {
      toast.error(e?.message || "Savol qo'shishda xatolik");
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishExam(id);
      toast.success('Imtihon nashr qilindi');
    } catch (e: any) {
      toast.error(e?.message || 'Nashr qilishda xatolik');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Imtihonni o'chirish?",
      message: "Ushbu imtihon va barcha natijalar o'chib ketadi.",
      confirmText: "O'CHIRISH",
      type: 'danger'
    });
    if (ok) await deleteExam(id);
  };

  return (
    <div className="page-container animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="label-subtle mb-1">ACADEMIC EDGE › EXAM MANAGEMENT</p>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Imtihon Boshqaruvi</h1>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Imtihon yaratish
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="label-subtle mb-1">Jami imtihonlar</p>
              <p className="text-3xl font-black text-slate-800">{exams.length}</p>
            </div>
            <span className="stat-badge bg-green-50 text-green-600">+4.2%</span>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Radio className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">{exams.filter((e: any) => e.status === 'active' || e.status === 'published').length}</p>
            <p className="label-subtle">Faol seanslar</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">{exams.filter((e: any) => e.status === 'draft').length}</p>
            <p className="label-subtle">Qoralamalar</p>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="card p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['all', 'active', 'completed', 'draft'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setPage(1); }}
              className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize", tab === t ? "bg-white shadow-sm text-slate-700" : "text-slate-400")}
            >{t === 'all' ? 'Hammasi' : t === 'active' ? 'Faol' : t === 'completed' ? 'Tugatilgan' : 'Qoralama'}</button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Imtihon qidirish..." className="input search-input" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table data-table--compact">
              <thead>
                <tr>
                  <th>Imtihon nomi</th>
                  <th>Guruh</th>
                  <th>Vaqt</th>
                  <th className="text-center whitespace-nowrap">O&apos;rtacha</th>
                  <th>Status</th>
                  <th className="text-center w-[1%] whitespace-nowrap">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((exam: any) => {
                  const st = statusMap[exam.status?.toLowerCase()] || statusMap.draft;
                  const questionCount = Number(exam.question_count) || 0;
                  return (
                    <tr key={exam.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                            <ClipboardList className="w-4 h-4 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-700">{exam.title}</p>
                            <p className="text-[11px] text-slate-400">{questionCount} savol</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`course-badge font-bold ${
                              exam.group_name
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {exam.group_name || 'Guruh tanlanmagan'}
                          </span>
                          {exam.course_name && (
                            <span className="text-[10px] text-slate-400 font-semibold">{exam.course_name}</span>
                          )}
                        </div>
                      </td>
                      <td className="text-xs text-slate-500">{exam.duration_minutes || 30} daqiqa</td>
                      <td className="text-center text-sm font-bold text-slate-600 dark:text-slate-300">
                        {exam.avg_score != null && exam.avg_score !== '' ? `${exam.avg_score}%` : '—'}
                      </td>
                      <td><span className={cn("status-pill", st.cls)}>● {st.label}</span></td>
                      <td className="align-middle w-[1%]">
                        <div className="flex flex-row flex-nowrap items-center justify-end gap-0.5 min-w-[11rem] sm:min-w-0">
                          <button
                            type="button"
                            onClick={() => void openResults(exam)}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-cyan-50 text-cyan-600 dark:hover:bg-cyan-950/40 dark:text-cyan-400"
                            title="Natijalar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {exam.status === 'draft' && (
                            <>
                              <button
                                type="button"
                                onClick={() => openManualQuestion(exam)}
                                className="shrink-0 p-1.5 rounded-lg hover:bg-sky-50 text-sky-600 dark:hover:bg-sky-950/40"
                                title="Qo'lda savol qo'shish"
                              >
                                <PenLine className="w-4 h-4" />
                              </button>
                              <button onClick={() => { setTargetExam(exam); setAiForm({ ...aiForm, topic: exam.title }); setModal('ai'); }} className="shrink-0 p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 dark:hover:bg-indigo-950/40" title="AI Savol Yaratish">
                                <Sparkles className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={questionCount < 1}
                                onClick={() => questionCount >= 1 && void handlePublish(exam.id)}
                                className={cn(
                                  'shrink-0 p-1.5 rounded-lg text-green-600 dark:hover:bg-green-950/40',
                                  questionCount < 1
                                    ? 'cursor-not-allowed opacity-40'
                                    : 'hover:bg-green-50',
                                )}
                                title={
                                  questionCount < 1
                                    ? "Nashr qilish uchun avval kamida bitta savol qo'shing"
                                    : 'Nashr qilish'
                                }
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => void openReview(exam)}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-violet-50 text-violet-600 dark:hover:bg-violet-950/40 dark:text-violet-400"
                            title="Savollar — tekshirish"
                          >
                            <ListChecks className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(exam)} className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 dark:hover:bg-slate-800" title="Tahrirlash">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(exam.id)} className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-red-500 dark:hover:bg-red-950/30" title="O'chirish">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">Imtihonlar topilmadi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-50">
            <span className="text-xs text-slate-400">Sahifa {page} / {totalPages}</span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} type="button" className="btn-pagination"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} className={cn("w-8 h-8 rounded-lg text-xs font-bold", page === n ? "bg-primary-600 text-white" : "hover:bg-slate-100 text-slate-500")}>{n}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} type="button" className="btn-pagination"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Exam results */}
      {modal === 'results' && targetExam && (
        <div className="modal-overlay" onClick={() => !resultsLoading && setModal(null)}>
          <div
            className="modal-content max-h-[85vh] w-full max-w-3xl overflow-hidden p-0 animate-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="min-w-0">
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Natijalar</h2>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{targetExam.title}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  O`tish bali: {targetExam.passing_score ?? 60}% · topshirganlar: {examResults.length}
                </p>
              </div>
              <button
                type="button"
                disabled={resultsLoading}
                onClick={() => setModal(null)}
                className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[calc(85vh-5rem)] overflow-y-auto px-6 py-4">
              {resultsLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : examResults.length === 0 ? (
                <p className="py-12 text-center text-slate-400">Hali natija yo`q</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table data-table--compact w-full">
                    <thead>
                      <tr>
                        <th>O&apos;quvchi</th>
                        <th className="text-center">Ball</th>
                        <th className="text-center">Holat</th>
                        <th className="text-center">To`g`ri / jami</th>
                        <th className="text-right">Vaqt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examResults.map((row: any) => {
                        const passLine = Number(targetExam.passing_score ?? 60);
                        const score = Number(row.score ?? 0);
                        const passed =
                          row.passed === true ||
                          row.passed === 't' ||
                          row.passed === 1 ||
                          (!Number.isNaN(score) && score >= passLine);
                        return (
                          <tr key={row.id || `${row.student_id}-${row.exam_id}`}>
                            <td className="font-semibold text-slate-700 dark:text-slate-200">
                              {row.first_name} {row.last_name}
                            </td>
                            <td className="text-center font-bold text-primary-600 dark:text-primary-400">
                              {Math.round(score)}%
                            </td>
                            <td className="text-center">
                              <span
                                className={cn(
                                  'rounded-md px-2 py-0.5 text-[10px] font-black uppercase',
                                  passed
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
                                )}
                              >
                                {passed ? 'O`tdi' : 'O`tmadi'}
                              </span>
                            </td>
                            <td className="text-center text-xs text-slate-500">
                              {row.correct_count != null ? `${row.correct_count} / ${row.total_questions ?? '—'}` : '—'}
                            </td>
                            <td className="text-right text-xs text-slate-500">
                              {row.time_taken != null ? `${Math.round(Number(row.time_taken) / 60)} daq` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content p-6 animate-in-scale" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black">{modal === 'create' ? 'Yangi Imtihon' : 'Tahrirlash'}</h2>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="input-label">Imtihon nomi</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="Midterm Exam" />
              </div>
              {groups.length > 0 && (user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <div>
                  <label className="input-label">
                    Guruh {user?.role === 'TEACHER' ? '(yoki pastdan alohida talaba)' : '(ixtiyoriy)'}
                  </label>
                  <select
                    value={form.group_id}
                    onChange={(e) => {
                      const gid = e.target.value;
                      const g = groups.find((x: any) => x.id === gid);
                      setForm({
                        ...form,
                        group_id: gid,
                        course_id: g?.course_id ? String(g.course_id) : form.course_id,
                      });
                    }}
                    className="select"
                  >
                    <option value="">
                      {user?.role === 'TEACHER'
                        ? 'Guruh — yoki faqat alohida talaba (pastda)'
                        : 'Barcha kurs o‘quvchilari (guruhsiz)'}
                    </option>
                    {groups.map((g: any) => (
                      <option key={g.id} value={g.id}>
                        {g.name} — {g.course_name || 'Kurs'}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Guruh tanlansa, nashr qilingan imtihon shu guruh a‘zolariga ham ko‘rinadi. Alohida talabalar uchun kursni tanlang.
                  </p>
                </div>
              )}
              <div>
                <label className="input-label">Kurs</label>
                <select
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="select"
                  disabled={!!form.group_id}
                >
                  <option value="">Kursni tanlang</option>
                  {courses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {user?.role === 'TEACHER' && filteredNoGroupStudents.length > 0 && (
                <div>
                  <label className="input-label">Alohida talabalar (maks. 4)</label>
                  <p className="text-[10px] text-slate-400 mb-2">
                    Guruhga kirmagan talabalar. Kurs tanlangan bo‘lsa, ro‘yxat shu kurs bo‘yicha filtrlanadi.
                  </p>
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-100 p-3 dark:border-[var(--border)]">
                    {filteredNoGroupStudents.map((s: any) => (
                      <label key={s.id} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedIndividualIds.includes(s.id)}
                          onChange={() => toggleIndividualStudent(s.id)}
                          disabled={!selectedIndividualIds.includes(s.id) && selectedIndividualIds.length >= 4}
                          className="rounded border-slate-300"
                        />
                        <span>
                          {s.first_name} {s.last_name}
                          {s.course_name ? (
                            <span className="text-slate-400"> — {s.course_name}</span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Vaqt (daqiqa)</label>
                  <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="input-label">O'tish bali (%)</label>
                  <input type="number" value={form.passing_score} onChange={(e) => setForm({ ...form, passing_score: e.target.value })} className="input" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(null)} className="btn-secondary">Bekor qilish</button>
              <button onClick={handleSave} className="btn-primary">{modal === 'create' ? 'Yaratish' : 'Saqlash'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual question */}
      {modal === 'manual' && targetExam && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content p-6 animate-in-scale max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black">Qo'lda savol</h2>
              <button type="button" onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">{targetExam.title}</p>
            <div className="space-y-3">
              <div>
                <label className="input-label">Savol matni</label>
                <textarea
                  value={manualForm.text}
                  onChange={(e) => setManualForm({ ...manualForm, text: e.target.value })}
                  className="input min-h-[88px] resize-y"
                  placeholder="Savolni yozing..."
                />
              </div>
              {['o0', 'o1', 'o2', 'o3'].map((key, i) => (
                <div key={key}>
                  <label className="input-label">Variant {i + 1}</label>
                  <input
                    value={(manualForm as any)[key]}
                    onChange={(e) => setManualForm({ ...manualForm, [key]: e.target.value })}
                    className="input"
                    placeholder={`Javob ${i + 1}`}
                  />
                </div>
              ))}
              <div>
                <label className="input-label">To'g'ri javob</label>
                <select
                  value={manualForm.correct}
                  onChange={(e) => setManualForm({ ...manualForm, correct: Number(e.target.value) })}
                  className="select"
                >
                  <option value={0}>1-variant</option>
                  <option value={1}>2-variant</option>
                  <option value={2}>3-variant</option>
                  <option value={3}>4-variant</option>
                </select>
              </div>
              <div>
                <label className="input-label">Qiyinlik</label>
                <select
                  value={manualForm.level}
                  onChange={(e) => setManualForm({ ...manualForm, level: e.target.value })}
                  className="select"
                >
                  <option value="easy">Oson</option>
                  <option value="medium">O'rtacha</option>
                  <option value="hard">Qiyin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">
                Bekor
              </button>
              <button type="button" onClick={() => void handleManualQuestion()} className="btn-primary">
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {modal === 'ai' && (
        <div className="modal-overlay" onClick={() => !aiGenerating && setModal(null)}>
          <div
            className="modal-content relative p-8 animate-in-scale max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {aiGenerating && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[inherit] bg-white/85 backdrop-blur-sm dark:bg-slate-900/85">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
                <p className="mt-3 text-center text-sm font-bold text-slate-600 dark:text-slate-300">
                  AI savollar yaratilmoqda…
                </p>
                <p className="mt-1 px-6 text-center text-[11px] text-slate-400">
                  Bir necha daqiqa davom etishi mumkin. Iltimos, yopmang.
                </p>
              </div>
            )}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center dark:bg-indigo-950/50">
                <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">AI Savol Yaratish</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="input-label">Mavzu / Kontekst</label>
                <input
                  value={aiForm.topic}
                  disabled={aiGenerating}
                  onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                  className="input"
                  placeholder="Masalan: JavaScript array methods..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Qiyinlik</label>
                  <select
                    value={aiForm.level}
                    disabled={aiGenerating}
                    onChange={(e) => setAiForm({ ...aiForm, level: e.target.value })}
                    className="select font-bold"
                  >
                    <option value="easy">Oson</option>
                    <option value="medium">O'rtacha</option>
                    <option value="hard">Qiyin</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Soni</label>
                  <input
                    type="number"
                    value={aiForm.count}
                    disabled={aiGenerating}
                    onChange={(e) => setAiForm({ ...aiForm, count: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                * AI savollarni yaratib, ularni &quot;Draft&quot; holatida imtihonga qo&apos;shadi. Keyin «Savollar — tekshirish»
                orqali tahrir va tasdiqlash mumkin.
              </p>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                disabled={aiGenerating}
                onClick={() => setModal(null)}
                className="btn-secondary flex-1 py-4 disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={aiGenerating}
                onClick={() => void handleAiGenerate()}
                className="btn-primary flex-1 py-4 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                GENERATE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review questions (AI / manual) — to‘liq balandlik, yopilish animatsiyasi */}
      <AnimatePresence mode="wait">
        {modal === 'review' && targetExam && (
          <motion.div
            key="exam-review"
            className="modal-overlay w-full max-w-full"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !reviewLoading && setModal(null)}
          >
            <motion.div
              className="modal-content modal_content_exam modal-content--screen flex min-h-0 flex-col overflow-hidden p-6 sm:p-7"
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  Savollar — tekshirish
                </h2>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{targetExam.title}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {reviewData?.questions?.some((q: any) => (q.status || '').toLowerCase() === 'draft') && (
                  <button
                    type="button"
                    onClick={() => void handleApproveAll()}
                    className="btn-secondary whitespace-nowrap py-2 text-xs"
                  >
                    Hammasini tasdiqlash
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => !reviewLoading && setModal(null)}
                  className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              {reviewLoading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
                  <p className="mt-3 text-sm text-slate-500">Savollar yuklanmoqda…</p>
                </div>
              )}
              {!reviewLoading && reviewData && (
                <>
                  {(!reviewData.questions || reviewData.questions.length === 0) && (
                    <p className="py-12 text-center text-slate-400">Hozircha savollar yo&apos;q</p>
                  )}
                  {(reviewData.questions?.length ?? 0) > 0 && (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {reviewData.questions!.map((q: any, idx: number) => {
                    const opts = Array.isArray(q.options) ? q.options : [];
                    let ca = q.correct_answer;
                    if (typeof ca === 'string' && /^\d+$/.test(ca)) ca = parseInt(ca, 10);
                    const correctIdx = typeof ca === 'number' && !Number.isNaN(ca) ? ca : 0;
                    const isDraft = (q.status || '').toLowerCase() === 'draft';
                    return (
                      <div
                        key={q.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            #{idx + 1}
                          </span>
                          <span
                            className={cn(
                              'rounded-md px-2 py-0.5 text-[10px] font-black uppercase',
                              isDraft
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
                            )}
                          >
                            {isDraft ? 'Qoralama' : 'Tasdiqlangan'}
                          </span>
                        </div>

                        {editingQId === q.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="input-label">Savol</label>
                              <textarea
                                value={editQForm.text}
                                onChange={(e) => setEditQForm({ ...editQForm, text: e.target.value })}
                                className="input min-h-[80px] resize-y"
                              />
                            </div>
                            {(['o0', 'o1', 'o2', 'o3'] as const).map((key, i) => (
                              <div key={key}>
                                <label className="input-label">Variant {i + 1}</label>
                                <input
                                  value={editQForm[key]}
                                  onChange={(e) =>
                                    setEditQForm({ ...editQForm, [key]: e.target.value })
                                  }
                                  className="input"
                                />
                              </div>
                            ))}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="input-label">To&apos;g&apos;ri javob</label>
                                <select
                                  value={editQForm.correct}
                                  onChange={(e) =>
                                    setEditQForm({ ...editQForm, correct: Number(e.target.value) })
                                  }
                                  className="select"
                                >
                                  <option value={0}>1-variant</option>
                                  <option value={1}>2-variant</option>
                                  <option value={2}>3-variant</option>
                                  <option value={3}>4-variant</option>
                                </select>
                              </div>
                              <div>
                                <label className="input-label">Qiyinlik</label>
                                <select
                                  value={editQForm.level}
                                  onChange={(e) =>
                                    setEditQForm({ ...editQForm, level: e.target.value })
                                  }
                                  className="select"
                                >
                                  <option value="easy">Oson</option>
                                  <option value="medium">O&apos;rtacha</option>
                                  <option value="hard">Qiyin</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingQId(null)}
                                className="btn-secondary"
                              >
                                Bekor
                              </button>
                              <button type="button" onClick={() => void saveEditQuestion()} className="btn-primary">
                                Saqlash
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{q.text}</p>
                            <ul className="mt-2 space-y-1">
                              {opts.map((opt: string, i: number) => (
                                <li
                                  key={i}
                                  className={cn(
                                    'rounded-lg border px-3 py-2 text-xs',
                                    i === correctIdx
                                      ? 'border-emerald-300 bg-emerald-50 font-bold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
                                      : 'border-slate-100 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300',
                                  )}
                                >
                                  {i + 1}. {opt}
                                  {i === correctIdx && (
                                    <CheckCircle className="ml-1 inline h-3.5 w-3.5 text-emerald-600" />
                                  )}
                                </li>
                              ))}
                            </ul>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => startEditQuestion(q)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                              >
                                Tahrirlash
                              </button>
                              {isDraft && (
                                <button
                                  type="button"
                                  onClick={() => void handleApproveOne(q.id)}
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                                >
                                  Tasdiqlash
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => void handleRemoveQuestion(q.id)}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                              >
                                Olib tashlash
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ExamsPage;
