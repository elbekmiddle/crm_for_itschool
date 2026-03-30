import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { 
  Plus, Search, Wallet, Trash2, Loader2, DollarSign, Calendar, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';


const PaymentsPage = () => {
  const { payments, fetchPayments, createPayment, deletePayment, students, fetchStudents, courses, fetchCourses, isLoading } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    fetchCourses();
  }, []);

  const filteredPayments = (payments || []).filter((p: any) =>
    (p.student_first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.student_last_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      student_id: formData.get('student_id'),
      course_id: formData.get('course_id'),
      amount: Number(formData.get('amount')),
    };
    await createPayment(data);
    setIsModalOpen(false);
  };

  const totalAmount = filteredPayments.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);

  return (
    <div className="p-8 lg:p-14 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">To'lovlar</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Jami: {payments.length} ta to'lov • {totalAmount.toLocaleString()} so'm</p>
        </motion.div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-4 rounded-3xl shadow-xl flex items-center gap-4 border border-slate-50 focus-within:ring-2 focus-within:ring-primary-100 transition-all group">
            <Search className="w-5 h-5 text-slate-300 group-focus-within:text-primary-600" />
            <input placeholder="Talaba ismi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="outline-none border-none bg-transparent font-bold text-slate-600 w-48" />
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-6 h-6" /> TO'LOV QABUL
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 text-center">
          <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-4" />
          <div className="text-3xl font-black text-slate-800">{totalAmount.toLocaleString()}</div>
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">Jami Tushum (SO'M)</div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 text-center">
          <Wallet className="w-8 h-8 text-primary-600 mx-auto mb-4" />
          <div className="text-3xl font-black text-slate-800">{payments.length}</div>
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">Jami Tranzaksiyalar</div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 text-center">
          <Calendar className="w-8 h-8 text-indigo-600 mx-auto mb-4" />
          <div className="text-3xl font-black text-slate-800">{new Date().toLocaleDateString()}</div>
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">Bugungi Sana</div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="py-6 px-10 text-xs font-black text-slate-400 uppercase tracking-widest">Talaba</th>
              <th className="py-6 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Kurs</th>
              <th className="py-6 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Summa</th>
              <th className="py-6 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Sana</th>
              <th className="py-6 px-10 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <AnimatePresence mode="popLayout">
              {filteredPayments.map((p: any, idx: number) => (
                <motion.tr 
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-6 px-10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-black text-sm">
                        <User className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-800">{p.student_first_name || 'N/A'} {p.student_last_name || ''}</span>
                    </div>
                  </td>
                  <td className="py-6 px-4">
                    <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-black">{p.course_name || 'Kurs'}</span>
                  </td>
                  <td className="py-6 px-4 font-black text-green-600">{Number(p.amount).toLocaleString()} so'm</td>
                  <td className="py-6 px-4 text-sm font-mono text-slate-500">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
                  <td className="py-6 px-10 text-right">
                    <button onClick={() => { setDeletingId(p.id); setIsConfirmOpen(true); }} className="p-3 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all text-slate-300">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {isLoading && payments.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        )}
      </div>

      {/* New Payment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yangi To'lov Qabul Qilish">
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Talaba</label>
            <select required name="student_id" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800 transition-all">
              <option value="">Tanlang...</option>
              {(students || []).map((s: any) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.phone}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kurs</label>
            <select required name="course_id" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800 transition-all">
              <option value="">Tanlang...</option>
              {(courses || []).map((c: any) => <option key={c.id} value={c.id}>{c.name} — {Number(c.price).toLocaleString()} so'm</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Summa (SO'M)</label>
            <input required type="number" name="amount" placeholder="1,200,000" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-green-500 rounded-2xl outline-none font-black text-2xl text-green-600 transition-all" />
          </div>
          <Button type="submit" className="w-full py-6 bg-green-600 shadow-xl shadow-green-100">TO'LOVNI TASDIQLASH</Button>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => { if (deletingId) { deletePayment(deletingId); setDeletingId(null); } }}
        title="To'lovni o'chirish"
        message="Rostdan ham bu to'lovni o'chirasizmi?"
        confirmText="O'CHIRISH"
      />
    </div>
  );
};

export default PaymentsPage;
