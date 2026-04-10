import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { useStudentStore } from '../store/useStudentStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  Trophy, Calendar, Activity, Target, ChevronRight,
  AlertTriangle, Loader2, TrendingUp, Wallet, Sparkles,
  CalendarCheck, BookOpen, GraduationCap, Zap, Award
} from 'lucide-react';
import { cn } from '../lib/utils';
import { isPaymentPaid } from '../lib/paymentStatus';

const UserDashboard: React.FC = () => {
  const { exams, fetchExams, isLoading: examsLoading } = useExamStore();
  const { stats, fetchStats, fetchAttendance, fetchPayments, fetchNotifications, attendanceStats, payments, notifications } = useStudentStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
    fetchStats();
    fetchNotifications();
    if (user?.id) {
      fetchAttendance(user.id);
      fetchPayments(user.id);
    }
  }, [user?.id]);

  const safeExams = Array.isArray(exams) ? exams : [];
  const upcomingExams = safeExams.filter((e: any) => e.status !== 'COMPLETED').slice(0, 3);
  const recentResults = safeExams.filter((e: any) => e.status === 'COMPLETED').slice(0, 3);
  const unpaidPayments = payments.filter((p: any) => !isPaymentPaid(p.status));
  const hasAlerts = (stats?.missed_lessons || 0) > 3 || unpaidPayments.length > 0;

  const statItems = [
    { icon: Trophy, label: "O'rtacha ball", value: `${stats?.average_score || 0}%`, bg: 'bg-amber-100/50', icon_c: 'text-amber-600', trend: '+4%' },
    { icon: Target, label: 'Imtihonlar', value: stats?.total_exams || safeExams.length, bg: 'bg-[#aa3bff]/10', icon_c: 'text-[#aa3bff]', trend: '+2' },
    { icon: Activity, label: 'Davomat', value: `${attendanceStats?.attendance_percentage || stats?.attendance_percentage || 0}%`, bg: 'bg-emerald-100/50', icon_c: 'text-emerald-600', trend: '' },
    { icon: Calendar, label: "Qoldirilgan", value: stats?.missed_lessons || 0, bg: 'bg-red-100/50', icon_c: 'text-red-600', sub: 'dars', trend: '' },
  ];

  return (
    <div className="page-container space-y-8 pb-32 lg:pb-12 animate-in relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#aa3bff]/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
      
      {/* Greeting Banner */}
      <div className="bg-gradient-to-br from-[#aa3bff] via-[#9329e6] to-[#08060d] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-[#aa3bff]/20 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:scale-125 transition-transform duration-[2s]" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/5 rounded-full blur-[60px] -mb-24" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                 <Sparkles className="w-4 h-4 text-amber-400" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Talaba Dashbordi · v2.4</span>
              </div>
              <div>
                 <p className="text-[#ece0ff] text-lg font-medium opacity-80 mb-1">Xush kelibsiz! 👋</p>
                 <h1 className="text-5xl font-black tracking-tighter leading-none">{user?.first_name} {user?.last_name}</h1>
                 <p className="text-[#ece0ff] text-sm mt-4 font-bold uppercase tracking-widest opacity-60">Bugun ham jonboz bo'ling!</p>
              </div>
           </div>
           
           <div className="hidden lg:flex items-center gap-6 pr-4">
              <div className="text-right">
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Akademik Rank</p>
                 <p className="text-3xl font-black text-white tracking-tighter lowercase flex items-center justify-end gap-2">
                    <Award className="w-8 h-8 text-amber-400" />
                    Master
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* AI Humor Status */}
      {stats?.ai_status && (
        <div className="card p-6 bg-white/50 dark:bg-[#1f2028]/50 backdrop-blur-md border-[#e5e4e7] dark:border-[#2e303a] flex items-center gap-6 animate-in group">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10 group-hover:rotate-6 transition-transform">
            <Sparkles className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-[0.2em] mb-2 opacity-60 italic">AI Mission Control Feedback</p>
            <p className="text-lg font-bold text-[#08060d] dark:text-[#f3f4f6] italic leading-relaxed">
              "{stats.ai_status}"
            </p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {hasAlerts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(stats?.missed_lessons || 0) > 3 && (
            <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-5 flex items-center gap-4 shadow-xl shadow-amber-500/5">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                 <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
              </div>
              <p className="text-sm font-black text-amber-900 leading-tight">
                 Siz {stats?.missed_lessons} ta darsni qoldirdingiz. <br/>
                 <span className="text-[10px] uppercase opacity-60">Ehtiyotkor bo'ling!</span>
              </p>
            </div>
          )}
          {unpaidPayments.length > 0 && (
            <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-5 flex items-center gap-4 shadow-xl shadow-red-500/5">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                 <Wallet className="w-6 h-6 text-red-500 shrink-0" />
              </div>
              <p className="text-sm font-black text-red-900 leading-tight">
                 {unpaidPayments.length} ta oylik to'lov kutilmoqda. <br/>
                 <span className="text-[10px] uppercase opacity-60">Iltimos, o'z vaqtida to'lang.</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map(({ icon: Icon, label, value, bg, icon_c, sub, trend }) => (
          <div key={label} className="card p-8 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-500 relative overflow-hidden bg-white/60 dark:bg-[#1f2028]/60 backdrop-blur-md">
            <div className={`absolute top-0 right-0 w-24 h-24 ${bg} opacity-10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-[1.5s]`} />
            <div className={`w-16 h-16 ${bg} rounded-3xl flex items-center justify-center mb-6 ring-8 ring-white dark:ring-[#16171d] shadow-sm transition-all duration-500 group-hover:rotate-12 group-hover:scale-110`}>
              <Icon className={`w-8 h-8 ${icon_c}`} />
            </div>
            <p className="text-[11px] font-black text-[#6b6375] dark:text-[#9ca3af] uppercase tracking-[0.2em] mb-2">{label}</p>
            <div className="flex items-end justify-center gap-1.5">
              <p className="text-4xl font-black text-[#08060d] dark:text-white tabular-nums leading-none tracking-tighter">{value}</p>
              {sub && <p className="text-xs text-[#6b6375] font-black uppercase opacity-60 mb-0.5">{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button onClick={() => navigate('/attendance')} className="card p-8 flex items-center gap-6 hover:border-[#aa3bff] transition-all duration-500 group overflow-hidden relative bg-white dark:bg-[#1f2028]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700" />
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 rounded-[2rem] flex items-center justify-center shrink-0 ring-8 ring-emerald-50/30 dark:ring-emerald-900/10 group-hover:scale-110 transition-transform">
            <CalendarCheck className="w-10 h-10 text-emerald-500" />
          </div>
          <div className="text-left relative z-10 flex-1">
            <h3 className="text-2xl font-black text-[#08060d] dark:text-white leading-none tracking-tight mb-2">Davomat</h3>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{attendanceStats?.attendance_percentage || 0}% qatnashish koeffitsiyenti</p>
          </div>
          <div className="w-12 h-12 bg-[#f4f3ec] dark:bg-[#16171d] rounded-2xl flex items-center justify-center text-[#6b6375] group-hover:bg-[#aa3bff] group-hover:text-white transition-all duration-500 group-hover:translate-x-1">
             <ChevronRight className="w-6 h-6" />
          </div>
        </button>
        
        <button onClick={() => navigate('/course')} className="card p-8 flex items-center gap-6 hover:border-[#aa3bff] transition-all duration-500 group overflow-hidden relative bg-white dark:bg-[#1f2028]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#aa3bff]/5 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700" />
          <div className="w-20 h-20 bg-[#aa3bff]/10 dark:bg-[#aa3bff]/5 rounded-[2rem] flex items-center justify-center shrink-0 ring-8 ring-[#aa3bff]/5 group-hover:scale-110 transition-transform">
            <BookOpen className="w-10 h-10 text-[#aa3bff]" />
          </div>
          <div className="text-left relative z-10 flex-1">
            <h3 className="text-2xl font-black text-[#08060d] dark:text-white leading-none tracking-tight mb-2">Sening Kursing</h3>
            <p className="text-[10px] font-black text-[#6b6375] uppercase tracking-widest">Barcha o'quv resurslari</p>
          </div>
          <div className="w-12 h-12 bg-[#f4f3ec] dark:bg-[#16171d] rounded-2xl flex items-center justify-center text-[#6b6375] group-hover:bg-[#aa3bff] group-hover:text-white transition-all duration-500 group-hover:translate-x-1">
             <ChevronRight className="w-6 h-6" />
          </div>
        </button>
      </div>

      {/* Main Grid: Exams & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Upcoming Exams */}
         <section className="space-y-6">
           <div className="flex items-center justify-between">
             <h2 className="text-2xl font-black text-[#08060d] dark:text-white tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                   <Target className="w-6 h-6" />
                </div>
                Kelgusi imtihonlar
             </h2>
             <button onClick={() => navigate('/exams')} className="text-[10px] font-black text-[#aa3bff] uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-2">
                Barchasi <ChevronRight className="w-4 h-4" />
             </button>
           </div>

           {examsLoading ? (
             <div className="card p-12 flex justify-center bg-white/50"><Loader2 className="w-8 h-8 text-[#aa3bff] animate-spin" /></div>
           ) : upcomingExams.length > 0 ? (
             <div className="space-y-4">
               {upcomingExams.map((exam: any) => (
                 <button
                   key={exam.id}
                   onClick={() => navigate(`/exams/${exam.id}`)}
                   className="card group w-full p-6 flex items-center gap-6 text-left hover:border-[#aa3bff] transition-all duration-500 bg-white/60 hover:bg-white dark:bg-[#1f2028] dark:hover:bg-[#1f2028] relative overflow-hidden"
                 >
                   <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                     <Zap className="w-6 h-6 text-indigo-600" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="font-black text-[#08060d] dark:text-[#f3f4f6] truncate text-lg tracking-tight mb-1">{exam.title}</p>
                     <p className="text-[10px] font-black text-[#6b6375] uppercase tracking-widest opacity-60">
                       {Number(exam.duration ?? exam.time_limit ?? exam.duration_minutes) || 60} daqiqa · {exam.questions_count} ta savol
                     </p>
                   </div>
                   <span className="px-4 py-2 bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">Kutilmoqda</span>
                 </button>
               ))}
             </div>
           ) : (
             <div className="card p-16 text-center bg-[#f4f3ec]/30 dark:bg-[#1f2028]/30 border-dashed border-2">
               <TrendingUp className="w-12 h-12 text-[#6b6375] mx-auto mb-4 opacity-20" />
               <p className="text-[#6b6375] font-black uppercase tracking-[0.2em] text-xs opacity-40">Hozircha yangi imtihonlar yo'q</p>
             </div>
           )}
         </section>

         {/* Recent Results */}
         <section className="space-y-6">
           {recentResults.length > 0 && (
             <>
               <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-black text-[#08060d] dark:text-white tracking-tight flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                       <Trophy className="w-6 h-6" />
                    </div>
                    So'nggi natijalar
                 </h2>
               </div>
               <div className="space-y-4">
                 {recentResults.map((exam: any) => (
                   <button
                     key={exam.id}
                     onClick={() => navigate(`/exams/${exam.id}/result`)}
                     className="card group w-full p-6 flex items-center gap-6 text-left hover:border-emerald-500 transition-all duration-500 bg-white/60 hover:bg-white dark:bg-[#1f2028] relative overflow-hidden"
                   >
                     <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                       <Award className="w-6 h-6 text-emerald-500" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-black text-[#08060d] dark:text-[#f3f4f6] truncate text-lg tracking-tight mb-1">{exam.title}</p>
                       <p className="text-[10px] font-black text-[#6b6375] uppercase tracking-widest opacity-60">Imtihon muvaffaqiyatli topshirildi</p>
                     </div>
                     {(() => {
                       const sc = exam.score;
                       if (sc === null || sc === undefined || sc === '') return null;
                       const n = Math.round(Number(sc));
                       if (Number.isNaN(n)) return null;
                       return (
                         <div className="text-right">
                           <p className={cn(
                             "text-3xl font-black tabular-nums tracking-tighter",
                             n >= 70 ? 'text-emerald-600 shadow-emerald-500/10' : 'text-red-500 shadow-red-500/10'
                           )}>{n}%</p>
                         </div>
                       );
                     })()}
                   </button>
                 ))}
               </div>
             </>
           )}
         </section>
      </div>

      {/* AI Recommendation Banner */}
      <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-amber-500/20 group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-[3s]" />
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
               <div className="flex items-center gap-3 mb-6 bg-white/20 backdrop-blur-xl w-fit px-4 py-2 rounded-2xl border border-white/20">
                 <Sparkles className="w-5 h-5 animate-pulse" />
                 <span className="text-xs font-black uppercase tracking-[0.2em]">AI Tavsiya</span>
               </div>
               <h3 className="text-4xl font-black mb-4 leading-tight tracking-tighter">O'z bilimingni <br/> mustahkamla!</h3>
               <p className="text-lg font-medium leading-relaxed opacity-90 max-w-sm">
                 "Har kuni 30 daqiqa takrorlash natijangizni 40% gacha oshiradi. Bugun ham darslarni ko'zdan kechirib chiqing! 🚀"
               </p>
            </div>
            <div className="flex justify-end hidden md:flex">
               <GraduationCap className="w-48 h-48 opacity-20 transform rotate-12" />
            </div>
         </div>
      </div>
    </div>
  );
};

export default UserDashboard;

