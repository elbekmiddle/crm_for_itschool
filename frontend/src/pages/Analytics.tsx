import React, { useEffect, useMemo } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import {
  TrendingUp, Users, GraduationCap, DollarSign,
  AlertTriangle, Download, Sparkles, BarChart3
} from 'lucide-react';
import { cn } from '../lib/utils';
import MiniGrowthChart from '../components/charts/MiniGrowthChart';

const AnalyticsPage: React.FC = () => {
  const { stats, students, courses, fetchStats, fetchStudents, fetchCourses } = useAdminStore();

  useEffect(() => { fetchStats(); fetchStudents(); fetchCourses(); }, []);

  const growthTrend = stats?.growthTrend || [];
  const topStudents = stats?.topStudents || [];
  const aiInsight = useMemo(() => {
    const fromApi = stats?.ai_insight && String(stats.ai_insight).trim();
    if (fromApi) return fromApi;
    const top = stats?.topCourses?.[0];
    if (!top?.name) return "Hozircha kurs bo'yicha yetarli statistik ma'lumot yo'q.";
    const n = Number(top.student_count) || 0;
    return `${top.name} — ${n} ta faol talaba bilan eng ko'p tanlangan yo'nalish.`;
  }, [stats?.ai_insight, stats?.topCourses]);

  return (
    <div className="page-container animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="label-subtle mb-1">SCHOLAR FLOW › ANALYTICS</p>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Hisobotlar & Analitika</h1>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2"><Download className="w-4 h-4" /> PDF Hisobot</button>
          <button className="btn-primary flex items-center gap-2"><Download className="w-4 h-4" /> Export CSV</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-primary-600" /></div>
            <span className="stat-badge bg-green-50 text-green-600">Active</span>
          </div>
          <p className="label-subtle">Jami ro'yxat</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{stats?.totalStudents || 0}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center"><GraduationCap className="w-5 h-5 text-green-600" /></div>
            <span className="stat-badge bg-green-50 text-green-600">Stable</span>
          </div>
          <p className="label-subtle">O'rtacha Davomat</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{stats?.attendanceAvg || 0}%</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
            <span className="stat-badge bg-green-50 text-green-600">Real-time</span>
          </div>
          <p className="label-subtle">Jami Daromad</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{((stats?.totalRevenue || 0) / 1e6).toFixed(1)}M</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
          </div>
          <p className="label-subtle">Kutilayotgan to'lovlar</p>
          <p className="text-3xl font-black text-red-500 mt-1">{stats?.pendingPayments || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title">O'sish Tendentsiyasi</h2>
              <p className="text-xs text-slate-400 mt-0.5">Yangi ro'yxatga olishlar (so'nggi 6 oy)</p>
            </div>
            <div className="bg-slate-100 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">So'nggi 6 oy</div>
          </div>

          <div className="h-52 w-full min-h-[13rem]">
            <MiniGrowthChart
              trend={growthTrend}
              title=""
              subtitle=""
              height={208}
              className="border-0 p-0 bg-transparent shadow-none"
            />
          </div>
        </div>

        {/* Top Courses */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Eng mashhur kurslar</h2>
          <div className="space-y-4">
            {(stats?.topCourses || []).map((c: any, i: number) => {
              const maxCount = stats?.topCourses?.[0]?.student_count || 1;
              const rev = Math.round((Number(c.student_count) / maxCount) * 100) || 5;
              return (
                <div key={c.id || i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-600 truncate flex-1">{c.name}</span>
                    <span className="font-bold text-slate-700 ml-2">{c.student_count || 0} ta</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={cn("h-2 rounded-full", i === 0 ? "bg-primary-500" : i === 1 ? "bg-green-500" : i === 2 ? "bg-amber-500" : i === 3 ? "bg-pink-500" : "bg-slate-400")} style={{ width: `${rev}%` }} />
                  </div>
                </div>
              );
            })}
            {(stats?.topCourses || []).length === 0 && <p className="text-center py-4 text-xs text-slate-400">Kurslar bo'yicha ma'lumot yo'q</p>}
          </div>

          <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-950/30 rounded-xl flex items-start gap-3 border border-primary-100/50 dark:border-primary-900/40">
            <Sparkles className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
            <p className="text-xs text-primary-800 dark:text-primary-200 font-semibold leading-relaxed">{aiInsight}</p>
          </div>
        </div>
      </div>

      {/* Top Students */}
      <div className="card overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-50">
          <h2 className="section-title">Akademik Reyting — Eng yaxshi talabalar</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Talaba</th>
                <th>O'rtacha Ball</th>
                <th>Davomat</th>
                <th>Reyting Status</th>
              </tr>
            </thead>
            <tbody>
              {topStudents.map((s: any, i: number) => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center text-xs font-black text-primary-600">
                          {s.first_name?.[0]}{s.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">{s.first_name} {s.last_name}</p>
                          <p className="text-[10px] text-slate-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-bold text-primary-600">{s.avg_score}%</td>
                    <td className="font-bold text-slate-800">{s.attendance_pct}%</td>
                    <td>
                      <span className={cn("status-pill", i === 0 ? "pill-published" : i < 3 ? "pill-active" : "pill-frozen")}>
                        {i === 0 ? "🏆 OLTIN" : i < 3 ? "⭐ TOP" : "● FAOLLAR"}
                      </span>
                    </td>
                  </tr>
                ))}
              {topStudents.length === 0 && <tr><td colSpan={4} className="text-center py-12 text-slate-400">Talabalar topilmadi</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
