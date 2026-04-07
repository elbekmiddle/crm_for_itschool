import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import { formatPersonName } from '../lib/displayName';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  Users, BookOpen, UserCheck, Wallet,
  TrendingUp, Sparkles, ChevronRight,
  Loader2, BarChart3, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

/* ─── Stat Card ─── */
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  danger?: boolean;
}> = ({ icon, label, value, trend, trendUp, danger }) => (
  <div className={cn("card p-5 flex flex-col gap-3", danger && "border-red-200 bg-red-50/30")}>
    <div className="flex items-center justify-between">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", danger ? "bg-red-100" : "bg-primary-50")}>
        {icon}
      </div>
      {trend && (
        <span className={cn("stat-badge", trendUp ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500")}>
          {trend}
        </span>
      )}
      {danger && <span className="stat-badge bg-red-100 text-red-500">Action Required ❗</span>}
    </div>
    <p className="label-subtle">{label}</p>
    <p className={cn("text-3xl font-black tracking-tight", danger ? "text-red-600" : "text-slate-800")}>{value}</p>
  </div>
);

const courseEngagementPct = (course: any) => {
  const sc = Number(course?.student_count) || 0;
  if (sc <= 0) return 0;
  const cap = Number(course?.max_students) || 28;
  return Math.min(100, Math.round((sc / Math.max(cap, 1)) * 100));
};

const Dashboard: React.FC = () => {
  const { user, stats, courses, groups, fetchStats, fetchCourses, fetchGroups, fetchTeacherDashboard, isLoading } = useAdminStore();
  const navigate = useNavigate();
  const [view, setView] = useState<'daily' | 'monthly'>('daily');
  const [teacherData, setTeacherData] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
      fetchStats();
      fetchCourses();
      fetchGroups();
    } else if (user?.role === 'TEACHER') {
      fetchTeacherDashboard().then(setTeacherData);
      fetchGroups();
    }
  }, [user?.role]);

  if (isLoading && (!stats && !teacherData)) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  // ──── Teacher Dashboard View ────
  if (user?.role === 'TEACHER') {
    return (
      <div className="page-container animate-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">O'qituvchi Kabineti</h1>
            <p className="text-sm text-slate-400 mt-0.5">Xush kelibsiz, {user.first_name}! Bugun darslaringizni boshqarishingiz mumkin.</p>
          </div>
          <div className="bg-primary-50 px-4 py-2 rounded-xl border border-primary-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-bold text-primary-700">{new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 bg-gradient-to-br from-primary-600 to-primary-800 text-white border-0">
             <p className="text-xs font-bold uppercase tracking-widest opacity-80">Mening Guruhlarim</p>
             <p className="text-4xl font-black mt-2">{teacherData?.totalGroups || groups.length}</p>
             <div className="mt-4 flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-primary-700 bg-primary-400 flex items-center justify-center text-[10px] font-bold">G{i}</div>
                ))}
             </div>
          </div>
          <div className="card p-6 border-slate-100">
             <p className="label-subtle">Jami Talabalarim</p>
             <p className="text-3xl font-black text-slate-800 mt-1">{teacherData?.totalStudents || 0}</p>
             <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
               <TrendingUp className="w-3 h-3" /> Faol o'sish
             </p>
          </div>
          <div className="card p-6 border-slate-100">
             <p className="label-subtle">O'rtacha Davomat</p>
             <p className="text-3xl font-black text-slate-800 mt-1">{teacherData?.avgAttendance || 0}%</p>
             <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3">
               <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${teacherData?.avgAttendance || 0}%` }} />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <h2 className="section-title mb-5">Bugungi Darslar & Davomat</h2>
                <div className="space-y-4">
                  {groups.slice(0, 3).map((g: any) => (
                    <div key={g.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:border-primary-100 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-primary-600 font-black group-hover:bg-primary-100 transition-all">
                          {g.name?.[0] || 'G'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">{g.name}</p>
                          <p className="text-xs text-slate-400">{g.course_name} • {g.student_count || 0} talaba</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate('/attendance')}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-primary-600 hover:text-white transition-all"
                      >
                        Davomat belgilash
                      </button>
                    </div>
                  ))}
                  {groups.length === 0 && <p className="text-center py-8 text-slate-400 text-sm italic">Hozircha guruhlaringiz yo'q</p>}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="section-title mb-5">Yaqinda o'tkazilgan imtihonlar</h2>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                         <th className="pb-3">Imtihon</th>
                         <th className="pb-3">Guruh</th>
                         <th className="pb-3 text-center">Natija (Avg)</th>
                         <th className="pb-3">Sana</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {(teacherData?.recentExams || []).map((ex: any) => (
                          <tr key={ex.id} className="text-sm">
                            <td className="py-4 font-bold text-slate-700">{ex.title}</td>
                            <td className="py-4 text-slate-500">{ex.group_name}</td>
                            <td className="py-4 text-center">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold">{ex.avg_score}%</span>
                            </td>
                            <td className="py-4 text-slate-400 text-xs">{new Date(ex.date).toLocaleDateString()}</td>
                          </tr>
                        ))}
                        {(!teacherData?.recentExams || teacherData?.recentExams.length === 0) && (
                          <tr><td colSpan={4} className="py-8 text-center text-slate-400 italic">Imtihonlar yo'q</td></tr>
                        )}
                     </tbody>
                   </table>
                </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="card p-6 bg-amber-50 border-amber-100">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-black text-amber-800 uppercase tracking-tight">Bugungi eslatma</h3>
                </div>
                <p className="text-sm text-amber-700 leading-relaxed font-medium">
                  "{user.first_name}, bugun <strong>{groups[0]?.name || 'Glavniy guruh'}</strong> bilan oraliq nazorat darsi bor. Savollarni tayyorlab qo'yishni unutmang!"
                </p>
              </div>

              <div className="card p-6">
                 <h3 className="section-title mb-4">Top Talabalar (Sizning guruhlar)</h3>
                 <div className="space-y-4">
                    {(teacherData?.topStudents || []).map((s: any, i: number) => (
                      <div key={s.id} className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-bold text-primary-700">{i+1}</div>
                         <div className="flex-1">
                            <p className="text-sm font-bold text-slate-700">{s.first_name} {s.last_name}</p>
                            <p className="text-[10px] text-slate-400">{s.avg_score}% o'rtacha ball</p>
                         </div>
                      </div>
                    ))}
                    {(!teacherData?.topStudents || teacherData?.topStudents.length === 0) && (
                      <p className="text-center py-4 text-slate-400 text-xs">Ma'lumot topilmadi</p>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // ──── Student Dashboard View ────
  if (user?.role === 'STUDENT') {
    return (
      <div className="page-container animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Mening Kabinetim</h1>
            <p className="text-sm text-slate-400 mt-0.5">Xush kelibsiz, {user.first_name}! Bilim olishda davom eting! ✨</p>
          </div>
          <div className="flex gap-2">
             <button onClick={() => navigate('/student/profile')} className="btn-secondary py-2 text-xs">Profilni tahrirlash</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 bg-gradient-to-br from-indigo-600 to-primary-700 text-white border-0 shadow-xl shadow-primary-100">
             <p className="text-xs font-bold uppercase tracking-widest opacity-80">O'rtacha Ball</p>
             <p className="text-4xl font-black mt-2">84%</p>
             <p className="text-xs mt-4 opacity-70 font-medium">Siz 12 ta talaba orasida 3-o'rindasiz! 🏆</p>
          </div>
          <div className="card p-6">
             <p className="label-subtle">Davomat</p>
             <p className="text-3xl font-black text-slate-800 mt-1">92%</p>
             <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
               <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '92%' }} />
             </div>
          </div>
          <div className="card p-6">
             <p className="label-subtle">Sertifikatgacha</p>
             <p className="text-3xl font-black text-slate-800 mt-1">14 dars</p>
             <p className="text-xs text-primary-600 font-bold mt-2 flex items-center gap-1">
               Kursning 65% qismi yakunlandi
             </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                 <div className="flex items-center justify-between mb-6">
                   <h2 className="section-title">Kutilayotgan Imtihonlar</h2>
                   <button onClick={() => navigate('/student/exams')} className="text-xs font-bold text-primary-600 hover:underline">Hammasini ko'rish</button>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-primary-50/50 border border-primary-100 group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm">
                             <BookOpen className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="font-bold text-slate-700">JavaScript Basics - Final</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">30 daqiqa • 20 savol</p>
                          </div>
                       </div>
                       <button onClick={() => navigate('/student/exams')} className="w-9 h-9 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-primary-200 hover:scale-110 transition-all">
                          <ChevronRight className="w-5 h-5" />
                       </button>
                    </div>
                    {/* Placeholder for now, will be dynamic when real data comes */}
                 </div>
              </div>

              <div className="card p-6">
                 <h2 className="section-title mb-5">Oxirgi natijalar</h2>
                 <div className="space-y-4">
                    {[
                      { title: 'Oylik test #2', score: 95, date: '2024-03-15', status: 'passed' },
                      { title: 'Amaliy vazifa: React', score: 78, date: '2024-03-10', status: 'passed' },
                    ].map((res, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                               <BarChart3 className="w-4 h-4" />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-slate-700">{res.title}</p>
                               <p className="text-[10px] text-slate-400">{new Date(res.date).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-black text-primary-600">{res.score}%</p>
                            <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">O'tdi</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="card p-6 bg-slate-900 border-0 text-white overflow-hidden relative">
                 <div className="relative z-10">
                    <h3 className="text-lg font-black mb-1">Guruhdoshingiz!</h3>
                    <p className="text-xs text-slate-400 mb-4 font-medium opacity-80">Bugun guruhda 3 kishi tug'ilgan kunini nishonlamoqda.</p>
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => (
                         <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-800 bg-slate-700" />
                       ))}
                       <div className="w-8 h-8 rounded-full border-2 border-slate-800 bg-primary-600 flex items-center justify-center text-[10px] font-bold">+2</div>
                    </div>
                 </div>
              </div>

              <div className="card p-6">
                 <h3 className="section-title mb-4">Mening Kursim</h3>
                 <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Foundation</p>
                    <p className="text-sm font-black text-slate-700 mb-3">Frontend Web Development</p>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
                       <span>Progress</span>
                       <span className="text-primary-600">65%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full">
                       <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: '65%' }} />
                    </div>
                 </div>
              </div>

              <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 text-white shadow-xl shadow-amber-100">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Motivatsiya ✨</span>
                </div>
                <p className="text-sm font-bold leading-relaxed">
                  "Har bir qiyinchilik - bu mahorat cho'qqisiga yetish uchun navbatdagi qadam. To'xtamang!"
                </p>
              </div>
           </div>
        </div>
      </div>
    );
  }
  return (
    <div className="page-container animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            {user?.role === 'ADMIN' ? 'Admin Dashboard' : 'Manager Dashboard'}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Raqamli sinf xonangiz haqida umumiy ma'lumot.</p>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button onClick={() => setView('daily')} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", view === 'daily' ? "bg-white shadow-sm text-slate-700" : "text-slate-400")}>
            Kunlik
          </button>
          <button onClick={() => setView('monthly')} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", view === 'monthly' ? "bg-white shadow-sm text-slate-700" : "text-slate-400")}>
            Oylik
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Users className="w-5 h-5 text-primary-600" />}
          label="Jami talabalar"
          value={stats?.totalStudents ?? 0}
          trend="+12%"
          trendUp
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-primary-600" />}
          label="Faol kurslar"
          value={stats?.totalCourses ?? courses.length ?? 0}
          trend="Stable"
        />
        <StatCard
          icon={<UserCheck className="w-5 h-5 text-primary-600" />}
          label="Faol guruhlar"
          value={stats?.totalGroups ?? groups.length ?? 0}
          trend={groups.length > 0 ? `+${Math.min(groups.length, 2)} new` : ''}
          trendUp
        />
        <StatCard
          icon={<Wallet className="w-5 h-5 text-red-500" />}
          label="Kutilayotgan to'lovlar"
          value={stats?.pendingPayments ?? 0}
          danger
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Courses */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">Mening Kurslarim</h2>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    user?.role === 'MANAGER'
                      ? '/manager/courses'
                      : user?.role === 'TEACHER'
                        ? '/teacher/groups'
                        : '/admin/courses',
                  )
                }
                className="text-sm font-bold text-primary-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Barchasini ko'rish <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.slice(0, 4).map((course: any) => (
                <div key={course.id} className="card-hover p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-700 truncate">{course.name}</p>
                      <p className="text-xs text-slate-400">{course.student_count || 0} ta talaba</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">To'ldirish (talaba / guruh)</span>
                    <span className="font-bold text-primary-600">{courseEngagementPct(course)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${courseEngagementPct(course)}%` }}
                    />
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <div className="col-span-2 text-center py-8 text-slate-400 text-sm">Kurslar topilmadi</div>
              )}
            </div>
          </div>

          {/* Activity from analytics (student registrations by month) */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title">Faollik</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  O'rtacha davomat (30 kun):{' '}
                  <span className="text-green-600 font-bold">{stats?.attendanceAvg ?? 0}%</span>
                </p>
              </div>
              <div className="bg-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500">So'nggi 6 oy</div>
            </div>
            <div className="h-48">
              {(stats?.growthTrend || []).length > 0 ? (
                <Line
                  data={{
                    labels: stats!.growthTrend!.map((g: any) => g.month),
                    datasets: [
                      {
                        label: "Yangi talabalar",
                        data: stats!.growthTrend!.map((g: any) => g.count),
                        borderColor: '#9329e6',
                        backgroundColor: 'rgba(147, 41, 230, 0.08)',
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Ma'lumot yo'q</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Active Groups */}
          <div className="card p-6">
            <h2 className="section-title mb-4">Faol Guruhlar</h2>
            <div className="space-y-3">
              {groups.slice(0, 4).map((group: any) => (
                <div
                  key={group.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                  onClick={() => navigate(user?.role === 'MANAGER' ? '/manager/groups' : user?.role === 'TEACHER' ? '/teacher/groups' : '/groups')}
                >
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-primary-600">
                    {group.name?.[0] || 'G'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">{group.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {group.student_count || 0} ta talaba
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              ))}
              {groups.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Guruhlar yo'q</p>}
            </div>
            {user?.role === 'TEACHER' && (
              <button
                type="button"
                onClick={() => navigate('/teacher/groups')}
                className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-400 hover:border-primary-300 hover:text-primary-600 transition-all cursor-pointer"
              >
                + Yangi Guruh
              </button>
            )}
          </div>

          {/* Insight from real stats */}
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">AI Insight</span>
            </div>
            <p className="text-sm font-semibold leading-relaxed opacity-95">
              O'rtacha davomat: <strong>{stats?.attendanceAvg ?? 0}%</strong>.{' '}
              {stats?.topStudents?.[0] ? (
                <>
                  Eng yuqori natija:{' '}
                  <strong>
                    {formatPersonName(
                      stats.topStudents[0].first_name,
                      stats.topStudents[0].last_name,
                      stats.topStudents[0].email,
                    )}
                  </strong>
                  .
                </>
              ) : (
                'Hozircha tahlil uchun yetarli ma\'lumot yo\'q.'
              )}
            </p>
          </div>

          {/* Support */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-black">Yordam kerakmi? 🏖</h3>
            <p className="text-sm text-primary-200 mt-1">Bizning qo'llab-quvvatlash jamoasi onlayn.</p>
            <button className="mt-4 px-5 py-2.5 bg-white text-primary-700 rounded-xl text-sm font-bold hover:bg-primary-50 transition-all">
              Bog'lanish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
