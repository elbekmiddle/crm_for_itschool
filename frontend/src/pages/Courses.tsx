import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import {
  BookOpen, Plus, Search, Loader2, Pencil, Trash2, X, Users, CheckCircle, Clock
} from 'lucide-react';

import { useConfirm } from '../context/ConfirmContext';

const CoursesPage: React.FC = () => {
  const { courses, fetchCourses, createCourse, updateCourse, deleteCourse, isLoading } = useAdminStore();
  const confirm = useConfirm();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration_months: '' });
  const [search, setSearch] = useState('');

  useEffect(() => { fetchCourses(); }, []);

  const filtered = courses.filter((c: any) => c.name?.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setForm({ name: '', description: '', price: '', duration_months: '' });
    setModal('create');
  };

  const openEdit = (c: any) => {
    setEditTarget(c);
    setForm({ name: c.name, description: c.description || '', price: c.price?.toString() || '', duration_months: c.duration_months?.toString() || '' });
    setModal('edit');
  };

  const handleSave = async () => {
    const payload = { ...form, price: Number(form.price), duration_months: Number(form.duration_months) };
    if (modal === 'create') await createCourse(payload);
    else if (editTarget) await updateCourse(editTarget.id, payload);
    setModal(null);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Kursni o'chirish?",
      message: "Ushbu kurs barcha darslari va talabalari bog'liqligi bilan o'chirilishi mumkin.",
      confirmText: "O'CHIRISH",
      type: 'danger'
    });
    if (ok) await deleteCourse(id);
  };

  return (
    <div className="page-container animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Kurs Boshqaruvi</h1>
          <p className="text-sm text-slate-400 mt-0.5">O'quv yo'nalishlarini boshqaring.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yangi Kurs
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary-600" /></div>
            <div>
              <p className="label-subtle">Faol kurslar</p>
              <p className="text-2xl font-black text-slate-800">{courses.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="label-subtle">Jami talabalar</p>
              <p className="text-2xl font-black text-slate-800">{courses.reduce((a: number, c: any) => a + (c.student_count || 0), 0)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center"><CheckCircle className="w-5 h-5 text-amber-600" /></div>
            <div>
              <p className="label-subtle">O'rt. Davomat</p>
              <p className="text-2xl font-black text-slate-800">94.2%</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="label-subtle">Kreditlar</p>
              <p className="text-2xl font-black text-slate-800">{courses.length * 24}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kurs qidirish..." className="input pl-10" />
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course: any) => (
            <div key={course.id} className="card-hover p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                </div>
                <span className="status-pill pill-active">● ACTIVE</span>
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">{course.name}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-4">{course.description || "Kurs tafsilotlari..."}</p>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div>
                  <p className="label-subtle">O'qituvchi</p>
                  <p className="font-bold text-slate-600 mt-0.5">{course.teacher_name || '—'}</p>
                </div>
                <div>
                  <p className="label-subtle">Talabalar</p>
                  <p className="font-bold text-slate-600 mt-0.5">{course.student_count || 0} ta</p>
                </div>
                <div>
                  <p className="label-subtle">Narxi</p>
                  <p className="font-bold text-slate-600 mt-0.5">{course.price ? `${Number(course.price).toLocaleString()} so'm` : '—'}</p>
                </div>
                <div>
                  <p className="label-subtle">Davomiyligi</p>
                  <p className="font-bold text-slate-600 mt-0.5">{course.duration_months || '—'} oy</p>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-50">
                <button onClick={() => openEdit(course)} className="btn-ghost btn-sm flex-1 flex items-center justify-center gap-1">
                  <Pencil className="w-3.5 h-3.5" /> Tahrirlash
                </button>
                <button onClick={() => handleDelete(course.id)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50 flex items-center justify-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-slate-400">Kurslar topilmadi</div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content p-6 animate-in-scale" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-800">{modal === 'create' ? 'Yangi Kurs' : 'Tahrirlash'}</h2>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="input-label">Kurs nomi</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Web Dasturlash" />
              </div>
              <div>
                <label className="input-label">Tavsif</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-[80px] resize-none" placeholder="Kurs haqida..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Narxi (so'm)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" placeholder="500000" />
                </div>
                <div>
                  <label className="input-label">Davomiyligi (oy)</label>
                  <input type="number" value={form.duration_months} onChange={(e) => setForm({ ...form, duration_months: e.target.value })} className="input" placeholder="6" />
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
    </div>
  );
};

export default CoursesPage;
