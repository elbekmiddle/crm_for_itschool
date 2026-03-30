import { useEffect } from 'react';
import { useExamStore } from '../store/useExamStore';
import { Wallet, Calendar, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const HistoryPage = () => {
  const { payments, attendance, fetchHistory } = useExamStore();
  const studentId = localStorage.getItem('exam_student_id') || '';

  useEffect(() => {
    if (studentId) fetchHistory(studentId);
  }, [studentId, fetchHistory]);

  return (
    <div className="min-h-screen bg-slate-50 p-8 lg:p-20 space-y-16 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      <header className="space-y-4">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 font-bold text-slate-400 hover:text-primary-600 transition-colors uppercase tracking-widest text-[10px]"
        >
          <ChevronLeft className="w-4 h-4" /> Orqaga
        </button>
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Mening Tarixim</h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs leading-none">To'lovlar va davomat monitoringi</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Payments Section */}
        <section className="space-y-8">
           <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 text-green-600 rounded-2xl"><Wallet className="w-6 h-6" /></div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">To'lovlar</h2>
           </div>

           <div className="space-y-4">
              {payments.map((p, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex items-center justify-between group hover:shadow-2xl transition-all"
                >
                   <div className="space-y-1">
                      <div className="text-lg font-black text-slate-800 uppercase tracking-tighter">{p.amount?.toLocaleString()} SO'M</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(p.created_at).toLocaleDateString()}</div>
                   </div>
                   <div className="px-5 py-2 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 shadow-sm">
                      Muvaffaqiyatli
                   </div>
                </motion.div>
              ))}
              {payments.length === 0 && <div className="py-20 text-center opacity-20"><Wallet className="w-16 h-16 mx-auto mb-4" /><p className="font-black uppercase tracking-widest text-sm">To'lovlar yo"q</p></div>}
           </div>
        </section>

        {/* Attendance Section */}
        <section className="space-y-8">
           <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl"><Calendar className="w-6 h-6" /></div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Yo'qlama</h2>
           </div>

           <div className="space-y-4">
              {attendance.map((a, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex items-center justify-between"
                >
                   <div className="space-y-1">
                      <div className="text-lg font-black text-slate-800 uppercase tracking-tighter">{a.lesson_title || "Dars Mashg'uloti"}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(a.date).toLocaleDateString()}</div>
                   </div>
                   <div className={cn(
                     "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                     a.status === 'PRESENT' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-red-50 text-red-600 border-red-100"
                   )}>
                      {a.status === 'PRESENT' ? 'Kelgan' : 'Kelmagan'}
                   </div>
                </motion.div>
              ))}
              {attendance.length === 0 && <div className="py-20 text-center opacity-20"><Calendar className="w-16 h-16 mx-auto mb-4" /><p className="font-black uppercase tracking-widest text-sm">Yo'qlama yo"q</p></div>}
           </div>
        </section>

      </div>

    </div>
  );
};

export default HistoryPage;
