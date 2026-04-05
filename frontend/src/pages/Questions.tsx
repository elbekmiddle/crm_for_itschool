import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import {
  HelpCircle, Plus, Search, Loader2, Pencil, Trash2, X,
  ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';

import { useToast } from '../context/ToastContext';

const difficultyBars = (d: string) => {
  const m: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
  const level = m[d?.toLowerCase()] || 1;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map(i => (
        <div key={i} className={cn("w-2 h-4 rounded-sm", i <= level ? (level === 3 ? 'bg-red-400' : level === 2 ? 'bg-amber-400' : 'bg-green-400') : 'bg-slate-200')} />
      ))}
    </div>
  );
};

const QuestionsPage: React.FC = () => {
  const { showToast } = useToast();
  const { questions, courses, lessons, fetchCourses, fetchLessons, fetchQuestions, createQuestion, questionStats, fetchQuestionStats, isLoading } = useAdminStore();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', difficulty: 'medium' });
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => { fetchCourses(); fetchQuestionStats(); }, []);

  useEffect(() => {
    if (selectedCourseId) fetchLessons(selectedCourseId);
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedLessonId) fetchQuestions(selectedLessonId);
  }, [selectedLessonId]);

  const filtered = questions.filter((q: any) =>
    q.question_text?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleCreate = async () => {
    if (!selectedLessonId) return showToast('Avval darsni tanlang', 'error');
    try {
      await createQuestion({ ...form, lesson_id: selectedLessonId });
      showToast("Savol muvaffaqiyatli qo'shildi", "success");
      fetchQuestions(selectedLessonId);
      setModal(false);
    } catch (e: any) {
      showToast(e.response?.data?.message || "Xatolik yuz berdi", "error");
    }
  };

  return (
    <div className="page-container animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="label-subtle mb-1">SCHOLAR FLOW › QUESTION BANK</p>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Savollar Banki</h1>
          <p className="text-sm text-slate-400 mt-0.5">Imtihon savollarini boshqaring.</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yangi Savol
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <p className="label-subtle mb-1">Jami savollar</p>
          <p className="text-3xl font-black text-slate-800">{questionStats?.totalQuestions || 0}</p>
        </div>
        <div className="card p-5">
          <p className="label-subtle mb-1">Tekshirish darajasi</p>
          <p className="text-3xl font-black text-slate-800">{questionStats?.checkedRate || 0}%</p>
        </div>
        <div className="card p-5">
          <p className="label-subtle mb-1">Foydalanish</p>
          <p className="text-3xl font-black text-slate-800">{questionStats?.usageCount || 0}</p>
        </div>
        <div className="card p-5">
          <p className="label-subtle mb-1">Kutilmoqda</p>
          <p className="text-3xl font-black text-amber-600">{questionStats?.pendingCount || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-4">
        <select value={selectedCourseId} onChange={(e) => { setSelectedCourseId(e.target.value); setSelectedLessonId(''); }} className="select flex-1">
          <option value="">Kursni tanlang</option>
          {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={selectedLessonId} onChange={(e) => setSelectedLessonId(e.target.value)} className="select flex-1" disabled={!selectedCourseId}>
          <option value="">Darsni tanlang</option>
          {lessons.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Savol qidirish..." className="input pl-10" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Savol</th>
                  <th>Qiyinlik</th>
                  <th>To'g'ri javob</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((q: any, i: number) => (
                  <tr key={q.id}>
                    <td><span className="course-badge bg-primary-50 text-primary-600">Q-{(page - 1) * perPage + i + 1}</span></td>
                    <td>
                      <p className="font-bold text-slate-700 max-w-xs truncate">{q.question_text}</p>
                      <p className="text-[11px] text-slate-400">Multiple Choice · 4 Options</p>
                    </td>
                    <td>{difficultyBars(q.difficulty)}</td>
                    <td className="font-bold text-primary-600 uppercase">{q.correct_answer}</td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-12 text-slate-400">{selectedLessonId ? 'Savollar topilmadi' : 'Kurs va darsni tanlang'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-50">
            <span className="text-xs text-slate-400">Sahifa {page} / {totalPages}</span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} className={cn("w-8 h-8 rounded-lg text-xs font-bold", page === n ? "bg-primary-600 text-white" : "hover:bg-slate-100 text-slate-500")}>{n}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="card p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-700">Smart Tagging</h3>
            <p className="text-xs text-slate-400 mt-1">Scholar Flow AI {Math.floor(questions.length * 0.3)} ta savolda curriculum mapping topgani yo'q.</p>
            <button className="text-xs font-bold text-primary-600 mt-2 hover:underline">Takliflarni ko'rish →</button>
          </div>
        </div>
        <div className="card p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-700">Psychometric Insights</h3>
            <p className="text-xs text-slate-400 mt-1">3 ta savol yuqori discrimination index ko'rsatmoqda.</p>
            <button className="text-xs font-bold text-primary-600 mt-2 hover:underline">Diagnostikani ko'rish →</button>
          </div>
        </div>
      </div>

      {/* Create Question Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content p-6 animate-in-scale max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black">Yangi Savol</h2>
              <button onClick={() => setModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="input-label">Savol matni</label>
                <textarea value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} className="input min-h-[80px] resize-none" placeholder="Savolni yozing..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">A varianti</label>
                  <input value={form.option_a} onChange={(e) => setForm({ ...form, option_a: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="input-label">B varianti</label>
                  <input value={form.option_b} onChange={(e) => setForm({ ...form, option_b: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="input-label">C varianti</label>
                  <input value={form.option_c} onChange={(e) => setForm({ ...form, option_c: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="input-label">D varianti</label>
                  <input value={form.option_d} onChange={(e) => setForm({ ...form, option_d: e.target.value })} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">To'g'ri javob</label>
                  <select value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} className="select">
                    <option value="a">A</option><option value="b">B</option><option value="c">C</option><option value="d">D</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Qiyinlik</label>
                  <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="select">
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(false)} className="btn-secondary">Bekor qilish</button>
              <button onClick={handleCreate} className="btn-primary">Yaratish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionsPage;
