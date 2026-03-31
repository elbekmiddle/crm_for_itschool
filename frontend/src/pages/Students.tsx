import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import {
  GraduationCap, Plus, Download, Search, Loader2,
  Pencil, Trash2, X, UserPlus, ChevronLeft, ChevronRight, Send, Eye
} from 'lucide-react';

const statusPill = (s: string) => {
  const m: Record<string, string> = {
    active: 'pill-active', frozen: 'pill-frozen', dropped: 'pill-dropped', graduated: 'pill-completed',
  };
  return m[s?.toLowerCase()] || 'pill-pending';
};

const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { students, courses, fetchStudents, fetchCourses, createStudent, updateStudent, deleteStudent, enrollStudent, isLoading } = useAdminStore();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [enrollModal, setEnrollModal] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', parent_name: '', parent_phone: '' });
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const [page, setPage] = useState(1);
  const [courseFilter, setCourseFilter] = useState('');
  const perPage = 10;

  useEffect(() => { fetchStudents(); fetchCourses(); }, []);

  const filtered = students.filter((s: any) => {
    const matchesSearch = `${s.first_name} ${s.last_name} ${s.phone}`.toLowerCase().includes(search.toLowerCase());
    const matchesCourse = courseFilter ? s.course_id === courseFilter : true;
    return matchesSearch && matchesCourse;
  });
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openCreate = () => {
    setForm({ first_name: '', last_name: '', phone: '', email: '', parent_name: '', parent_phone: '' });
    setModal('create');
  };

  const openEdit = (s: any) => {
    setEditTarget(s);
    setForm({ first_name: s.first_name, last_name: s.last_name, phone: s.phone, email: s.email || '', parent_name: s.parent_name || '', parent_phone: s.parent_phone || '' });
    setModal('edit');
  };

  const handleSave = async () => {
    if (modal === 'create') await createStudent(form);
    else if (editTarget) await updateStudent(editTarget.id, form);
    setModal(null);
  };

  const handleEnroll = async () => {
    if (enrollModal && enrollCourseId) {
      await enrollStudent(enrollModal.id, enrollCourseId);
      setEnrollModal(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Talabani o'chirishni tasdiqlaysizmi?")) await deleteStudent(id);
  };

  return (
    <div className="page-container animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Talabalar</h1>
          <p className="text-sm text-slate-400 mt-0.5">{filtered.length} ta talaba ro'yxatda</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Talaba qo'shish
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="label-subtle mb-1">Jami ro'yxatga olingan</p>
          <p className="text-3xl font-black text-slate-800">{students.length}</p>
        </div>
        <div className="card p-5">
          <p className="label-subtle mb-1">Faol</p>
          <p className="text-3xl font-black text-green-600">{students.filter((s: any) => s.status === 'active').length}</p>
        </div>
        <div className="card p-5">
          <p className="label-subtle mb-1">Muzlatilgan</p>
          <p className="text-3xl font-black text-blue-600">{students.filter((s: any) => s.status === 'frozen').length}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="card p-4 mb-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Talaba qidirish..."
            className="input pl-10"
          />
        </div>
        <select 
          value={courseFilter} 
          onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }}
          className="select md:w-64"
        >
          <option value="">Barcha kurslar</option>
          {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="text-xs font-bold text-slate-400 whitespace-nowrap">{filtered.length} ta natija</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Talaba</th>
                  <th>Telefon</th>
                  <th>Kurs</th>
                  <th>Guruh</th>
                  <th>Status</th>
                  <th className="text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s: any) => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center text-xs font-black text-primary-600 relative">
                          {s.first_name?.[0]}{s.last_name?.[0]}
                          {s.telegram_chat_id && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#0088cc] rounded-full flex items-center justify-center border-2 border-white shadow-sm" title={`Telegram: @${s.telegram_username || s.telegram_chat_id}`}>
                              <Send className="w-2 h-2 text-white fill-current" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">{s.first_name} {s.last_name}</p>
                          <p className="text-[11px] text-slate-400">{s.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{s.phone}</td>
                    <td>{s.course_name || <span className="text-slate-300">—</span>}</td>
                    <td>
                      {s.group_name ? (
                        <span className="course-badge bg-primary-50 text-primary-600">{s.group_name}</span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td><span className={cn("status-pill", statusPill(s.status))}>{s.status || 'active'}</span></td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/student/${s.id}`)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-all" title="Ko'rish">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEnrollModal(s); setEnrollCourseId(''); }} className="p-2 rounded-lg hover:bg-primary-50 text-primary-600 transition-all" title="Kursga yozish">
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-all" title="Tahrirlash">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-all" title="O'chirish">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">Talabalar topilmadi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-50">
            <span className="text-xs text-slate-400">Sahifa {page} / {totalPages}</span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} className={cn("w-8 h-8 rounded-lg text-xs font-bold", page === n ? "bg-primary-600 text-white" : "hover:bg-slate-100 text-slate-500")}>
                  {n}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content p-6 animate-in-scale" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-800">{modal === 'create' ? "Yangi talaba" : "Tahrirlash"}</h2>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Ism</label>
                  <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="input" placeholder="Ahmad" />
                </div>
                <div>
                  <label className="input-label">Familiya</label>
                  <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="input" placeholder="Karimov" />
                </div>
              </div>
              <div>
                <label className="input-label">Telefon</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="+998901234567" />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="talaba@email.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Ota-ona ismi</label>
                  <input value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="input-label">Ota-ona telefoni</label>
                  <input value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} className="input" />
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

      {/* Enroll Modal */}
      {enrollModal && (
        <div className="modal-overlay" onClick={() => setEnrollModal(null)}>
          <div className="modal-content p-6 animate-in-scale" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-800">Kursga yozish</h2>
              <button onClick={() => setEnrollModal(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              <strong>{enrollModal.first_name} {enrollModal.last_name}</strong> ni kursga yozish
            </p>
            <select value={enrollCourseId} onChange={(e) => setEnrollCourseId(e.target.value)} className="select">
              <option value="">Kursni tanlang</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEnrollModal(null)} className="btn-secondary">Bekor qilish</button>
              <button onClick={handleEnroll} disabled={!enrollCourseId} className="btn-primary">Yozish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
