import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import {
  Users, Plus, Loader2, Pencil, Trash2, X, UserPlus, UserMinus,
  Radio, Calendar
} from 'lucide-react';

import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';

const GroupsPage: React.FC = () => {
  const { user, groups, courses, students, fetchGroups, fetchCourses, fetchStudents, createGroup, updateGroup, deleteGroup, addStudentToGroup, removeStudentFromGroup, fetchGroupStudents, isLoading } = useAdminStore();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({ name: '', course_id: '', schedule: '', max_students: '' });
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupStudents, setGroupStudents] = useState<any[]>([]);
  const [addStudentModal, setAddStudentModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [groupAttendancePct, setGroupAttendancePct] = useState<number | null>(null);

  useEffect(() => { fetchGroups(); fetchCourses(); fetchStudents(); }, []);

  const loadGroupStudents = async (group: any) => {
    setSelectedGroup(group);
    const data = await fetchGroupStudents(group.id);
    setGroupStudents(data || []);
    setGroupAttendancePct(null);
  };

  useEffect(() => {
    const id = selectedGroup?.id;
    if (!id) {
      setGroupAttendancePct(null);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const { data: att } = await api.get(`/attendance/group/${id}`);
        if (cancelled) return;
        const rows = Array.isArray(att) ? att : [];
        if (rows.length === 0) {
          setGroupAttendancePct(null);
          return;
        }
        const present = rows.filter((r: any) => String(r.status || '').toUpperCase() === 'PRESENT').length;
        setGroupAttendancePct(Math.round((present / rows.length) * 100));
      } catch {
        if (!cancelled) setGroupAttendancePct(null);
      }
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [selectedGroup?.id]);

  const openCreate = () => {
    setForm({ name: '', course_id: '', schedule: '', max_students: '' });
    setModal('create');
  };

  const openEdit = (g: any) => {
    setEditTarget(g);
    setForm({
      name: g.name,
      course_id: g.course_id || '',
      schedule: g.schedule || '',
      max_students: String(g.max_students ?? g.capacity ?? ''),
    });
    setModal('edit');
  };

  const handleSave = async () => {
    if (courses.length === 0) {
      alert('Avval kamida bitta kurs yarating, keyin guruh qo‘shing.');
      return;
    }
    if (!form.course_id) {
      alert('Guruh yaratish uchun kurs tanlash majburiy.');
      return;
    }

    const payload: any = { ...form, max_students: Number(form.max_students) || 30 };
    // Auto-assign teacher_id for Teacher role
    if (user?.role === 'TEACHER' && modal === 'create') {
      payload.teacher_id = user.id;
    }
    try {
      if (modal === 'create') await createGroup(payload);
      else if (editTarget) await updateGroup(editTarget.id, payload);
      setModal(null);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Guruhni saqlashda xatolik yuz berdi';
      alert(Array.isArray(message) ? message.join(', ') : message);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedGroup || !selectedStudentId) return;
    try {
      await addStudentToGroup(selectedGroup.id, selectedStudentId);
      await loadGroupStudents(selectedGroup);
      setAddStudentModal(false);
      setSelectedStudentId('');
      showToast('Talaba guruhga qo‘shildi', 'success');
    } catch (error: any) {
      const message = error?.response?.data?.message;
      const text = Array.isArray(message) ? message.join(', ') : message || 'Talabani qo‘shib bo‘lmadi';
      showToast(String(text), 'error');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (selectedGroup) {
      const ok = await confirm({
        title: "Guruhdan chiqarish?",
        message: "Ushbu talaba guruhdan chiqariladi.",
        confirmText: "CHIQARISH",
        type: 'warning'
      });
      if (ok) {
        await removeStudentFromGroup(selectedGroup.id, studentId);
        await loadGroupStudents(selectedGroup);
      }
    }
  };

  const handleDeleteGroup = async (id: string) => {
    const ok = await confirm({
      title: "Guruhni o'chirish?",
      message: "Ushbu guruh va undagi barcha talabalar bog'liqligi o'chiriladi.",
      confirmText: "O'CHIRISH",
      type: 'danger'
    });
    if (ok) await deleteGroup(id);
  };

  return (
    <div className="page-container animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Guruhlar</h1>
          <p className="text-sm text-slate-400 mt-0.5">{groups.length} ta guruh boshqarilmoqda</p>
        </div>
        {user?.role === 'TEACHER' && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Yangi Guruh
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
          ) : groups.length > 0 ? (
            groups.map((group: any) => (
              <div
                key={group.id}
                onClick={() => loadGroupStudents(group)}
                className={cn("card-hover p-5", selectedGroup?.id === group.id && "border-primary-300 bg-primary-50/30")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-sm font-black text-primary-600">
                      {group.name?.[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{group.name}</h3>
                      <p className="text-xs text-slate-400">{group.course_name || 'Kurs belgilanmagan'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-700">{group.student_count || 0}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Talaba</p>
                    </div>
                    {user?.role === 'TEACHER' && (
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(group); }} className="p-2 rounded-lg hover:bg-slate-100">
                        <Pencil className="w-4 h-4 text-slate-400" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }} className="p-2 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                    )}
                  </div>
                </div>

                {group.schedule && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{group.schedule}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="card p-12 text-center text-slate-400">Guruhlar topilmadi</div>
          )}
        </div>

        {/* Right Panel — Group Detail */}
        <div className="space-y-4">
          {selectedGroup ? (
            <>
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-title">{selectedGroup.name}</h2>
                  <div className="flex items-center gap-1">
                    <Radio className="w-3 h-3 text-green-500" />
                    <span className="text-[10px] font-bold text-green-600 uppercase">Faol</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-primary-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-primary-600">{groupStudents.length}</p>
                    <p className="text-[10px] font-bold text-primary-400 uppercase mt-1">Talabalar</p>
                  </div>
                  <div className="bg-green-50 dark:bg-emerald-950/30 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-green-600 dark:text-emerald-400">
                      {groupAttendancePct === null ? '—' : `${groupAttendancePct}%`}
                    </p>
                    <p className="text-[10px] font-bold text-green-400 uppercase mt-1">Davomat</p>
                    {groupAttendancePct === null && (
                      <p className="text-[9px] text-slate-400 mt-1 font-medium">Yozuvlar yo‘q</p>
                    )}
                  </div>
                </div>

                {user?.role === 'TEACHER' && (
                  <button
                    onClick={() => {
                      void fetchStudents();
                      setAddStudentModal(true);
                      setSelectedStudentId('');
                    }}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Talaba qo'shish
                  </button>
                )}
              </div>

              {/* Group Students */}
              <div className="card p-4">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Guruh a'zolari</h3>
                <div className="space-y-2">
                  {groupStudents.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-xs font-black text-primary-600">
                          {s.first_name?.[0]}{s.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{s.first_name} {s.last_name}</p>
                          <p className="text-[10px] text-slate-400">{s.phone}</p>
                        </div>
                      </div>
                      {user?.role === 'TEACHER' && (
                        <button onClick={() => handleRemoveStudent(s.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                          <UserMinus className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                  {groupStudents.length === 0 && <p className="text-sm text-center text-slate-400 py-4">Talabalar yo'q</p>}
                </div>
              </div>
            </>
          ) : (
            <div className="card p-12 text-center">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Guruhni tanlang</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content p-6 animate-in-scale" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black">{modal === 'create' ? 'Yangi Guruh' : 'Tahrirlash'}</h2>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="input-label">Guruh nomi</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="React-14" />
              </div>
              <div>
                <label className="input-label">Kurs</label>
                <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className="select">
                  <option value="">Kursni tanlang</option>
                  {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {courses.length === 0 && (
                  <p className="text-xs text-amber-500 mt-2">
                    Kurslar mavjud emas. Avval `Kurslar` bo‘limida kurs yarating.
                  </p>
                )}
              </div>
              <div>
                <label className="input-label">Dars kunlari</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha'].map(day => (
                    <button 
                      key={day}
                      type="button"
                      onClick={() => {
                        const current = form.schedule.split(', ').filter(Boolean);
                        const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
                        setForm({ ...form, schedule: next.join(', ') });
                      }}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-[10px] font-black border transition-all",
                        form.schedule.includes(day) ? "bg-primary-600 text-white border-primary-600" : "bg-white text-slate-400 border-slate-100"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Maks. talabalar</label>
                  <input type="number" value={form.max_students} onChange={(e) => setForm({ ...form, max_students: e.target.value })} className="input" placeholder="20" />
                </div>
                <div>
                  <label className="input-label">Vaqti (ixtiyoriy)</label>
                  <input placeholder="14:00" className="input" onChange={(e) => {
                    const base = form.schedule.split(' (')[0];
                    setForm({ ...form, schedule: e.target.value ? `${base} (${e.target.value})` : base });
                  }} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(null)} className="btn-secondary">Bekor qilish</button>
              <button onClick={handleSave} className="btn-primary" disabled={courses.length === 0}>
                {modal === 'create' ? 'Yaratish' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {addStudentModal && (
        <div className="modal-overlay" onClick={() => setAddStudentModal(false)}>
          <div className="modal-content p-6 animate-in-scale" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black">Talaba qo'shish</h2>
              <button onClick={() => setAddStudentModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="select">
              <option value="">Talabani tanlang</option>
              {students.map((s: any) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setAddStudentModal(false)} className="btn-secondary">Bekor qilish</button>
              <button onClick={handleAddStudent} disabled={!selectedStudentId} className="btn-primary">Qo'shish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsPage;
