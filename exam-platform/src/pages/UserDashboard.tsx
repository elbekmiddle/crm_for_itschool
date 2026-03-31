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
  const { stats, fetchStats, fetchAttendance, fetchPayments, attendanceStats, payments } = useStudentStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
    fetchStats();
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statItems.map(({ icon: Icon, label, value, bg, icon_c, sub, trend }) => (
          <div key={label} className="card p-4">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${icon_c}`} />
            </div>
            <p className="label-subtle mb-1">{label}</p>
            <div className="flex items-end gap-1">
              <p className="text-2xl font-black text-slate-800">{value}</p>
              {sub && <p className="text-xs text-slate-400 mb-0.5 font-semibold">{sub}</p>}
            </div>
            {trend && <p className="text-[10px] text-green-600 font-bold mt-1">↑ {trend} bu hafta</p>}
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/attendance')} className="card-hover p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">Davomat</p>
            <p className="text-[11px] text-slate-400">{attendanceStats?.attendance_percentage || 0}% hozir</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
        </button>
        <button onClick={() => navigate('/course')} className="card-hover p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">Kursim</p>
            <p className="text-[11px] text-slate-400">Ma'lumotlarni ko'ring</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
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
                  <p className="font-bold text-slate-800 truncate text-sm">{exam.title}</p>
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
                  <p className="font-bold text-slate-800 truncate text-sm">{exam.title}</p>
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
