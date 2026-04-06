import React, { useEffect, useMemo } from 'react';
import { useStudentStore } from '../store/useStudentStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  BookOpen, Users, User, Loader2, TrendingUp,
  Layers, CheckCircle2, Sparkles, Award, Zap, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const LEVELS = ['Boshlang`ich', 'O`rta', 'Yuqori'];

const CoursePage: React.FC = () => {
  const { course, fetchCourse, fetchAttendance, attendanceStats, isLoading } = useStudentStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchCourse();
    if (user?.id) fetchAttendance(user.id);
  }, [user?.id]);

  const levelIdx = useMemo(() => 
    LEVELS.indexOf(course?.level || '') >= 0 ? LEVELS.indexOf(course?.level || '') : 0
  , [course?.level]);
  
  const progress = Math.round(((levelIdx + 1) / LEVELS.length) * 100);

  return (
    <div className="page-container space-y-8 pb-32 lg:pb-12 h-full">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 text-[#aa3bff] font-black text-[10px] uppercase tracking-[0.3em] mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Akademik Profil</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Kurs Ma'lumotlari</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">O'quv jarayoningiz va statistikangiz</p>
        </motion.div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-white/5">
          <Loader2 className="w-10 h-10 text-[#aa3bff] animate-spin" />
          <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Ma'lumotlar yuklanmoqda...</p>
        </div>
      ) : course ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Side */}
          <div className="lg:col-span-8 space-y-8">
            {/* Hero Card */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
               className="relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#7d1fc7] via-[#9329e6] to-[#aa3bff] rounded-[2.5rem]" />
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-24 -mb-24" />
              
              <div className="relative z-10 p-10 flex flex-col md:flex-row md:items-center gap-8">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center border border-white/20 shadow-2xl">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                      Faol Guruh
                    </span>
                    <span className="text-white/60 font-black text-[10px] uppercase tracking-widest">ID: #{course.group_id || '---'}</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                    {course.course_name || course.name || "Noma'lum Kurs"}
                  </h2>
                  <p className="text-white/70 font-medium text-lg leading-tight uppercase tracking-tight">
                    {course.group_name || 'Guruh biriktirilmagan'}
                  </p>
                </div>
                <div className="hidden md:block">
                   <div className="p-4 bg-black/10 backdrop-blur-md rounded-2xl border border-white/5">
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
                        <span className="text-emerald-300 font-bold text-xs uppercase tracking-widest">O'qish davom etmoqda</span>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#16171d] p-8 rounded-[2rem] border border-slate-100 dark:border-[#2e303a] shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                    <User className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-[#6b6375] font-black text-[10px] uppercase tracking-[0.2em] mb-1">Mentor / O'qituvchi</h3>
                    <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {course.teacher_name || 'Belgilanmagan'}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white dark:bg-[#16171d] p-8 rounded-[2rem] border border-slate-100 dark:border-[#2e303a] shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                    <Layers className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-[#6b6375] font-black text-[10px] uppercase tracking-[0.2em] mb-1">Kurs Darajasi</h3>
                    <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {course.level || 'Boshlang\'ich'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Progress Visualization */}
            <div className="bg-white dark:bg-[#16171d] p-10 rounded-[2.5rem] border border-slate-100 dark:border-[#2e303a] shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#aa3bff]/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#aa3bff]" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Yutuqlar Yo'li</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-black text-[#aa3bff]">{progress}</span>
                  <span className="text-slate-400 font-black text-lg">%</span>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="relative flex justify-between">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-[#2e303a] -translate-y-1/2 z-0" />
                  <div 
                    className="absolute top-1/2 left-0 h-1 bg-[#aa3bff] shadow-[0_0_12px_#aa3bff] -translate-y-1/2 z-10 transition-all duration-1000 ease-out" 
                    style={{ width: `${progress}%` }} 
                  />
                  
                  {LEVELS.map((l, i) => {
                    const isReached = i <= levelIdx;
                    return (
                      <div key={l} className="relative z-20 flex flex-col items-center">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center border-4 transition-all duration-500",
                          isReached ? "bg-[#aa3bff] border-[#fefeff] dark:border-[#16171d] text-white scale-110 shadow-xl shadow-[#aa3bff]/20" : "bg-white dark:bg-[#2e303a] border-slate-100 dark:border-[#16171d] text-slate-300"
                        )}>
                          {isReached ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2 h-2 bg-current rounded-full" />}
                        </div>
                        <span className={cn(
                          "mt-4 text-[10px] font-black uppercase tracking-widest transition-colors duration-500 text-center max-w-[80px]",
                          isReached ? "text-[#aa3bff]" : "text-slate-400"
                        )}>{l}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Side */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Attendance Analytics */}
            {attendanceStats && (
              <div className="bg-slate-900 dark:bg-[#1f2028] p-8 rounded-[2.5rem] text-white overflow-hidden relative border border-white/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#aa3bff]/20 rounded-full blur-3xl -mr-16 -mt-16" />
                
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="font-black uppercase tracking-widest text-xs">Davomat Reytingi</h3>
                  </div>

                  <div className="flex flex-col items-center py-4">
                     <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90">
                           <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/10" />
                           <circle cx="80" cy="80" r="70" stroke="#10b981" strokeWidth="12" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * (attendanceStats.attendance_percentage || 0)) / 100} strokeLinecap="round" className="transition-all duration-1000 shadow-[0_0_20px_#10b981]" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-4xl font-black">{attendanceStats.attendance_percentage}%</span>
                           <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Natija</span>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 transition-transform hover:scale-105">
                       <p className="text-white/40 font-black text-[9px] uppercase tracking-[0.2em] mb-1">Darslar</p>
                       <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-emerald-400">{attendanceStats.present_count}</span>
                          <span className="text-[10px] font-black text-emerald-400/50 uppercase tracking-widest">Keldi</span>
                       </div>
                    </div>
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 transition-transform hover:scale-105">
                       <p className="text-white/40 font-black text-[9px] uppercase tracking-[0.2em] mb-1">Qolgan</p>
                       <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-red-400">{attendanceStats.absent_count}</span>
                          <span className="text-[10px] font-black text-red-400/50 uppercase tracking-widest">Dars</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Achievement / Tip Card */}
            <div className="bg-[#aa3bff]/5 p-8 rounded-[2.5rem] border border-[#aa3bff]/10 group hover:bg-[#aa3bff]/10 transition-all">
                <div className="flex items-start gap-5">
                   <div className="w-12 h-12 bg-[#aa3bff] rounded-2xl flex items-center justify-center shadow-lg shadow-[#aa3bff]/30 shrink-0 transform group-hover:rotate-12 transition-transform">
                      <Award className="w-6 h-6 text-white" />
                   </div>
                   <div className="space-y-2">
                       <h4 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-tight">Oylik Maqsad</h4>
                       <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">
                         Keyingi darajaga o'tish uchun imtihonlardan 85% dan yuqori natija ko'rsatishingiz zarur.
                       </p>
                       <button className="flex items-center gap-2 text-[#aa3bff] font-black text-[10px] uppercase tracking-widest pt-2 group-hover:gap-3 transition-all">
                          Portfolio Tekshirish <ChevronRight className="w-3 h-3" />
                       </button>
                   </div>
                </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-24 bg-white dark:bg-[#16171d] rounded-[3rem] border border-slate-100 dark:border-[#2e303a] shadow-sm">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tight">O'quv kursi topilmadi</h3>
          <p className="text-slate-300 dark:text-slate-500 font-bold mt-2">Siz hali biron bir guruhga biriktirilmagansiz.</p>
        </div>
      )}
    </div>
  );
};

export default CoursePage;
