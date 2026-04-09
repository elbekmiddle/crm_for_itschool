import React, { useEffect, useMemo, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import {
  BookOpen, Plus, Search, Loader2, Pencil, Trash2, X, Users, CheckCircle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import MiniGrowthChart from '../components/charts/MiniGrowthChart';
import { useModalOverlayEffects } from '../hooks/useModalOverlayEffects';

const CoursesPage: React.FC = () => {
  const { user, courses, fetchCourses, fetchStats, stats, createCourse, updateCourse, deleteCourse, isLoading } = useAdminStore();
  const isManager = user?.role === 'MANAGER';
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration_months: '' });
  const [search, setSearch] = useState('');

  useModalOverlayEffects(!!modal, { onEscape: () => setModal(null) });

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, []);

  const filtered = courses.filter((c: any) => c.name?.toLowerCase().includes(search.toLowerCase()));

  const totalStudentsOnCourses = useMemo(
    () => courses.reduce((a: number, c: any) => a + Number(c.student_count ?? 0), 0),
    [courses],
  );

  const openCreate = () => {
    setForm({ name: '', description: '', price: '', duration_months: '' });
    setModal('create');
  };

  const openEdit = (c: any) => {
    setEditTarget(c);
    setForm({
      name: c.name,
      description: c.description || '',
      price: c.price != null ? String(c.price) : '',
      duration_months: c.duration_months != null ? String(c.duration_months) : '',
    });
    setModal('edit');
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price),
      duration_months: form.duration_months ? Number(form.duration_months) : undefined,
    };
    try {
      if (modal === 'create') {
        await createCourse(payload);
        showToast('Kurs muvaffaqiyatli yaratildi', 'success');
      } else if (editTarget) {
        await updateCourse(editTarget.id, payload);
        showToast('Kurs yangilandi', 'success');
      }
      setModal(null);
      await fetchStats();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Saqlashda xatolik';
      showToast(typeof msg === 'string' ? msg : 'Saqlashda xatolik', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Kursni o'chirish?",
      message: "Ushbu kurs barcha darslari va talabalari bog'liqligi bilan o'chirilishi mumkin.",
      confirmText: "O'CHIRISH",
      type: 'danger',
    });
    if (ok) {
      try {
        await deleteCourse(id);
        showToast("Kurs o'chirildi", 'success');
        await fetchStats();
      } catch {
        showToast("O'chirishda xatolik", 'error');
      }
    }
  };

  return (
    <div className="page-container animate-in">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-[var(--text-h)]">Kurs Boshqaruvi</h1>
          <p className="mt-0.5 text-sm text-slate-400">O'quv yo'nalishlarini boshqaring.</p>
        </div>
        {!isManager && (
          <button
            onClick={openCreate}
            className="btn-primary flex items-center gap-2 transition-transform duration-200 hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" /> Yangi Kurs
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="card p-5 transition-shadow duration-200 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 dark:bg-[var(--accent-bg)]">
              <BookOpen className="h-5 w-5 text-primary-600 dark:text-[var(--accent)]" />
            </div>
            <div>
              <p className="label-subtle">Faol kurslar</p>
              <p className="text-2xl font-black tabular-nums text-slate-800 dark:text-[var(--text-h)]">{courses.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5 transition-shadow duration-200 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 dark:bg-emerald-950/30">
              <Users className="h-5 w-5 text-green-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="label-subtle">Jami talabalar</p>
              <p className="text-2xl font-black tabular-nums text-slate-800 dark:text-[var(--text-h)]">{totalStudentsOnCourses}</p>
            </div>
          </div>
        </div>
        <div className="card p-5 transition-shadow duration-200 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
              <CheckCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="label-subtle">O'rt. Davomat</p>
              <p className="text-2xl font-black tabular-nums text-slate-800 dark:text-[var(--text-h)]">94%</p>
            </div>
          </div>
        </div>
        <div className="card p-5 transition-shadow duration-200 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="label-subtle">Kreditlar</p>
              <p className="text-2xl font-black tabular-nums text-slate-800 dark:text-[var(--text-h)]">{courses.length * 24}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 w-full min-h-[200px]">
        <MiniGrowthChart
          trend={stats?.growthTrend}
          title="Ro'yxatga olishlar"
          subtitle="So'nggi oylar (tizim bo'yicha)"
          height={220}
          className="h-full w-full min-h-[200px]"
        />
      </div>

      {/* Search */}
      <div className="card mb-4 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-slate-400 opacity-80" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kurs qidirish..."
            className="input search-input w-full transition-[border-color,box-shadow] duration-200"
          />
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course: any) => (
            <div
              key={course.id}
              className="card-hover p-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-[var(--accent-bg)]">
                  <BookOpen className="h-6 w-6 text-primary-600 dark:text-[var(--accent)]" />
                </div>
                <span className="status-pill pill-active">● ACTIVE</span>
              </div>
              <h3 className="mb-1 text-base font-bold text-slate-800 dark:text-[var(--text-h)]">{course.name}</h3>
              <p className="mb-4 line-clamp-2 text-xs text-slate-400">{course.description || 'Kurs tafsilotlari...'}</p>

              <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="label-subtle">O'qituvchi</p>
                  <p className="mt-0.5 font-bold text-slate-600 dark:text-[var(--text)]">
                    {course.teacher_name?.trim() ? course.teacher_name : '—'}
                  </p>
                </div>
                <div>
                  <p className="label-subtle">Talabalar</p>
                  <p className="mt-0.5 font-bold tabular-nums text-slate-600 dark:text-[var(--text)]">
                    {Number(course.student_count ?? 0)} ta
                  </p>
                </div>
                <div>
                  <p className="label-subtle">Narxi</p>
                  <p className="mt-0.5 font-bold tabular-nums text-slate-600 dark:text-[var(--text)]">
                    {course.price != null && course.price !== ''
                      ? `${Number(course.price).toLocaleString('uz-UZ')} so'm`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="label-subtle">Davomiyligi</p>
                  <p className="mt-0.5 font-bold tabular-nums text-slate-600 dark:text-[var(--text)]">
                    {course.duration_months != null && course.duration_months !== '' ? `${course.duration_months} oy` : '—'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 border-t border-slate-50 pt-3 dark:border-[var(--border)]">
                <button
                  onClick={() => openEdit(course)}
                  className="btn-ghost btn-sm flex flex-1 items-center justify-center gap-1 transition-colors duration-200"
                >
                  <Pencil className="h-3.5 w-3.5" /> Tahrirlash
                </button>
                <button
                  onClick={() => handleDelete(course.id)}
                  className="btn-ghost btn-sm flex items-center justify-center gap-1 text-red-500 transition-colors duration-200 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-16 text-center text-slate-400">Kurslar topilmadi</div>
          )}
        </div>
      )}

      <AnimatePresence mode="sync">
        {modal && (
          <motion.div
            key="course-modal"
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="modal-content max-h-[90vh] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-800 dark:text-[var(--text-h)]">
                  {modal === 'create' ? 'Yangi Kurs' : 'Tahrirlash'}
                </h2>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="rounded-lg p-2 transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-[var(--hover-bg)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="input-label">Kurs nomi</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input transition-[border-color] duration-200"
                    placeholder="Web Dasturlash"
                  />
                </div>
                <div>
                  <label className="input-label">Tavsif</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input min-h-[80px] resize-none transition-[border-color] duration-200"
                    placeholder="Kurs haqida..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Narxi (so'm)</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="input transition-[border-color] duration-200"
                      placeholder="500000"
                    />
                  </div>
                  <div>
                    <label className="input-label">Davomiyligi (oy)</label>
                    <input
                      type="number"
                      value={form.duration_months}
                      onChange={(e) => setForm({ ...form, duration_months: e.target.value })}
                      className="input transition-[border-color] duration-200"
                      placeholder="6"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary transition-opacity duration-200 hover:opacity-90">
                  Bekor qilish
                </button>
                <button type="button" onClick={handleSave} className="btn-primary transition-transform duration-200 hover:scale-[1.02]">
                  {modal === 'create' ? 'Yaratish' : 'Saqlash'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoursesPage;
