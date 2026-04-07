import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import { formatPersonName, formatInitials } from '../lib/displayName';
import MiniGrowthChart from '../components/charts/MiniGrowthChart';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { Plus, Loader2, Pencil, Trash2, X, Shield, CheckCircle2 } from 'lucide-react';

import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

const MAX_TEACHER_COURSES = 5;

function normalizeTeacherCourseIds(u: any): string[] {
  const raw = u?.teacher_course_ids;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  return [];
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-50 text-red-600 border-red-200',
  MANAGER: 'bg-amber-50 text-amber-600 border-amber-200',
  TEACHER: 'bg-primary-50 text-primary-600 border-primary-200',
};

const UsersPage: React.FC<{ roleFilter?: string }> = ({ roleFilter }) => {
  const {
    users,
    courses,
    stats,
    fetchUsers,
    fetchCourses,
    fetchStats,
    createUser,
    updateUser,
    deleteUser,
    isLoading,
  } = useAdminStore();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    role: roleFilter || 'TEACHER',
    course_ids: [] as string[],
  });

  const filteredUsers = roleFilter ? users.filter((u: any) => u.role === roleFilter) : users;

  const [rows, setRows] = useState<any[]>([]);
  const suspendRowsSyncRef = useRef(false);
  const pendingDeleteIdRef = useRef<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (suspendRowsSyncRef.current) return;
    setRows(filteredUsers);
  }, [filteredUsers]);

  const openCreate = () => {
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      role: 'TEACHER',
      course_ids: [],
    });
    setModal('create');
  };

  const openEdit = (u: any) => {
    setEditTarget(u);
    setForm({
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email || '',
      phone: u.phone || '',
      password: '',
      role: u.role,
      course_ids: normalizeTeacherCourseIds(u),
    });
    setModal('edit');
  };

  const toggleCourse = (courseId: string) => {
    setForm((f) => {
      if (f.role !== 'TEACHER') return f;
      const next = new Set(f.course_ids);
      if (next.has(courseId)) next.delete(courseId);
      else if (next.size < MAX_TEACHER_COURSES) next.add(courseId);
      return { ...f, course_ids: [...next] };
    });
  };

  const normalizePhone = (p: string) => {
    let clean = p.replace(/\D/g, '');
    if (clean.length === 9) return '+998' + clean;
    if (clean.length === 12 && clean.startsWith('998')) return '+' + clean;
    return p.startsWith('+') ? p : '+' + p;
  };

  const handleSave = async () => {
    const data: any = { ...form, phone: normalizePhone(form.phone) };
    if (form.role !== 'TEACHER') delete data.course_ids;
    try {
      if (modal === 'create') await createUser(data);
      else if (editTarget) {
        const payload: any = { ...data };
        if (!payload.password) delete payload.password;
        await updateUser(editTarget.id, payload);
      }
      setModal(null);
      showToast(modal === 'create' ? 'Foydalanuvchi yaratildi' : 'Saqlandi', 'success');
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      showToast(typeof msg === 'string' ? msg : 'Saqlashda xatolik', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Foydalanuvchini o'chirish?",
      message: "Ushbu foydalanuvchi tizimdan butunlay o'chiriladi.",
      confirmText: "O'CHIRISH",
      type: 'danger',
    });
    if (!ok) return;
    pendingDeleteIdRef.current = id;
    suspendRowsSyncRef.current = true;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const onDeleteExitComplete = () => {
    const id = pendingDeleteIdRef.current;
    pendingDeleteIdRef.current = null;
    if (!id) {
      suspendRowsSyncRef.current = false;
      return;
    }
    deleteUser(id)
      .then(() => showToast("Foydalanuvchi o'chirildi", 'success'))
      .catch(() => {
        showToast("O'chirishda xatolik", 'error');
        const u = useAdminStore.getState().users;
        setRows(roleFilter ? u.filter((x: any) => x.role === roleFilter) : u);
      })
      .finally(() => {
        suspendRowsSyncRef.current = false;
      });
  };

  return (
    <div className="page-container animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight dark:text-white">Foydalanuvchilar</h1>
          <p className="text-sm text-slate-400 mt-0.5">IT School jamoasi va rollar.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2 cursor-pointer transition-transform duration-200 hover:scale-[1.02]">
            <Plus className="w-4 h-4" /> Foydalanuvchi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 min-h-0 flex">
          <MiniGrowthChart
            trend={stats?.growthTrend}
            title="O'sish tendentsiyasi"
            subtitle="Yangi ro'yxatga olishlar (so'nggi 6 oy)"
            height={240}
            className="flex-1 w-full"
          />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="card p-6 border border-[var(--border)] bg-[var(--bg-card)]">
            <h2 className="section-title mb-4">Tezkor ko'rinish</h2>
            <div className="space-y-3">
              {filteredUsers.slice(0, 4).map((u: any) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-[var(--hover-bg)] border border-transparent hover:border-[var(--border)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center text-xs font-black text-primary-600 overflow-hidden shrink-0">
                      {resolveMediaUrl(u.photo_url) ? (
                        <img src={resolveMediaUrl(u.photo_url)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{formatInitials(u.first_name, u.last_name, u.email)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700 dark:text-[var(--text-h)] truncate">
                        {formatPersonName(u.first_name, u.last_name, u.email)}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <span className={cn('status-pill shrink-0', roleColors[u.role] || 'pill-active')}>{u.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card p-5 text-center">
              <Shield className="w-6 h-6 text-primary-500 mx-auto mb-2" />
              <p className="label-subtle">Faol rollar</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{new Set(users.map((u: any) => u.role)).size}</p>
            </div>
            <div className="card p-5 text-center">
              <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="label-subtle">Tasdiqlangan</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-50">
          <h2 className="section-title">Foydalanuvchilar ro'yxati</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Ism</th><th>Email</th><th>Telefon</th><th>Rol</th><th className="text-right">Amallar</th></tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout" onExitComplete={onDeleteExitComplete}>
                  {rows.map((u: any) => (
                    <motion.tr
                      key={u.id}
                      layout
                      initial={false}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-xs font-black text-primary-600 overflow-hidden">
                            {resolveMediaUrl(u.photo_url) ? (
                              <img src={resolveMediaUrl(u.photo_url)} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <span>{formatInitials(u.first_name, u.last_name, u.email)}</span>
                            )}
                          </div>
                          <p className="font-bold text-slate-700 dark:text-[var(--text-h)]">
                            {formatPersonName(u.first_name, u.last_name, u.email)}
                          </p>
                        </div>
                      </td>
                      <td className="text-xs text-slate-500">{u.email}</td>
                      <td className="font-mono text-xs">{u.phone}</td>
                      <td>
                        <span className={cn('status-pill', roleColors[u.role] || 'pill-active')}>{u.role}</span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[var(--hover-bg)] text-slate-500 transition-colors duration-200"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(u.id)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content p-6 animate-in-scale" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black">{modal === 'create' ? 'Yangi foydalanuvchi' : 'Tahrirlash'}</h2>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="input-label">Ism</label><input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="input" /></div>
                <div><label className="input-label">Familiya</label><input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="input" /></div>
              </div>
              <div><label className="input-label">Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" /></div>
              <div><label className="input-label">Telefon</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" /></div>
              <div><label className="input-label">Parol {modal === 'edit' && '(bo\'sh qoldiring — o\'zgarmaydi)'}</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" /></div>
              <div>
                <label className="input-label">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="select transition-[border-color] duration-200"
                >
                  <option value="TEACHER">Teacher</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {form.role === 'TEACHER' && (
                <div>
                  <label className="input-label">Kurslar (maks. {MAX_TEACHER_COURSES})</label>
                  <p className="text-[11px] text-slate-400 mb-2">O'qituvchiga biriktiriladigan kurslar</p>
                  <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 dark:border-[var(--border)] bg-[var(--bg-card)] p-3 space-y-2">
                    {courses.length === 0 ? (
                      <p className="text-xs text-slate-400">Kurslar yuklanmoqda...</p>
                    ) : (
                      courses.map((c: any) => {
                        const checked = form.course_ids.includes(c.id);
                        const atLimit = form.course_ids.length >= MAX_TEACHER_COURSES && !checked;
                        return (
                          <label
                            key={c.id}
                            className={cn(
                              'flex items-center gap-3 text-sm cursor-pointer rounded-lg px-2 py-1.5 transition-colors duration-200',
                              atLimit ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-[var(--hover-bg)]',
                            )}
                          >
                            <input
                              type="checkbox"
                              className="rounded border-slate-300"
                              checked={checked}
                              disabled={atLimit}
                              onChange={() => toggleCourse(c.id)}
                            />
                            <span className="truncate text-slate-700 dark:text-[var(--text)]">{c.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
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
    </div>
  );
};

export default UsersPage;
