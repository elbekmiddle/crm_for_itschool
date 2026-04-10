import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, Clock, Loader2, Trophy, 
  Play, Sparkles, Calendar, 
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

type FilterTab = 'all' | 'upcoming' | 'completed';

const ExamListPage: React.FC = () => {
  const { exams, fetchExams, isLoading } = useExamStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<FilterTab>('all');

  useEffect(() => { fetchExams(); }, []);

  const safeExams = Array.isArray(exams) ? exams : [];
  const filtered = safeExams.filter((e: any) => {
    if (tab === 'upcoming') return e.status !== 'COMPLETED';
    if (tab === 'completed') return e.status === 'COMPLETED';
    return true;
  });

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'Barchasi' },
    { id: 'upcoming', label: 'Kutilmoqda' },
    { id: 'completed', label: 'Yakunlangan' },
  ];

  return (
    <div className="page-container space-y-8 pb-32 lg:pb-12 h-full">
      {/* Header section with Stats */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <motion.div 
           initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 text-[#aa3bff] font-black text-[10px] uppercase tracking-[0.3em] mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Mening Imtihonlarim</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Akademik Testlar</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Bilimingizni sinash va natijalarni nazorat qilish</p>
        </motion.div>

        {/* Mini stats */}
        <div className="flex gap-4">
           <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-black text-emerald-600/70 uppercase tracking-widest leading-none mb-1">Muvaffaqiyatli</p>
                <p className="text-slate-900 dark:text-white font-black leading-none">{safeExams.filter((e:any) => e.status === 'COMPLETED' && e.score >= 70).length}</p>
              </div>
           </div>
        </div>
      </header>

      {/* Filters with refined design */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#16171d]/80 backdrop-blur-xl py-4 -mx-4 px-4 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-white/5">
        <div className="flex gap-2 min-w-max">
          {tabs.map(({ id, label }) => {
            const isActive = tab === id;
            return (
              <button
                type="button"
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                   "cursor-pointer relative py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3",
                   isActive ? "bg-[#aa3bff] text-white shadow-xl shadow-[#aa3bff]/20" : "bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-700 dark:hover:text-white"
                )}
              >
                <span>{label}</span>
                <span className={cn(
                    "px-2 py-0.5 rounded-full font-black text-[9px]",
                    isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-400"
                )}>
                  {safeExams.filter((e: any) => {
                    if (id === 'upcoming') return e.status !== 'COMPLETED';
                    if (id === 'completed') return e.status === 'COMPLETED';
                    return true;
                  }).length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-24 bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-white/5">
            <Loader2 className="w-10 h-10 text-[#aa3bff] animate-spin" />
            <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Ma'lumotlar yuklanmoqda...</p>
          </div>
        ) : filtered.length > 0 ? (
          <motion.div 
            key={tab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((exam: any, idx: number) => {
              const isCompleted = exam.status === 'COMPLETED';
              const isInProgress = exam.status === 'IN_PROGRESS';
              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <button
                    type="button"
                    onClick={() => navigate(isCompleted ? `/exams/${exam.id}/result` : `/exams/${exam.id}`)}
                    className="cursor-pointer bg-white dark:bg-[#16171d] rounded-[2.5rem] p-8 border border-slate-100 dark:border-[#2e303a] shadow-sm hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-2 transition-all group w-full text-left flex flex-col justify-between h-full min-h-[320px] relative overflow-hidden"
                  >
                    {/* Decorative subtle gradient for cards */}
                    <div className={cn(
                       "absolute top-0 right-0 w-32 h-32 blur-3xl -mr-16 -mt-16 opacity-10 transition-opacity group-hover:opacity-30",
                       isCompleted ? "bg-emerald-500" : isInProgress ? "bg-amber-500" : "bg-[#aa3bff]"
                    )} />
                    
                    <div>
                      <header className="flex justify-between items-start mb-6">
                        <div className={cn(
                           "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 transition-transform group-hover:rotate-6",
                           isCompleted ? "bg-emerald-500 shadow-emerald-500/20" : isInProgress ? "bg-amber-500 shadow-amber-500/20" : "bg-[#aa3bff] shadow-[#aa3bff]/20"
                        )}>
                          {isCompleted ? <Trophy className="w-7 h-7 text-white" /> : isInProgress ? <Play className="w-7 h-7 text-white fill-current" /> : <ClipboardList className="w-7 h-7 text-white" />}
                        </div>
                        <div className={cn(
                           "px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border",
                           isCompleted ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20" : isInProgress ? "bg-amber-500/5 text-amber-500 border-amber-500/20" : "bg-[#aa3bff]/5 text-[#aa3bff] border-[#aa3bff]/20"
                        )}>
                          {isCompleted ? '✓ Yakunlandi' : isInProgress ? '◀ Davom etmoqda' : '○ Kutilmoqda'}
                        </div>
                      </header>

                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-4 group-hover:text-[#aa3bff] transition-colors line-clamp-2">
                        {exam.title}
                      </h3>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="flex items-center gap-2">
                           <Clock className="w-4 h-4 text-slate-400" />
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{exam.duration} Daqiqa</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Calendar className="w-4 h-4 text-slate-400" />
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{exam.questions_count} Savol</span>
                        </div>
                      </div>
                    </div>

                    <footer className="mt-auto flex items-center justify-between">
                       {isCompleted && exam.score !== undefined ? (
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Natijangiz</span>
                            <span className={cn(
                               "text-3xl font-black",
                               exam.score >= 70 ? "text-emerald-500" : "text-red-500"
                            )}>{exam.score}%</span>
                         </div>
                       ) : (
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                            <span className="text-xl font-black text-slate-900 dark:text-white">Tayyor</span>
                         </div>
                       )}

                       <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center border-2 border-slate-100 dark:border-white/5 group-hover:bg-[#aa3bff] group-hover:border-[#aa3bff] group-hover:text-white transition-all transform group-hover:translate-x-1",
                          isCompleted ? "text-emerald-500" : "text-[#aa3bff]"
                       )}>
                          <ChevronRight className="w-6 h-6" />
                       </div>
                    </footer>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center p-24 bg-white dark:bg-[#16171d] rounded-[3rem] border border-slate-100 dark:border-[#2e303a] shadow-sm">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
              <ClipboardList className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tight">Imtihonlar yo'q</h3>
            <p className="text-slate-300 dark:text-slate-500 font-bold mt-2">Hozircha hech qanday testlar mavjud emas.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExamListPage;
