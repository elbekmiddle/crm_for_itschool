import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Lock,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import api from '../lib/api';
import { cn } from '../lib/utils';

const UsersPage = () => {
  const { user } = useAdminStore();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/staff');
      setStaff(data);
    } catch (e) {
      console.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, data);
      } else {
        await api.post('/users', data);
      }
      fetchStaff();
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (e) {
      alert("Saqlashda xato!");
    }
  };

  const handleDelete = async () => {
    if (deletingId) {
      try {
        await api.delete(`/users/${deletingId}`);
        fetchStaff();
        setIsConfirmOpen(false);
      } catch (e) {
        alert("O'chirishda xato!");
      }
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="h-[90vh] flex flex-col items-center justify-center space-y-4">
        <Lock className="w-16 h-16 text-red-100" />
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Ruxsat yo'q</h2>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Ushbu sahifa faqat adminlar uchun.</p>
      </div>
    );
  }

  return (
    <div className="p-14 space-y-14">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-indigo-50 px-5 py-2 rounded-full border border-indigo-100 shadow-sm text-indigo-600 font-black text-[10px] uppercase tracking-widest">
             <ShieldCheck className="w-4 h-4" /> System Security
          </div>
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">Xodimlar</h1>
          <p className="text-lg text-slate-400 font-bold tracking-wide uppercase px-2 leading-none">Tizim boshqaruvchilari va o'qituvchilar nazorati</p>
        </div>
        
        <Button onClick={() => setIsModalOpen(true)} className="px-10 py-6">
           <UserPlus className="w-6 h-6" /> XODIM QO'SHISH
        </Button>
      </header>

      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="py-8 px-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Profil</th>
              <th className="py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Email</th>
              <th className="py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Lavozim</th>
              <th className="py-8 px-12 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {staff.map((s) => (
              <motion.tr key={s.id} className="group hover:bg-slate-50/50 transition-all">
                <td className="py-8 px-12">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg group-hover:scale-110 transition-transform">
                         {s.email[0].toUpperCase()}
                      </div>
                      <div className="font-bold text-slate-800">{s.email.split('@')[0]}</div>
                   </div>
                </td>
                <td className="py-8 px-6 font-mono font-bold text-slate-500 text-sm">{s.email}</td>
                <td className="py-8 px-6">
                   <span className={cn(
                     "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest leading-none border shadow-sm",
                     s.role === 'ADMIN' ? 'bg-red-50 text-red-600 border-red-100' : 
                     s.role === 'MANAGER' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                     'bg-indigo-50 text-indigo-600 border-indigo-100'
                   )}>
                      {s.role}
                   </span>
                </td>
                <td className="py-8 px-12 text-right space-x-2">
                   <button onClick={() => { setEditingUser(s); setIsModalOpen(true); }} className="p-4 bg-white shadow-xl rounded-2xl text-slate-400 hover:text-indigo-600 transition-all"><Edit2 className="w-5 h-5" /></button>
                   <button onClick={() => { setDeletingId(s.id); setIsConfirmOpen(true); }} className="p-4 bg-white shadow-xl rounded-2xl text-slate-400 hover:text-red-500 transition-all"><Trash2 className="w-5 h-5" /></button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {loading && (
          <div className="py-32 flex flex-col items-center justify-center gap-6 opacity-20">
             <Loader2 className="w-16 h-16 animate-spin" />
             <p className="font-black text-xl uppercase tracking-widest leading-none">Xodimlar ro'yxati yuklanmoqda...</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Xodimni Tahrirlash" : "Yangi Xodim"}>
         <form onSubmit={handleSave} className="space-y-8">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Manzili</label>
               <input name="email" required type="email" defaultValue={editingUser?.email} className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold text-slate-800 border-2 border-transparent focus:border-indigo-500" />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Parol</label>
                 <input name="password" required type="password" className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold text-slate-800 border-2 border-transparent focus:border-indigo-500" />
              </div>
            )}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Lavozim (Role)</label>
               <select name="role" defaultValue={editingUser?.role || 'TEACHER'} className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold text-slate-800 border-none">
                  <option value="TEACHER">O'qituvchi</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Administrator</option>
               </select>
            </div>
            <Button type="submit" className="w-full py-8 text-lg">DAVOM ETISH</Button>
         </form>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Xodimni o'chirish?"
        message="Ushbu xodim tizimga kirish huquqini butunlay yo'qotadi."
      />

    </div>
  );
};

export default UsersPage;
