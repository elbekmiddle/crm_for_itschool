import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import {
  Plus, Download, Search, Loader2,
  Pencil, Trash2, X, UserPlus, ChevronLeft, ChevronRight, Send, Eye
} from 'lucide-react';

import api from '../lib/api';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { useModalOverlayEffects } from '../hooks/useModalOverlayEffects';

const statusPill = (s: string) => {
  const m: Record<string, string> = {
    active: 'pill-active', frozen: 'pill-frozen', dropped: 'pill-dropped', graduated: 'pill-completed',
  };
  return m[s?.toLowerCase()] || 'pill-pending';
};

const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const { user, students, courses, fetchStudents, fetchCourses, createStudent, updateStudent, deleteStudent, enrollStudent, isLoading } = useAdminStore();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [enrollModal, setEnrollModal] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    parent_name: '',
    parent_phone: '',
    status: 'active',
    study_type: 'group',
    course_id: '',
  });
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const [page, setPage] = useState(1);
  const [courseFilter, setCourseFilter] = useState('');
  const perPage = 10;

  useModalOverlayEffects(!!modal || !!enrollModal, {
    onEscape: () => {
      if (enrollModal) setEnrollModal(null);
      else setModal(null);
    },
  });

  useEffect(() => { fetchStudents(); fetchCourses(); }, []);

  const filtered = students.filter((s: any) => {
    const matchesSearch = `${s.first_name} ${s.last_name} ${s.phone}`.toLowerCase().includes(search.toLowerCase());
    const matchesCourse =
      !courseFilter || String(s.course_id ?? '') === String(courseFilter);
    return matchesSearch && matchesCourse;
  });
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openCreate = () => {
    setForm({
      first_name: '',
      last_name: '',
      phone: '',
      parent_name: '',
      parent_phone: '',
      status: 'active',
      study_type: 'group',
      course_id: '',
    });
    setModal('create');
  };

  const openEdit = (s: any) => {
    setEditTarget(s);
    setForm({
      first_name: s.first_name,
      last_name: s.last_name,
      phone: s.phone,
      parent_name: s.parent_name || '',
      parent_phone: s.parent_phone || '',
      status: s.status || 'active',
      study_type: s.study_type || 'group',
      course_id: s.course_id || '',
    });
    setModal('edit');
  };

  const normalizePhone = (p: string) => {
    let clean = p.replace(/\D/g, '');
    if (!clean) return '';
    if (clean.length === 9) return '+998' + clean;
    if (clean.length === 12 && clean.startsWith('998')) return '+' + clean;
    return p.startsWith('+') ? p : '+' + p;
  };

  const handleSave = async () => {
    if (modal === 'create' && (user?.role === 'MANAGER' || user?.role === 'ADMIN') && !form.course_id) {
      showToast('Talabani kursga biriktirish uchun kursni tanlang', 'error');
      return;
    }
    const data = {
      ...form,
      phone: normalizePhone(form.phone),
      parent_phone: normalizePhone(form.parent_phone),
    };
    try {
      if (modal === 'create') {
        await createStudent(data);
        showToast("O'quvchi muvaffaqiyatli yaratildi", "success");
      } else if (editTarget) {
        await updateStudent(editTarget.id, data);
        if ((user?.role === 'MANAGER' || user?.role === 'ADMIN') && form.course_id) {
          const prev = String(editTarget.course_id || '').trim();
          const next = String(form.course_id || '').trim();
          if (next && prev !== next) {
            if (prev) {
              await api.post(`/students/${editTarget.id}/transfer-course`, {
                old_course_id: prev,
                new_course_id: next,
              });
            } else {
              await enrollStudent(editTarget.id, next);
            }
          }
        }
        await fetchStudents();
        showToast("Ma'lumotlar yangilandi", "success");
      }
      setModal(null);
    } catch (e: any) {
      showToast(e.response?.data?.message || "Xatolik yuz berdi", "error");
    }
  };

  const handleEnroll = async () => {
    if (enrollModal && enrollCourseId) {
      try {
        await enrollStudent(enrollModal.id, enrollCourseId);
        showToast("O'quvchi kursga muvaffaqiyatli yozildi!", "success");
        setEnrollModal(null);
      } catch (e: any) {
        const msg = e.response?.data?.message || "Kursga yozishda xatolik yuz berdi";
        showToast(msg, "error");
      }
    }
  };

  const openStudentProfile = (studentId: string) => {
    if (user?.role === 'MANAGER' || user?.role === 'ADMIN') navigate(`/manager/students/${studentId}`);
    else if (user?.role === 'TEACHER') navigate(`/teacher/students/${studentId}`);
    else navigate('/student/profile');
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "O'chirishni tasdiqlaysizmi?",
      message: "Ushbu talaba ma'lumotlari butunlay o'chiriladi.",
      confirmText: "O'CHIRISH",
      type: 'danger'
    });
    if (ok) {
      try {
        await deleteStudent(id);
        showToast("O'quvchi tizimdan o'chirildi", "success");
      } catch (e: any) {
        showToast("O'chirishda xatolik yuz berdi", "error");
      }
    }
  };

  return (
    <div className="page-container animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight text-uz">Talabalar</h1>
          <p className="text-sm text-slate-400 mt-0.5">{filtered.length} ta talaba ro'yxatda</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Eksport
          </button>
          {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Talaba qo'shish
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="card mb-4 flex flex-col gap-4 p-4 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1 isolate">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 z-[2] h-4 w-4 -translate-y-1/2 text-slate-400 opacity-80" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Talaba qidirish..."
            className="input search-input w-full transition-[border-color,box-shadow] duration-200"
          />
        </div>
        <div className="w-full shrink-0 md:w-72">
          <select
            value={courseFilter}
            onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }}
            className="select filter-select w-full transition-[border-color] duration-200"
          >
            <option value="">Barcha kurslar</option>
            {courses.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <span className="whitespace-nowrap text-xs font-bold text-slate-400">{filtered.length} ta natija</span>
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
                  <th>Bu oy to‘lovi</th>
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
                          <p className="font-bold text-slate-800 dark:text-[var(--text-h)]">{s.first_name} {s.last_name}</p>
                          {s.parent_name ? (
                            <p className="text-[11px] text-slate-500 dark:text-[var(--text)]">{s.parent_name}</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-slate-600 dark:text-[var(--text)]">{s.phone}</td>
                    <td className="text-slate-800 dark:text-[var(--text-h)]">{s.course_name?.trim() ? s.course_name : '—'}</td>
                    <td>
                      {s.group_name?.trim() ? (
                        <span className="course-badge bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">{s.group_name}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-[var(--text)]">—</span>
                      )}
                    </td>
                    <td>
                      {s.paid_this_month ? (
                        <span className="inline-flex rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">
                          To‘langan
                        </span>
                      ) : (
                        <span className="inline-flex rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800 dark:text-amber-400">
                          Yo‘q
                        </span>
                      )}
                    </td>
                    <td><span className={cn("status-pill", statusPill(s.status))}>{s.status || 'active'}</span></td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => openStudentProfile(s.id)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[var(--hover-bg)] text-slate-500 dark:text-[var(--text)] transition-colors duration-200" title="Ko'rish">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => { setEnrollModal(s); setEnrollCourseId(''); }} className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 transition-colors duration-200" title="Kursga yozish">
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[var(--hover-bg)] text-slate-500 dark:text-[var(--text)] transition-colors duration-200" title="Tahrirlash">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors duration-200" title="O'chirish">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400">Talabalar topilmadi</td></tr>
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
              <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-pagination">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} className={cn("w-8 h-8 rounded-lg text-xs font-bold", page === n ? "bg-primary-600 text-white" : "hover:bg-slate-100 text-slate-500")}>
                  {n}
                </button>
              ))}
              <button type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-pagination">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Holati</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="select">
                    <option value="active">Faol</option>
                    <option value="frozen">Muzlatilgan</option>
                    <option value="dropped">Chiqib ketgan</option>
                    <option value="graduated">Tugatgan</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Ta'lim turi</label>
                  <select value={form.study_type} onChange={(e) => setForm({ ...form, study_type: e.target.value })} className="select">
                    <option value="group">Guruhli</option>
                    <option value="individual">Individual</option>
                  </select>
                </div>
              </div>
              {(modal === 'create' || modal === 'edit') && (user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                <div>
                  <label className="input-label">{modal === 'create' ? 'Kursga yozilish *' : 'Faol kurs'}</label>
                  <select
                    value={form.course_id}
                    onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                    className="select"
                  >
                    <option value="">{modal === 'create' ? 'Kursni tanlang' : 'Kurs tanlanmagan'}</option>
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">O‘qituvchi o‘z kursidagi talabalarni shu bo‘yicha ko‘radi.</p>
                </div>
              )}
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
