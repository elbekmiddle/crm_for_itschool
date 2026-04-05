import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { useStudentStore } from '../store/useStudentStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  Trophy, Calendar, Activity, Target, ChevronRight,
  AlertTriangle, Loader2, TrendingUp, Wallet, Sparkles,
  CalendarCheck, BookOpen
} from 'lucide-react';

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
  const unpaidPayments = payments.filter((p: any) => p.status === 'UNPAID' || !p.status);
  const hasAlerts = (stats?.missed_lessons || 0) > 3 || unpaidPayments.length > 0;

  const statItems = [
    { icon: Trophy, label: "O'rtacha ball", value: `${stats?.average_score || 0}%`, bg: 'bg-amber-50', icon_c: 'text-amber-500', trend: '+4%' },
    { icon: Target, label: 'Imtihonlar', value: stats?.total_exams || safeExams.length, bg: 'bg-primary-50', icon_c: 'text-primary-500', trend: '+2' },
    { icon: Activity, label: 'Davomat', value: `${attendanceStats?.attendance_percentage || stats?.attendance_percentage || 0}%`, bg: 'bg-green-50', icon_c: 'text-green-500', trend: '' },
    { icon: Calendar, label: "Qoldirilgan", value: stats?.missed_lessons || 0, bg: 'bg-red-50', icon_c: 'text-red-500', sub: 'dars', trend: '' },
  ];

  return (
    <div className="page-container space-y-6 pb-20 lg:pb-6 animate-in">
      {/* Greeting */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full -mb-12" />
        <div className="relative z-10">
          <p className="text-primary-200 text-sm font-semibold mb-1">Xush kelibsiz! 👋</p>
          <h1 className="text-2xl font-black">{user?.first_name} {user?.last_name}</h1>
          <p className="text-primary-200 text-sm mt-1">Bugun ham jonboz bo'ling!</p>
        </div>
      </div>

      {/* AI Humor Status */}
      {stats?.ai_status && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4 animate-in">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest mb-0.5">AI Holat (Humor)</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 italic leading-relaxed">
              "{stats.ai_status}"
            </p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {hasAlerts && (
        <div className="space-y-2">
          {(stats?.missed_lessons || 0) > 3 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm font-semibold text-amber-800">Siz {stats?.missed_lessons} ta darsni qoldirdingiz. Ehtiyotkor bo'ling!</p>
            </div>
          )}
          {unpaidPayments.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm font-semibold text-red-800">{unpaidPayments.length} ta oylik to'lov qolgan. Iltimos to'lang.</p>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map(({ icon: Icon, label, value, bg, icon_c, sub, trend }) => (
          <div key={label} className="card p-6 flex flex-col items-center text-center group hover:-translate-y-1 transition-all duration-300">
            <div className={`w-16 h-16 ${bg} rounded-full flex items-center justify-center mb-4 ring-8 ring-white dark:ring-slate-800 shadow-sm transition-transform duration-500 group-hover:scale-110`}>
              <Icon className={`w-8 h-8 ${icon_c}`} />
            </div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-center justify-center gap-1">
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums leading-none">{value}</p>
              {sub && <p className="text-xs text-slate-400 font-bold self-end">{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={() => navigate('/attendance')} className="card p-5 flex items-center gap-5 hover:border-indigo-300 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-400/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
          <div className="w-14 h-14 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center shrink-0 ring-4 ring-green-50/50">
            <CalendarCheck className="w-7 h-7 text-green-500" />
          </div>
          <div className="text-left relative z-10">
            <p className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">Davomat</p>
            <p className="text-xs font-semibold text-green-600 mt-1">{attendanceStats?.attendance_percentage || 0}% qatnashish</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 ml-auto group-hover:translate-x-1 transition-transform" />
        </button>
        <button onClick={() => navigate('/course')} className="card p-5 flex items-center gap-5 hover:border-indigo-300 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-400/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
          <div className="w-14 h-14 bg-primary-50 dark:bg-primary-950/30 rounded-full flex items-center justify-center shrink-0 ring-4 ring-primary-50/50">
            <BookOpen className="w-7 h-7 text-primary-500" />
          </div>
          <div className="text-left relative z-10">
            <p className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">Kursim</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Dars ma'lumotlari</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 ml-auto group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Upcoming Exams */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">📝 Kelgusi imtihonlar</h2>
          <button onClick={() => navigate('/exams')} className="text-primary-600 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
            Barchasi <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {examsLoading ? (
          <div className="card p-8 flex justify-center"><Loader2 className="w-6 h-6 text-primary-400 animate-spin" /></div>
        ) : upcomingExams.length > 0 ? (
          <div className="space-y-2">
            {upcomingExams.map((exam: any) => (
              <button
                key={exam.id}
                onClick={() => navigate(`/exams/${exam.id}`)}
                className="card-hover w-full p-4 flex items-center gap-4 text-left"
              >
                <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm">{exam.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{exam.duration} daqiqa · {exam.questions_count} savol</p>
                </div>
                <span className="status-pill pill-pending shrink-0">Kutilmoqda</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <TrendingUp className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-semibold">Hozircha yangi imtihonlar yo'q</p>
          </div>
        )}
      </section>

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title">📊 So'nggi natijalar</h2>
          <div className="space-y-2">
            {recentResults.map((exam: any) => (
              <button
                key={exam.id}
                onClick={() => navigate(`/exams/${exam.id}/result`)}
                className="card-hover w-full p-4 flex items-center gap-4 text-left"
              >
                <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm">{exam.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Bajarildi</p>
                </div>
                {exam.score !== undefined && (
                  <div className="text-right">
                    <p className={`text-lg font-black ${exam.score >= 70 ? 'text-green-600' : 'text-red-500'}`}>{exam.score}%</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* AI Tip */}
      {/* <div className="bg-gradient-to-br from-amber-400 -pt-10 to-orange-500 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">AI Tavsiya</span>
        </div>
        <p className="text-sm font-semibold leading-relaxed opacity-95">
          "Har kuni 30 daqiqa takrorlash natijangizni 40% ga oshiradi. Bugungi imtihonga tayyorlanishni boshlang! 🚀"
        </p>
      </div> */}
    </div>
  );
};

export default UserDashboard;
