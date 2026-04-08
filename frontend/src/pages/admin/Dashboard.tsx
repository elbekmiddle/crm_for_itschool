import React, { useEffect } from 'react';
import { 
  Users, UserCheck, GraduationCap, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Activity, Calendar,
  PieChart, DollarSign, Target, MessageSquare, Loader2,
  Sparkles, Zap, Award
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAdminStore } from '../../store/useAdminStore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { LINE_ACCENT, primaryGrowthDataset, standardLineChartOptions } from '../../lib/chartLineTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const AdminDashboard: React.FC = () => {
  const { user, stats, fetchStats, isLoading } = useAdminStore();

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
           <div className="w-16 h-16 bg-[#aa3bff]/10 rounded-2xl flex items-center justify-center">
             <Loader2 className="w-8 h-8 animate-spin text-[#aa3bff]" />
           </div>
           <p className="text-[10px] font-black text-[#aa3bff] uppercase tracking-widest animate-pulse">Analitika yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const primaryStats = [
    { label: 'Jami O\'quvchilar', value: Number(stats?.totalStudents || 0), icon: GraduationCap, color: 'text-[#aa3bff]', bg: 'bg-[#aa3bff]/10', trend: '+12.5%', isUp: true },
    { label: 'Faol Guruhlar', value: Number(stats?.totalGroups || 0), icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+2.4%', isUp: true },
    { label: 'Yangi Lidlar', value: Number(stats?.pendingPayments || 0), icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+18.2%', isUp: true },
    { label: 'Oylik Mavjudlik', value: `${Number(stats?.attendanceAvg || 0)}%`, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '-1.2%', isUp: false },
  ];

  const growthLabels = stats?.growthTrend?.map((g: any) => g.month) || ['Yan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const growthCounts = stats?.growthTrend?.map((g: any) => g.count) || [30, 45, 57, 48, 63, 72];
  const chartData = {
    labels: growthLabels,
    datasets: [
      primaryGrowthDataset("Yangi o'quvchilar", growthCounts, {
        borderColor: LINE_ACCENT,
        borderWidth: 3,
        tension: 0.45,
      }),
    ],
  };

  const baseChartOpts = standardLineChartOptions();
  const chartOptions = {
    ...baseChartOpts,
    plugins: {
      ...baseChartOpts.plugins,
      tooltip: {
        ...baseChartOpts.plugins.tooltip,
        backgroundColor: '#08060d',
        padding: 16,
        titleFont: { size: 14, weight: 'bold' as const, family: 'Outfit' },
        bodyFont: { size: 13, family: 'Inter' },
        cornerRadius: 16,
        usePointStyle: true,
      },
    },
    scales: {
      ...baseChartOpts.scales,
      y: {
        ...(baseChartOpts.scales as { y: Record<string, unknown> }).y,
        suggestedMax: Math.max(4, ...growthCounts.map((n: number) => Number(n) || 0), 1),
        grid: { color: 'rgba(0, 0, 0, 0.02)', drawBorder: false },
        ticks: { color: '#6b6375', font: { size: 11, weight: 'bold' as const } },
      },
      x: {
        ...(baseChartOpts.scales as { x: Record<string, unknown> }).x,
        ticks: { color: '#6b6375', font: { size: 11, weight: 'bold' as const } },
      },
    },
  };

  return (
    <div className="space-y-8 animate-in pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-[#aa3bff] via-[#9329e6] to-[#08060d] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-[#aa3bff]/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mb-32" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center text-center lg:text-left">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 mb-6">
               <Sparkles className="w-4 h-4 text-amber-400" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Academy Analytics Engine · v4.2</span>
            </div>
            <h1 className="text-5xl font-black mb-6 leading-[1.1] tracking-tighter">Barcha tizimlar <br/> <span className="text-[#c084fc] drop-shadow-sm">mo'tadil</span> ishlamoqda.</h1>
            <p className="text-[#ece0ff] text-xl font-medium leading-relaxed opacity-90 max-w-xl">
               Bugun <span className="font-black text-white underline decoration-[#c084fc] decoration-4 underline-offset-4">{stats?.totalStudents || 0} ta yangi talaba</span> qo'shildi va umumiy <span className="font-black text-white decoration-emerald-400">{(stats?.totalRevenue || 0).toLocaleString()} UZS</span> tushum qayd etildi.
            </p>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-4">
             <div className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10 transform hover:scale-105 transition-all duration-500">
                <Zap className="w-10 h-10 text-amber-400 mb-4" />
                <p className="text-sm font-black opacity-60 uppercase tracking-widest mb-1">Server Power</p>
                <p className="text-3xl font-black tabular-nums tracking-tighter text-white">99.8%</p>
             </div>
             <div className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10 transform hover:scale-105 transition-all duration-500 delay-100">
                <Award className="w-10 h-10 text-emerald-400 mb-4" />
                <p className="text-sm font-black opacity-60 uppercase tracking-widest mb-1">Growth Rate</p>
                <p className="text-3xl font-black tabular-nums tracking-tighter text-white">+24.5%</p>
             </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {primaryStats.map(({ label, value, icon: Icon, color, bg, trend, isUp }) => (
          <div key={label} className="card p-8 flex flex-col group hover:-translate-y-2 transition-all duration-500 relative overflow-hidden bg-white/50 dark:bg-[#1f2028]/50 backdrop-blur-md">
            <div className={`absolute top-0 right-0 w-24 h-24 ${bg} opacity-10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-[2] duration-[1.5s]`} />
            <div className={`w-16 h-16 ${bg} rounded-2xl flex items-center justify-center mb-6 ring-8 ring-[#f4f3ec] dark:ring-[#16171d] shadow-sm transition-all duration-500 group-hover:rotate-6 group-hover:scale-110`}>
              <Icon className={`w-8 h-8 ${color}`} />
            </div>
            <p className="text-[11px] font-black text-[#6b6375] dark:text-[#9ca3af] uppercase tracking-[0.2em] mb-2">{label}</p>
            <div className="flex items-end justify-between">
              <h2 className="text-4xl font-black text-[#08060d] dark:text-white tabular-nums leading-none tracking-tighter">{value}</h2>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-xl shadow-inner",
                isUp ? "bg-emerald-100/50 text-emerald-600" : "bg-red-100/50 text-red-600"
              )}>
                {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Chart */}
        <div className="lg:col-span-2 card p-10 space-y-8 bg-white/50 dark:bg-[#1f2028]/50 backdrop-blur-md border border-[#e5e4e7] dark:border-[#2e303a]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
             <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-[#aa3bff]/10 text-[#aa3bff] rounded-2xl flex items-center justify-center shadow-inner">
                   <TrendingUp className="w-7 h-7" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-[#08060d] dark:text-white tracking-tight mb-1">O'sish Tendentsiyasi</h3>
                   <p className="text-xs text-[#6b6375] dark:text-[#9ca3af] font-bold uppercase tracking-widest opacity-60">Yangi ro'yxatga olishlar (so'nggi 6 oy)</p>
                </div>
             </div>
             <div className="flex bg-[#f4f3ec] dark:bg-[#16171d] p-1.5 rounded-[1.25rem] border border-[#e5e4e7] dark:border-[#2e303a]">
                {['Hafta', 'Oy', 'Yil'].map(t => (
                   <button key={t} className={cn(
                     "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                     t === 'Oy' ? "bg-white dark:bg-[#1f2028] text-[#aa3bff] shadow-lg shadow-black/5" : "text-[#6b6375] hover:text-[#aa3bff]"
                   )}>
                      {t}
                   </button>
                ))}
             </div>
          </div>
          <div className="h-[400px] w-full mt-4">
             <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Top Courses */}
        <div className="card p-10 space-y-8 bg-[#f4f3ec]/30 dark:bg-[#1f2028]/30 backdrop-blur-md border border-[#e5e4e7] dark:border-[#2e303a]">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-[#08060d] dark:text-white tracking-tight">Ommabop kurslar</h3>
              <button className="text-[10px] font-black text-[#aa3bff] uppercase tracking-widest hover:scale-105 transition-all">Barchasi</button>
           </div>
           <div className="space-y-5">
              {stats?.topCourses?.map((course: any, i: number) => (
                 <div key={i} className="flex items-center justify-between p-4 rounded-3xl hover:bg-white dark:hover:bg-[#1f2028] transition-all duration-300 border border-transparent hover:border-[#e5e4e7] dark:hover:border-[#2e303a] group">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-white dark:bg-[#16171d] text-[#aa3bff] rounded-2xl flex items-center justify-center font-black text-sm shadow-[0_4px_10px_rgba(0,0,0,0.03)] transition-transform group-hover:rotate-6">
                          {i + 1}
                       </div>
                       <div>
                          <p className="text-base font-black text-[#08060d] dark:text-[#f3f4f6] tracking-tight">{course.name}</p>
                          <p className="text-[10px] text-[#6b6375] dark:text-[#9ca3af] font-black uppercase tracking-widest mt-1">{course.student_count} ta faol talaba</p>
                       </div>
                    </div>
                 </div>
              ))}
              {!stats?.topCourses?.length && (
                 <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <PieChart className="w-10 h-10 text-[#6b6375] opacity-20" />
                    <p className="text-[#6b6375] font-bold text-xs uppercase tracking-widest opacity-40">Ma'lumot topilmadi</p>
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* Leaderboard Table (Top Students) */}
      <div className="card p-10 bg-white dark:bg-[#1f2028] shadow-2xl border-[#e5e4e7] dark:border-[#2e303a]">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
            <h3 className="text-2xl font-black text-[#08060d] dark:text-white tracking-tight">Akademik Leaderboard</h3>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  <span className="text-[10px] font-black text-[#6b6375] uppercase tracking-widest">Master</span>
               </div>
               <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#aa3bff] shadow-[0_0_8px_#aa3bff]" />
                  <span className="text-[10px] font-black text-[#6b6375] uppercase tracking-widest">Active</span>
               </div>
            </div>
         </div>
         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-[#f4f3ec] dark:border-[#2e303a]">
                     <th className="pb-6 text-[10px] font-black text-[#6b6375] uppercase tracking-[0.2em]">Talaba</th>
                     <th className="pb-6 text-[10px] font-black text-[#6b6375] uppercase tracking-[0.2em]">O'rtacha Ball</th>
                     <th className="pb-6 text-[10px] font-black text-[#6b6375] uppercase tracking-[0.2em]">Davomat</th>
                     <th className="pb-6 text-[10px] font-black text-[#6b6375] uppercase tracking-[0.2em]">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#f4f3ec] dark:divide-[#2e303a]">
                  {stats?.topStudents?.map((s: any, i: number) => (
                     <tr key={i} className="group hover:bg-[#f4f3ec]/30 dark:hover:bg-[#16171d]/30 transition-all duration-300">
                        <td className="py-6">
                           <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
                                i === 0 ? "bg-amber-100 text-amber-600 shadow-xl shadow-amber-500/10" : 
                                i === 1 ? "bg-[#f4f3ec] dark:bg-[#16171d] text-[#6b6375]" :
                                i === 2 ? "bg-orange-100 text-orange-600 shadow-xl shadow-orange-500/10" : "bg-[#aa3bff]/5 text-[#aa3bff]"
                              )}>
                                 {i < 3 ? ['🥇', '🥈', '🥉'][i] : s.first_name?.[0]}
                              </div>
                              <div>
                                 <p className="text-base font-black text-[#08060d] dark:text-[#f3f4f6] tracking-tight">{s.first_name} {s.last_name}</p>
                                 <p className="text-[10px] text-[#6b6375] font-black uppercase tracking-widest mt-1 opacity-60">{s.email || 'CONTACT NOT SHARED'}</p>
                              </div>
                           </div>
                        </td>
                        <td className="py-6 font-black text-[#08060d] dark:text-white tabular-nums text-lg">{s.avg_score}%</td>
                        <td className="py-6 font-black text-[#6b6375] dark:text-[#9ca3af] tabular-nums">{s.attendance_pct}%</td>
                        <td className="py-6">
                           <span className={cn(
                             "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-sm",
                             Number(s.avg_score) >= 90 ? "bg-emerald-100 text-emerald-600" : "bg-[#aa3bff]/10 text-[#aa3bff]"
                           )}>
                              {Number(s.avg_score) >= 90 ? 'Master' : 'Pro Active'}
                           </span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

