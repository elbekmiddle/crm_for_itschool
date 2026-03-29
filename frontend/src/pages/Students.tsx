import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { 
  Plus, 
  Search, 
  GraduationCap, 
  Trash2,
  Edit2,
  Loader2,
  Wallet,
  Calendar,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import api from '../lib/api';
import { cn } from '../lib/utils';

const StudentsPage = () => {
  const { students, fetchStudents, createStudent, updateStudent, deleteStudent, isLoading } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    if (editingStudent) {
      await updateStudent(editingStudent.id, data);
    } else {
      await createStudent(data);
    }
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    
    setIsSubmittingPayment(true);
    try {
      await api.post('/payments', {
        student_id: selectedStudent.id,
        amount,
        type: 'CASH',
        date: new Date().toISOString().split('T')[0]
      });
      alert("To'lov muvaffaqiyatli qabul qilindi!");
      setIsPaymentModalOpen(false);
      setSelectedStudent(null);
    } catch (e) {
      alert("To'lovda xato!");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteStudent(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 lg:p-14 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1"
        >
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Talabalar</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Jami: {students.length} kishi</p>
        </motion.div>
        
        <div className="flex gap-4">
           <div className="bg-white px-6 py-4 rounded-3xl shadow-xl flex items-center gap-4 border border-slate-50 focus-within:ring-2 focus-within:ring-primary-100 transition-all group">
              <Search className="w-5 h-5 text-slate-300 group-focus-within:text-primary-600" />
              <input 
                placeholder="Ism yoki telefon..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none border-none bg-transparent font-bold text-slate-600 w-48 md:w-64"
              />
           </div>
           
           <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-6 h-6" /> QO'SHISH
           </Button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="py-6 px-10 text-xs font-black text-slate-400 uppercase tracking-widest">To'liq ism</th>
              <th className="py-6 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Telefon</th>
              <th className="py-6 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Guruh</th>
              <th className="py-6 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="py-6 px-10 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <AnimatePresence mode="popLayout">
              {filteredStudents.map((s, idx) => (
                <motion.tr 
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-6 px-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {s.first_name[0]}
                      </div>
                      <div className="font-bold text-slate-800">{s.first_name} {s.last_name}</div>
                    </div>
                  </td>
                  <td className="py-6 px-4 font-mono font-bold text-slate-500">{s.phone}</td>
                  <td className="py-6 px-4">
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-tighter">
                      {s.group_name || "Individual"}
                    </span>
                  </td>
                  <td className="py-6 px-4">
                    <span className={cn(
                      "w-2.5 h-2.5 rounded-full inline-block mr-2",
                      s.status === 'ACTIVE' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500"
                    )} />
                    <span className="text-xs font-black text-slate-600 tracking-widest uppercase">{s.status || 'ACTIVE'}</span>
                  </td>
                  <td className="py-6 px-10 text-right space-x-2">
                    <button 
                      onClick={() => { setSelectedStudent(s); setIsPaymentModalOpen(true); }}
                      className="p-3 hover:bg-white hover:shadow-lg rounded-2xl transition-all text-slate-400 hover:text-green-600"
                    >
                      <Wallet className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => { setEditingStudent(s); setIsModalOpen(true); }}
                      className="p-3 hover:bg-white hover:shadow-lg rounded-2xl transition-all text-slate-400 hover:text-blue-600"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => { setDeletingId(s.id); setIsConfirmOpen(true); }}
                      className="p-3 hover:bg-white hover:shadow-lg rounded-2xl transition-all text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        
        {isLoading && filteredStudents.length === 0 && (
           <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300">
             <Loader2 className="w-10 h-10 animate-spin" />
             <p className="font-bold uppercase tracking-widest text-xs leading-none">Yuklanmoqda...</p>
           </div>
        )}
      </div>

      {/* CRUD Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingStudent(null); }}
        title={editingStudent ? "Tahrirlash" : "Yangi Talaba Qo'shish"}
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ism</label>
              <input required name="first_name" defaultValue={editingStudent?.first_name} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-slate-800 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Familiya</label>
              <input required name="last_name" defaultValue={editingStudent?.last_name} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-slate-800 transition-all" />
            </div>
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Telefon</label>
             <input required name="phone" placeholder="+998" defaultValue={editingStudent?.phone} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-slate-800 transition-all" />
          </div>
          <Button type="submit" className="w-full py-6">
            SAQLASH
          </Button>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal 
        isOpen={isPaymentModalOpen} 
        onClose={() => { setIsPaymentModalOpen(false); setSelectedStudent(null); }}
        title="To'lov Qabul Qilish"
      >
        <form onSubmit={handlePayment} className="space-y-8">
          <div className="bg-green-50 p-6 rounded-3xl border border-green-100 flex items-center gap-6">
             <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <DollarSign className="w-8 h-8" />
             </div>
             <div>
                <h4 className="font-black text-green-900 uppercase text-xs tracking-[0.2em] leading-none mb-1">{selectedStudent?.first_name} {selectedStudent?.last_name}</h4>
                <p className="text-xs font-bold text-green-400 uppercase tracking-widest leading-none">O'quv kursi uchun to'lov</p>
             </div>
          </div>
          
          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">To'lov Summasi (SUM)</label>
                <input required type="number" name="amount" placeholder="1,200,000" className="w-full p-8 bg-slate-50 border-2 border-transparent focus:border-green-500 rounded-[2rem] outline-none font-black text-3xl text-slate-800 transition-all" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Sana</label>
                <div className="w-full p-6 bg-slate-50 rounded-3xl font-bold flex items-center gap-4 text-slate-400">
                   <Calendar className="w-5 h-5" /> {new Date().toLocaleDateString()} (Bugun)
                </div>
             </div>
          </div>

          <Button isLoading={isSubmittingPayment} type="submit" className="w-full py-8 text-lg bg-green-600 shadow-xl shadow-green-100 uppercase">
            To'lovni Tasdiqlash
          </Button>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="O'chirishni tasdiqlaysizmi?"
        message="Bu talabani butunlay o'chirib yuboradi. Ushbu amalni qaytarib bo'lmaydi."
      />

    </div>
  );
};

export default StudentsPage;
