import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { useStudentStore } from '../store/useStudentStore';
import api from '../lib/api';
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
import { LINE_PRIMARY, primaryGrowthDataset, standardLineChartOptions } from '../lib/chartLineTheme';
import {
  Users, BookOpen, UserCheck, Wallet,
  TrendingUp, Sparkles, ChevronRight,
  Loader2, LineChart, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatUzbekDayMonthYear } from '../lib/uzbekDate';

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
  const { exams: studentExams, fetchExams } = useStudentStore();
  const navigate = useNavigate();
  const [view, setView] = useState<'daily' | 'monthly'>('daily');
  const [teacherData, setTeacherData] = useState<any>(null);
  const [studentAnalytics, setStudentAnalytics] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchStats();
      fetchCourses();
      fetchGroups();
    } else if (user?.role === 'MANAGER') {
      fetchStats();
    } else if (user?.role === 'TEACHER') {
      fetchTeacherDashboard().then(setTeacherData);
      fetchGroups();
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'STUDENT') return;
    let cancelled = false;
    (async () => {
      try {
        const [anRes] = await Promise.all([api.get('/analytics/student/me'), fetchExams()]);
        if (!cancelled) setStudentAnalytics(anRes.data);
      } catch {
        if (!cancelled) setStudentAnalytics(null);
      }
    })();
    return () => {
      cancelled = true;
    };
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
          <div className="bg-primary-50 px-4 py-2 rounded-xl border border-primary-100 flex items-center gap-2 dark:border-primary-900/40 dark:bg-primary-900/30">
            <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-300" />
            <span className="text-xs font-bold text-primary-700 dark:text-primary-200">
              {formatUzbekDayMonthYear(new Date())}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 bg-gradient-to-br from-primary-600 to-primary-800 text-white border-0">
             <p className="text-xs font-bold uppercase tracking-widest opacity-80">Mening Guruhlarim</p>
             <p className="text-4xl font-black mt-2">{teacherData?.totalGroups || groups.length}</p>
             <div className="mt-4 flex -space-x-2 flex-wrap gap-y-2">
                {(groups.length ? groups : teacherData?.groups || []).slice(0, 6).map((g: any) => (
                  <div
                    key={g.id}
                    title={g.name}
                    className="w-8 h-8 rounded-full border-2 border-primary-700 bg-primary-400 flex items-center justify-center text-[9px] font-bold uppercase"
                  >
                    {(g.name || 'G').slice(0, 2)}
                  </div>
                ))}
                {groups.length === 0 && (!teacherData?.groups || teacherData.groups.length === 0) && (
                  <span className="text-[10px] font-bold opacity-70">Guruh yo‘q</span>
                )}
             </div>
          </div>
          <div className="card border-slate-100 p-6 dark:border-[var(--border)] dark:bg-[var(--bg-card)]">
             <p className="label-subtle">Jami Talabalarim</p>
             <p className="text-3xl font-black text-slate-800 dark:text-[var(--text-h)] mt-1">{teacherData?.totalStudents || 0}</p>
             <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1 dark:text-emerald-400">
               <TrendingUp className="w-3 h-3" /> Faol o'sish
             </p>
          </div>
          <div className="card border-slate-100 p-6 dark:border-[var(--border)] dark:bg-[var(--bg-card)]">
             <p className="label-subtle">O'rtacha Davomat</p>
             <p className="text-3xl font-black text-slate-800 dark:text-[var(--text-h)] mt-1">{teacherData?.avgAttendance || 0}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              <div className="card p-6 dark:border-[var(--border)] dark:bg-[var(--bg-card)]">
                <h2 className="section-title mb-5">Bugungi Darslar & Davomat</h2>
                <div className="space-y-4">
                  {groups.slice(0, 3).map((g: any) => (
                    <div
                      key={g.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/teacher/attendance?group=${g.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/teacher/attendance?group=${g.id}`);
                        }
                      }}
                      className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-50 p-4 transition-all hover:border-primary-100 dark:border-[var(--border)] dark:hover:border-primary-800"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 font-black text-primary-600 transition-all group-hover:bg-primary-100 dark:bg-[var(--bg-muted)] dark:text-primary-300">
                          {g.name?.[0] || 'G'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 dark:text-[var(--text-h)]">{g.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {g.course_name} • {g.student_count || 0} talaba
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/teacher/attendance?group=${g.id}`);
                        }}
                        className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-primary-600 hover:text-white dark:bg-[var(--bg-muted)] dark:text-[var(--text-h)]"
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
                            <td className="py-4 text-slate-600">
                              {ex.group_name ? (
                                <>
                                  <span className="font-semibold text-slate-800">{ex.group_name}</span>
                                  {ex.course_name ? (
                                    <span className="block text-[10px] text-slate-400 mt-0.5">{ex.course_name}</span>
                                  ) : null}
                                </>
                              ) : (
                                <>
                                  <span className="text-slate-400">—</span>
                                  {ex.course_name ? (
                                    <span className="block text-[10px] text-slate-400 mt-0.5">{ex.course_name}</span>
                                  ) : null}
                                  {ex.course_name ? (
                                    <span className="block text-[10px] text-amber-600/90 mt-0.5">Guruh tanlanmagan</span>
                                  ) : null}
                                </>
                              )}
                            </td>
                            <td className="py-4 text-center">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold">{ex.avg_score}%</span>
                            </td>
                            <td className="py-4 text-slate-400 text-xs">
                              {ex.date ? formatUzbekDayMonthYear(new Date(ex.date)) : '—'}
                            </td>
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

              <div className="card p-6 dark:border-[var(--border)] dark:bg-[var(--bg-card)]">
                 <h3 className="section-title mb-4">Top talabalar (davomat bo‘yicha)</h3>
                 <div className="space-y-4">
                    {(teacherData?.topStudents || []).map((s: any, i: number) => (
                      <div key={s.id} className="flex items-center gap-3">
                         <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700 dark:bg-primary-900/50 dark:text-primary-200">{i+1}</div>
                         <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-700 dark:text-[var(--text-h)]">{s.first_name} {s.last_name}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              {s.attendance_pct != null
                                ? `${s.attendance_pct}% davomat (${Number(s.attended) || 0} kelgan / ${Number(s.missed) || 0} kelmagan)`
                                : "Hozircha davomat yozuvlari yo'q"}
                            </p>
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
    const sa = studentAnalytics;
    const sum = sa?.attendance_summary || [];
    const presentN = Number(sum.find((x: any) => String(x.status).toUpperCase() === 'PRESENT')?.count) || 0;
    const absentN = Number(sum.find((x: any) => String(x.status).toUpperCase() === 'ABSENT')?.count) || 0;
    const totalA = presentN + absentN;
    const attPct = totalA > 0 ? Math.round((presentN / totalA) * 100) : null;
    const examResults = Array.isArray(sa?.exam_results) ? sa.exam_results : [];
    const avgExam =
      examResults.length > 0
        ? Math.round(examResults.reduce((a: number, r: any) => a + Number(r.score ?? 0), 0) / examResults.length)
        : null;
    const pendingExams = studentExams
      .filter((e: any) => !(e.status === 'completed' || Number(e.attemptCount) > 0))
      .slice(0, 4);
    const showPending = pendingExams.length ? pendingExams : studentExams.slice(0, 3);
    const aiText = sa?.ai_humor && String(sa.ai_humor).trim();
    const pi = sa?.personal_info;
    const courseLabel = pi?.course_name || 'Kurs';

    return (
      <div className="page-container animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Mening Kabinetim</h1>
            <p className="text-sm text-slate-400 mt-0.5">Xush kelibsiz, {user.first_name}! Bilim olishda davom eting! ✨</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => navigate('/student/profile')} className="btn-secondary py-2 text-xs">
              Profil
            </button>
            <button type="button" onClick={() => navigate('/student/exams')} className="btn-primary py-2 text-xs">
              Imtihonlar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 bg-gradient-to-br from-indigo-600 to-primary-700 text-white border-0 shadow-xl shadow-primary-100">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">O'rtacha imtihon</p>
            <p className="text-4xl font-black mt-2">{avgExam != null ? `${avgExam}%` : '—'}</p>
            <p className="text-xs mt-4 opacity-70 font-medium">
              {examResults.length > 0 ? `${examResults.length} ta topshirilgan imtihon` : 'Natijalar hali qo‘shilmagan'}
            </p>
          </div>
          <div className="card p-6">
            <p className="label-subtle">Davomat</p>
            <p className="text-3xl font-black text-slate-800 dark:text-[var(--text-h)] mt-1">{attPct != null ? `${attPct}%` : '—'}</p>
            {totalA > 0 && (
              <p className="text-[10px] text-slate-400 mt-2 font-bold">
                {presentN} kelgan / {absentN} qolmagan
              </p>
            )}
          </div>
          <div className="card p-6">
            <p className="label-subtle">To'lovlar (jami)</p>
            <p className="text-3xl font-black text-slate-800 mt-1 tabular-nums">
              {sa?.total_paid != null ? Number(sa.total_paid).toLocaleString('uz-UZ') : '—'}
            </p>
            <p className="text-xs text-primary-600 font-bold mt-2">so'm</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="section-title">Imtihonlar</h2>
                <button type="button" onClick={() => navigate('/student/exams')} className="text-xs font-bold text-primary-600 hover:underline">
                  Hammasi
                </button>
              </div>
              <div className="space-y-4">
                {showPending.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">Hozircha imtihonlar ro'yxati bo'sh</p>
                ) : (
                  showPending.map((exam: any) => (
                    <div
                      key={exam.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-primary-50/50 border border-primary-100 group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-700 truncate">{exam.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {exam.duration_minutes ?? '—'} daqiqa • {exam.questions_count ?? '?'} savol
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/student/exams')}
                        className="w-9 h-9 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-primary-200 hover:scale-110 transition-all shrink-0"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="section-title mb-5">Oxirgi natijalar</h2>
              <div className="space-y-4">
                {examResults.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">Hozircha natija yo'q</p>
                ) : (
                  examResults.slice(0, 6).map((res: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <LineChart className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-700 truncate">{res.title}</p>
                          <p className="text-[10px] text-slate-400">
                            {res.submitted_at ? new Date(res.submitted_at).toLocaleDateString('uz-UZ') : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-primary-600">{Number(res.score ?? 0)}%</p>
                        <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Topshirildi</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="section-title mb-4">Mening kursim</h3>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Yo'nalish</p>
                <p className="text-sm font-black text-slate-700 mb-3">{courseLabel}</p>
                <p className="text-xs text-slate-500">Ma'lumotlar profil va CRM bilan yangilanadi.</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 text-white shadow-xl shadow-amber-100">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">AI yordamchi</span>
              </div>
              <p className="text-sm font-bold leading-relaxed">
                {aiText ||
                  `Har bir qiyinchilik — mahorat cho'qqisiga qadam. Davom eting, ${user.first_name || 'talaba'}!`}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const isManager = user?.role === 'MANAGER';

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
      <div
        className={cn(
          'grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2',
          isManager ? 'lg:grid-cols-2' : 'lg:grid-cols-4',
        )}
      >
        <StatCard
          icon={<Users className="w-5 h-5 text-primary-600" />}
          label="Jami talabalar"
          value={stats?.totalStudents ?? 0}
          trend="+12%"
          trendUp
        />
        {!isManager && (
          <StatCard
            icon={<BookOpen className="w-5 h-5 text-primary-600" />}
            label="Faol kurslar"
            value={stats?.totalCourses ?? courses.length ?? 0}
            trend="Stable"
          />
        )}
        {!isManager && (
          <StatCard
            icon={<UserCheck className="w-5 h-5 text-primary-600" />}
            label="Faol guruhlar"
            value={stats?.totalGroups ?? groups.length ?? 0}
            trend={groups.length > 0 ? `+${Math.min(groups.length, 2)} new` : ''}
            trendUp
          />
        )}
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
          {!isManager && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="section-title">Mening Kurslarim</h2>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      user?.role === 'TEACHER' ? '/teacher/groups' : '/admin/courses',
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
                  </div>
                ))}
                {courses.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-slate-400 text-sm">Kurslar topilmadi</div>
                )}
              </div>
            </div>
          )}

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
                      primaryGrowthDataset(
                        'Yangi talabalar',
                        stats!.growthTrend!.map((g: any) => g.count),
                        { borderColor: LINE_PRIMARY, tension: 0.35 },
                      ),
                    ],
                  }}
                  options={(() => {
                    const base = standardLineChartOptions();
                    const counts = stats!.growthTrend!.map((g: any) => Number(g.count) || 0);
                    return {
                      ...base,
                      scales: {
                        ...(base.scales as object),
                        y: {
                          ...(base.scales as { y: Record<string, unknown> }).y,
                          suggestedMax: Math.max(4, ...counts, 1),
                        },
                      },
                    };
                  })()}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Ma'lumot yo'q</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {!isManager && (
            <div className="card p-6">
              <h2 className="section-title mb-4">Faol Guruhlar</h2>
              <div className="space-y-3">
                {groups.slice(0, 4).map((group: any) => (
                  <div
                    key={group.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                    onClick={() =>
                      navigate(user?.role === 'TEACHER' ? '/teacher/groups' : '/admin/groups')
                    }
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
          )}

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

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
