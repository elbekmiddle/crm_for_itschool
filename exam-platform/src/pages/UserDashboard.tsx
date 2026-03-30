import { useEffect, useState } from 'react';
import { useExamStore } from '../store/useExamStore';
import { 
  Trophy, 
  Calendar, 
  Clock, 
  Target, 
  ChevronRight,
  TrendingUp,
  Activity,
  User,
  LogOut,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import ConfirmModal from '../components/ConfirmModal';

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 flex flex-col items-center text-center space-y-6 group hover:shadow-2xl transition-all">
    <div className={cn("p-6 rounded-[2rem] transition-transform group-hover:scale-110 shadow-sm", color)}>
      <Icon className="w-10 h-10" />
    </div>
    <div className="space-y-2">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</div>
      <div className="text-5xl font-black text-slate-800 tabular-nums tracking-tighter">{value}</div>
    </div>
  </div>
);

const UserDashboard = () => {
  const { exams, fetchExams, fetchHistory, isLoading } = useExamStore();
  const navigate = useNavigate();
  const studentEmail = localStorage.getItem('exam_student_email') || 'O`quvchi';

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    fetchExams();
    const studentId = localStorage.getItem('exam_student_id');
    if (studentId) fetchHistory(studentId);
  }, [fetchExams, fetchHistory]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (isLoading && exams.length === 0) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Ma`lumotlar yuklanmoqda...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8 lg:p-14 space-y-14 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* Premium Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
           <div className="w-24 h-24 bg-primary-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-primary-200 rotate-6 hover:rotate-0 transition-transform cursor-pointer">
              <User className="w-12 h-12" />
           </div>
           <div className="space-y-2">
              <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Xush Kelibsiz!</h1>
              <p className="text-xl text-slate-400 font-bold tracking-wide flex items-center gap-2 leading-none uppercase">
                <Target className="w-5 h-5 text-primary-600" /> {studentEmail.split('@')[0]}
              </p>
           </div>
        </div>
        <div className="flex gap-4">
           <button onClick={() => navigate('/history')} className="px-10 py-5 bg-white shadow-xl rounded-[2rem] border border-slate-50 font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
              <Activity className="w-5 h-5" /> To'lov/Davomat
           </button>
           <button onClick={() => setIsLogoutModalOpen(true)} className="p-5 bg-red-50 text-red-500 rounded-[2rem] hover:bg-red-500 hover:text-white transition-all shadow-lg border border-red-100">
              <LogOut className="w-6 h-6" />
           </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <StatCard icon={Trophy} label="O'rtacha Ball" value="84%" color="bg-orange-50 text-orange-600" />
        <StatCard icon={Calendar} label="Darslar" value="12" color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={Activity} label="Davomat" value="95%" color="bg-green-50 text-green-600" />
        <StatCard icon={Target} label="Testlar" value={exams.length} color="bg-red-50 text-red-600" />
      </div>

      {/* Exams Section */}
      <section className="space-y-10">
        <div className="flex items-center justify-between px-4">
           <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Mavjud Imtihonlar</h2>
           <div className="text-xs font-black text-slate-300 uppercase tracking-widest">{exams.length} TEST READY</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence>
            {exams.map((exam, idx) => (
              <motion.div 
                key={exam.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => navigate(`/exam/${exam.id}`)}
                className="bg-white p-10 rounded-[3.5rem] shadow-2xl shadow-slate-200 border border-slate-50 cursor-pointer group hover:bg-primary-600 transition-all duration-500 relative overflow-hidden"
              >
                <div className="relative z-10 space-y-8">
                   <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center group-hover:bg-white transition-all shadow-sm">
                      <HelpCircle className="w-8 h-8" />
                   </div>
                   <div className="space-y-3">
                      <h4 className="text-2xl font-black text-slate-800 group-hover:text-white tracking-tight uppercase leading-tight line-clamp-2">{exam.title}</h4>
                      <div className="flex gap-6 items-center">
                         <div className="flex items-center gap-2 text-slate-400 group-hover:text-white/80 font-bold text-xs">
                            <Clock className="w-4 h-4" /> {exam.duration} min
                         </div>
                         <div className="flex items-center gap-2 text-slate-400 group-hover:text-white/80 font-bold text-xs">
                            <Target className="w-4 h-4" /> 20 Savol
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center justify-between pt-6 border-t border-slate-50 group-hover:border-white/20">
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-white/60 uppercase tracking-widest">TESTNI BOSHLASH</span>
                      <ChevronRight className="w-6 h-6 text-primary-600 group-hover:text-white group-hover:translate-x-2 transition-all" />
                   </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary-50 rounded-full group-hover:bg-white/5 transition-all duration-700" />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {exams.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center gap-6 opacity-20">
               <TrendingUp className="w-24 h-24" />
               <p className="text-2xl font-black uppercase tracking-widest">Hozircha yangi testlar yo"q</p>
            </div>
          )}
        </div>
      </section>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Tizimdan chiqish"
        message="Rostdan ham tizimdan chiqmoqchimisiz?"
        confirmText="Chiqish"
        variant="danger"
      />

    </div>
  );
};

export default UserDashboard;
