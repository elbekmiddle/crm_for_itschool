import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import {
  Users, Plus, Loader2, Pencil, Trash2, X,
  Shield, CheckCircle2
} from 'lucide-react';

import { useConfirm } from '../context/ConfirmContext';

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-50 text-red-600 border-red-200',
  MANAGER: 'bg-amber-50 text-amber-600 border-amber-200',
  TEACHER: 'bg-primary-50 text-primary-600 border-primary-200',
};

const UsersPage: React.FC<{ roleFilter?: string }> = ({ roleFilter }) => {
  const { users, fetchUsers, createUser, updateUser, deleteUser, isLoading } = useAdminStore();
  const confirm = useConfirm();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', role: roleFilter || 'TEACHER' });

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = roleFilter 
    ? users.filter((u: any) => u.role === roleFilter)
    : users;

  const openCreate = () => {
    setForm({ first_name: '', last_name: '', email: '', phone: '', password: '', role: 'TEACHER' });
    setModal('create');
  };

  const openEdit = (u: any) => {
    setEditTarget(u);
    setForm({ first_name: u.first_name, last_name: u.last_name, email: u.email || '', phone: u.phone || '', password: '', role: u.role });
    setModal('edit');
  };

  const normalizePhone = (p: string) => {
    let clean = p.replace(/\D/g, '');
    if (clean.length === 9) return '+998' + clean;
    if (clean.length === 12 && clean.startsWith('998')) return '+' + clean;
    return p.startsWith('+') ? p : '+' + p;
  };

  const handleSave = async () => {
    const data = { ...form, phone: normalizePhone(form.phone) };
    if (modal === 'create') await createUser(data);
    else if (editTarget) {
      const payload: any = { ...data };
      if (!payload.password) delete payload.password;
      await updateUser(editTarget.id, payload);
    }
    setModal(null);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Foydalanuvchini o'chirish?",
      message: "Ushbu foydalanuvchi tizimdan butunlay o'chiriladi.",
      confirmText: "O'CHIRISH",
      type: 'danger'
    });
    if (ok) await deleteUser(id);
  };

  // Permission matrix
  const modules = ['Foydalanuvchilar', 'Kurslar', 'Moliya', 'Analitika', 'Imtihonlar'];
  const roles = ['Admin', 'Manager', 'Teacher'];
  const matrix: Record<string, boolean[]> = {
    Admin: [true, true, true, true, true],
    Manager: [false, true, true, false, true],
    Teacher: [false, true, false, false, true],
  };

  return (
    <div className="page-container animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Huquqlar Matritsasi</h1>
          <p className="text-sm text-slate-400 mt-0.5">Foydalanuvchilar va rollarni boshqaring.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2"><Shield className="w-4 h-4" /> Audit Log</button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Foydalanuvchi</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Permission Matrix */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Rol & Huquq Matritsasi</h2>
            <span className="status-pill pill-active">LIVE SYNC ENABLED</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>MODUL / RESURS</th>
                  {roles.map(r => <th key={r} className="text-center">{r.toUpperCase()}</th>)}
                </tr>
              </thead>
              <tbody>
                {modules.map((mod, i) => (
                  <tr key={mod}>
                    <td><p className="font-bold text-slate-700">{mod}</p></td>
                    {roles.map(r => (
                      <td key={r} className="text-center">
                        {matrix[r][i] ? (
                          <CheckCircle2 className="w-5 h-5 text-primary-500 mx-auto" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-200 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="section-title mb-4">Tezkor Belgilash</h2>
            <div className="space-y-3">
              {filteredUsers.slice(0, 4).map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center text-xs font-black text-primary-600 overflow-hidden">
                      {u.photo_url ? <img src={u.photo_url} className="w-full h-full object-cover" /> : <span>{u.first_name?.[0]}{u.last_name?.[0]}</span>}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{u.first_name} {u.last_name}</p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <span className={cn("status-pill", roleColors[u.role] || 'pill-active')}>{u.role}</span>
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
                {filteredUsers.map((u: any) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-xs font-black text-primary-600 overflow-hidden">
                            {u.photo_url ? <img src={u.photo_url} className="w-full h-full object-cover" /> : <span>{u.first_name?.[0]}{u.last_name?.[0]}</span>}
                         </div>
                         <p className="font-bold text-slate-700">{u.first_name} {u.last_name}</p>
                      </div>
                    </td>
                    <td className="text-xs text-slate-500">{u.email}</td>
                    <td className="font-mono text-xs">{u.phone}</td>
                    <td><span className={cn("status-pill", roleColors[u.role] || 'pill-active')}>{u.role}</span></td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(u.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="select">
                  <option value="TEACHER">Teacher</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
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

export default UsersPage;
