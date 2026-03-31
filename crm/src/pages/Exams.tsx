import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import {
  ClipboardList, Plus, Search, Loader2, Pencil, Trash2, X,
  Play, Eye, ChevronLeft, ChevronRight, Radio, FileText, Sparkles
} from 'lucide-react';

const statusMap: Record<string, { label: string; cls: string }> = {
  draft: { label: 'DRAFT', cls: 'pill-draft' },
  published: { label: 'PUBLISHED', cls: 'pill-published' },
  active: { label: 'ACTIVE', cls: 'pill-active' },
  completed: { label: 'COMPLETED', cls: 'pill-completed' },
};

const ExamsPage: React.FC = () => {
  const { exams, courses, examResults, fetchExams, fetchCourses, createExam, updateExam, deleteExam, publishExam, fetchExamResults, isLoading } = useAdminStore();
  const [modal, setModal] = useState<'create' | 'edit' | 'results' | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({ title: '', course_id: '', duration_minutes: '', passing_score: '' });
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [page, setPage] = useState(1);
  const perPage = 8;

  useEffect(() => { fetchExams(); fetchCourses(); }, []);

  const filtered = exams
    .filter((e: any) => tab === 'all' || e.status?.toLowerCase() === tab)
    .filter((e: any) => e.title?.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openCreate = () => {
    setForm({ title: '', course_id: '', duration_minutes: '30', passing_score: '60' });
    setModal('create');
  };

  const openEdit = (e: any) => {
    setEditTarget(e);
    setForm({
      title: e.title, course_id: e.course_id || '',
      duration_minutes: e.duration_minutes?.toString() || '30',
      passing_score: e.passing_score?.toString() || '60'
    });
    setModal('edit');
  };

  const handleSave = async () => {
    const payload = { ...form, duration_minutes: Number(form.duration_minutes), passing_score: Number(form.passing_score) };
    if (modal === 'create') await createExam(payload);
    else if (editTarget) await updateExam(editTarget.id, payload);
    setModal(null);
  };

  const viewResults = async (examId: string) => {
    await fetchExamResults(examId);
    setModal('results');
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
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Imtihon qidirish..." className="input pl-10" />
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
                  <th>Imtihon nomi</th>
                  <th>Kurs</th>
                  <th>Vaqt</th>
                  <th>Status</th>
                  <th>Natijalar</th>
                  <th className="text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((exam: any) => {
                  const st = statusMap[exam.status?.toLowerCase()] || statusMap.draft;
                  return (
                    <tr key={exam.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                            <ClipboardList className="w-4 h-4 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-700">{exam.title}</p>
                            <p className="text-[11px] text-slate-400">{exam.question_count || 0} savol</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="course-badge bg-primary-50 text-primary-600">{exam.course_name || '—'}</span>
                      </td>
                      <td className="text-xs text-slate-500">{exam.duration_minutes || 30} daqiqa</td>
                      <td><span className={cn("status-pill", st.cls)}>● {st.label}</span></td>
                      <td>
                        {exam.status === 'completed' ?
                          <span className="text-sm font-bold text-green-600">{exam.avg_score || '—'}%</span> :
                          <span className="text-slate-300">—</span>
                        }
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          {exam.status === 'draft' && (
                            <button onClick={() => publishExam(exam.id)} className="p-2 rounded-lg hover:bg-green-50 text-green-600" title="Nashr qilish">
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => viewResults(exam.id)} className="p-2 rounded-lg hover:bg-primary-50 text-primary-600" title="Natijalar">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(exam)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="Tahrirlash">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => { if (confirm("O'chirishni tasdiqlaysizmi?")) deleteExam(exam.id); }} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="O'chirish">
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
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} className={cn("w-8 h-8 rounded-lg text-xs font-bold", page === n ? "bg-primary-600 text-white" : "hover:bg-slate-100 text-slate-500")}>{n}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

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
              <div>
                <label className="input-label">Kurs</label>
                <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className="select">
                  <option value="">Kursni tanlang</option>
                  {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
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

      {/* Results Modal */}
      {modal === 'results' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content p-6 animate-in-scale max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black">Natijalar</h2>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Talaba</th><th>Ball</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {examResults.map((r: any) => (
                    <tr key={r.id}>
                      <td className="font-bold">{r.student_name || `${r.first_name || ''} ${r.last_name || ''}`}</td>
                      <td className="font-bold text-primary-600">{r.score}%</td>
                      <td><span className={cn("status-pill", r.score >= 60 ? 'pill-active' : 'pill-dropped')}>{r.score >= 60 ? 'O\'tdi' : 'Yiqildi'}</span></td>
                    </tr>
                  ))}
                  {examResults.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-slate-400">Natijalar yo'q</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamsPage;
