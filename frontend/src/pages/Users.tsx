import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { 
  Plus, Search, Trash2, Edit2, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { cn } from '../lib/utils';

const ROLES = ['ADMIN', 'MANAGER', 'TEACHER'];

const UsersPage = () => {
  const { users, fetchUsers, createUser, updateUser, deleteUser, isLoading, user: currentUser } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = (users || []).filter((u: any) =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());
    // Remove empty password on edit
    if (editingUser && !data.password) delete data.password;
    if (editingUser) {
      await updateUser(editingUser.id, data);
    } else {
      await createUser(data);
    }
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-700';
      case 'MANAGER': return 'bg-amber-100 text-amber-700';
      case 'TEACHER': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-8 lg:p-14 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Xodimlar</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Jami: {users.length} xodim</p>
        </motion.div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-4 rounded-3xl shadow-xl flex items-center gap-4 border border-slate-50 focus-within:ring-2 focus-within:ring-primary-100 transition-all group">
            <Search className="w-5 h-5 text-slate-300 group-focus-within:text-primary-600" />
            <input placeholder="Email yoki ism..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="outline-none border-none bg-transparent font-bold text-slate-600 w-48" />
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-6 h-6" /> QO'SHISH
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-50">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="py-6 px-10 text-xs font-black text-slate-400 uppercase tracking-widest">Xodim</th>
              <th className="py-6 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Email</th>
              <th className="py-6 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Rol</th>
              <th className="py-6 px-10 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <AnimatePresence mode="popLayout">
              {filteredUsers.map((u: any, idx: number) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }} className="hover:bg-slate-50/50">
                  <td className="py-6 px-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-black">
                        {(u.first_name || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="font-bold text-slate-800">{u.first_name || ''} {u.last_name || ''}</div>
                    </div>
                  </td>
                  <td className="py-6 px-4 text-sm font-mono text-slate-500">{u.email}</td>
                  <td className="py-6 px-4">
                    <span className={cn("px-4 py-1.5 rounded-full text-xs font-black uppercase", roleColor(u.role))}>{u.role}</span>
                  </td>
                  <td className="py-6 px-10 text-right space-x-2">
                    <button onClick={() => { setEditingUser(u); setIsModalOpen(true); }} className="p-3 hover:bg-blue-50 hover:text-blue-600 rounded-2xl text-slate-400 transition-all">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    {u.id !== currentUser?.id && (
                      <button onClick={() => { setDeletingId(u.id); setIsConfirmOpen(true); }} className="p-3 hover:bg-red-50 hover:text-red-600 rounded-2xl text-slate-400 transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {isLoading && users.length === 0 && (
          <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingUser(null); }} title={editingUser ? "Xodimni Tahrirlash" : "Yangi Xodim"}>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ism</label>
              <input name="first_name" defaultValue={editingUser?.first_name} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Familiya</label>
              <input name="last_name" defaultValue={editingUser?.last_name} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
            <input required name="email" type="email" defaultValue={editingUser?.email} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{editingUser ? 'Yangi Parol (ixtiyoriy)' : 'Parol'}</label>
            <input name="password" type="password" required={!editingUser} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Rol</label>
            <select required name="role" defaultValue={editingUser?.role || 'TEACHER'} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <Button type="submit" className="w-full py-6">SAQLASH</Button>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => { if (deletingId) { deleteUser(deletingId); setDeletingId(null); } }}
        title="Xodimni o'chirish"
        message="Rostdan ham bu xodimni o'chirasizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'CHIRISH"
      />
    </div>
  );
};

export default UsersPage;
