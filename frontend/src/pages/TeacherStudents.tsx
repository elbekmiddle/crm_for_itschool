import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/useAdminStore';
import { useToast } from '../context/ToastContext';
import { GraduationCap, Loader2, Phone, Plus, X } from 'lucide-react';

const TeacherStudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, students, courses, fetchStudents, fetchCourses, createStudent, isLoading } = useAdminStore();
  const [courseFilter, setCourseFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    parent_name: '',
    parent_phone: '',
    course_id: '',
  });

  useEffect(() => {
    fetchStudents(1, 400, true);
    fetchCourses();
  }, [fetchStudents, fetchCourses]);

  useEffect(() => {
    if (!modal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modal]);

  const myCourseOptions = useMemo(() => {
    const uid = user?.id ? String(user.id) : '';
    return (courses || []).filter((c: any) => c?.teacher_id && String(c.teacher_id) === uid);
  }, [courses, user?.id]);

  const courseById = useMemo(() => {
    const m = new Map<string, string>();
    (courses || []).forEach((c: any) => {
      if (c?.id != null) m.set(String(c.id), c.name || '');
    });
    return m;
  }, [courses]);

  const sorted = useMemo(() => {
    const list = (students || []).filter((s: any) => {
      if (!courseFilter) return true;
      return String(s.course_id ?? '') === String(courseFilter);
    });
    return [...list].sort((a: any, b: any) => {
      const an = `${a.first_name || ''} ${a.last_name || ''}`.trim();
      const bn = `${b.first_name || ''} ${b.last_name || ''}`.trim();
      return an.localeCompare(bn, 'uz');
    });
  }, [students, courseFilter]);

  const normalizePhone = (p: string) => {
    let clean = p.replace(/\D/g, '');
    if (!clean) return '';
    if (clean.length === 9) return '+998' + clean;
    if (clean.length === 12 && clean.startsWith('998')) return '+' + clean;
    return p.startsWith('+') ? p : '+' + p;
  };

  const openCreate = () => {
    setForm({
      first_name: '',
      last_name: '',
      phone: '',
      parent_name: '',
      parent_phone: '',
      course_id: myCourseOptions[0]?.id ? String(myCourseOptions[0].id) : '',
    });
    setModal(true);
  };

  const handleSaveStudent = async () => {
    if (!form.course_id) {
      showToast('Kursni tanlang', 'error');
      return;
    }
    if (!form.first_name?.trim() || !form.last_name?.trim() || !form.phone?.trim()) {
      showToast('Ism, familiya va telefon majburiy', 'error');
      return;
    }
    try {
      await createStudent({
        ...form,
        phone: normalizePhone(form.phone),
        parent_phone: normalizePhone(form.parent_phone),
      });
      await fetchStudents(1, 400, true);
      showToast("Talaba qo'shildi", 'success');
      setModal(false);
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Xatolik', 'error');
    }
  };

  return (
    <div className="page-container animate-in">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="label-subtle mb-1">O‘QITUVCHI › TALABALAR</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-[var(--text-h)]">
            O‘quvchilarim
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Sizning kurslaringizga yozilgan talabalar. Jadvalda avatar yo‘q — ro‘yxat yengil yuklanadi.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {myCourseOptions.length > 0 && (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="select min-w-[200px] text-sm font-bold"
            >
              <option value="">Barcha kurslar</option>
              {myCourseOptions.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            Talaba qo‘shish
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 dark:border-[var(--border)] dark:bg-[var(--bg-muted)]">
            <GraduationCap className="h-5 w-5 text-primary-500" />
            <span className="text-sm font-black text-slate-700 dark:text-[var(--text-h)]">{sorted.length} talaba</span>
          </div>
        </div>
      </div>

      {modal &&
        createPortal(
          <div
            className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50 p-4 py-8 backdrop-blur-sm"
            role="presentation"
            onClick={() => setModal(false)}
            onKeyDown={(e) => e.key === 'Escape' && setModal(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="teacher-add-student-title"
              className="card my-auto max-h-[min(90vh,calc(100dvh-2rem))] w-full max-w-md overflow-y-auto border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 id="teacher-add-student-title" className="text-lg font-black text-[var(--text-h)]">
                  Yangi talaba
                </h2>
                <button type="button" onClick={() => setModal(false)} className="rounded-xl p-2 hover:bg-[var(--hover-bg)]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="input-label">Kurs</label>
                  <select
                    value={form.course_id}
                    onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                    className="select w-full"
                  >
                    <option value="">Tanlang</option>
                    {myCourseOptions.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Ism</label>
                  <input className="input w-full" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Familiya</label>
                  <input className="input w-full" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Telefon</label>
                  <input className="input w-full" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998..." />
                </div>
                <div>
                  <label className="input-label">Ota-ona (ixtiyoriy)</label>
                  <input className="input w-full" value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Ota-ona telefoni (ixtiyoriy)</label>
                  <input className="input w-full" value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setModal(false)}>
                  Bekor
                </button>
                <button type="button" className="btn-primary" onClick={handleSaveStudent}>
                  Saqlash
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">Hozircha talabalar yo‘q</div>
      ) : (
        <div className="card overflow-hidden border border-slate-200/80 dark:border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:border-[var(--border)] dark:bg-[var(--bg-muted)] dark:text-slate-400">
                  <th className="px-4 py-3">Ism familiya</th>
                  <th className="px-4 py-3">Otasining ismi</th>
                  <th className="px-4 py-3">Telefon</th>
                  <th className="px-4 py-3">Kurs</th>
                  <th className="px-4 py-3">Guruh</th>
                  <th className="px-4 py-3">Bu oy to‘lovi</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s: any) => {
                  const cid = s.course_id != null ? String(s.course_id) : '';
                  const courseName = cid ? courseById.get(cid) || '—' : '—';
                  const gn = (s.group_name || '').trim();
                  const groupLabel = gn ? gn : 'Individual';
                  const paid = Boolean(s.paid_this_month);
                  return (
                    <tr
                      key={s.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/teacher/students/${s.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/teacher/students/${s.id}`);
                        }
                      }}
                      className="cursor-pointer border-b border-slate-100 transition-colors duration-200 hover:bg-primary-500/5 dark:border-[var(--border)] dark:hover:bg-[var(--hover-bg)]"
                    >
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-[var(--text-h)]">
                        {s.first_name} {s.last_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-[var(--text)]">
                        {s.parent_name?.trim() ? s.parent_name : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 shrink-0 opacity-60" />
                          {s.phone || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-[var(--text)]">{courseName}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-[var(--text)]">
                        <span
                          className={
                            gn
                              ? 'font-semibold text-slate-700 dark:text-[var(--text-h)]'
                              : 'rounded-md border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:border-[var(--border)] dark:text-slate-400'
                          }
                        >
                          {groupLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            paid
                              ? 'inline-flex rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400'
                              : 'inline-flex rounded-lg border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-400'
                          }
                        >
                          {paid ? 'To‘langan' : 'Yo‘q / tekshiring'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherStudentsPage;
