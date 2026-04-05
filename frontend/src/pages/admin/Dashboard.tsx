import React, { useEffect } from 'react';
import { 
  Users, UserCheck, GraduationCap, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Activity, Calendar,
  PieChart, DollarSign, Target, MessageSquare, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAdminStore } from '../../store/useAdminStore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard: React.FC = () => {
  const { user, stats, fetchStats, isLoading } = useAdminStore();

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const primaryStats = [
    { label: 'Jami O\'quvchilar', value: Number(stats?.totalStudents || 0), icon: GraduationCap, color: 'text-primary-600', bg: 'bg-primary-50', trend: '+12.5%', isUp: true },
    { label: 'Faol Guruhlar', value: Number(stats?.totalGroups || 0), icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50', trend: '+2.4%', isUp: true },
    { label: 'Yangi Lidlar', value: Number(stats?.pendingPayments || 0), icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+18.2%', isUp: true },
    { label: 'Oylik Mavjudlik', value: `${Number(stats?.attendanceAvg || 0)}%`, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '-1.2%', isUp: false },
  ];

  const chartData = {
    labels: stats?.growthTrend?.map((g: any) => g.month) || ['Yan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        fill: true,
        label: 'Yangi o\'quvchilar',
        data: stats?.growthTrend?.map((g: any) => g.count) || [30, 45, 57, 48, 63, 72],
        borderColor: '#84BD38',
        backgroundColor: 'rgba(132, 189, 56, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#84BD38',
        borderWidth: 3,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        cornerRadius: 8,
        displayColors: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } }
      }
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-primary-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/10 rounded-full blur-3xl -mb-24" />
        <div className="relative z-10 max-w-2xl">
          <p className="text-primary-200 text-sm font-black uppercase tracking-widest mb-2 opacity-80 uppercase">IT Academy Admin Panel</p>
          <h1 className="text-4xl font-black mb-3 leading-tight tracking-tighter">Barcha tizim mo'tadil ishlamoqda.</h1>
          <p className="text-primary-100 text-lg font-medium leading-relaxed opacity-90">
             Bugungi kunda <span className="font-black text-white underline decoration-amber-400">{stats?.totalStudents || 0} ta yangi talaba</span> ro'yxatdan o'tdi va <span className="font-black text-white underline decoration-emerald-400">{(stats?.totalRevenue || 0).toLocaleString()} UZS</span> to'lov amalga oshirildi.
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryStats.map(({ label, value, icon: Icon, color, bg, trend, isUp }) => (
          <div key={label} className="card p-6 flex flex-col group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-16 h-16 ${bg} opacity-10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700`} />
            <div className={`w-14 h-14 ${bg} rounded-full flex items-center justify-center mb-4 ring-8 ring-white dark:ring-slate-800 shadow-sm transition-transform duration-500 group-hover:scale-110`}>
              <Icon className={`w-7 h-7 ${color}`} />
            </div>
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tabular-nums leading-none tracking-tighter">{value}</h2>
              <div className={cn(
                "flex items-center text-[10px] font-black px-1.5 py-0.5 rounded-md",
                isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Chart */}
        <div className="lg:col-span-2 card p-8 space-y-6">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                   <Activity className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="section-title text-xl">O'sish Tendentsiyasi</h3>
                   <p className="text-xs text-slate-400 font-medium">Yangi ro'yxatga olishlar (so'nggi 6 oy)</p>
                </div>
             </div>
             <div className="flex gap-2">
                {['Hafta', 'Oy', 'Yil'].map(t => (
                   <button key={t} className={cn(
                     "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors",
                     t === 'Oy' ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/20" : "border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                   )}>
                      {t}
                   </button>
                ))}
             </div>
          </div>
          <div className="h-72 w-full mt-4">
             <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Top Courses */}
        <div className="card p-8 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="section-title text-xl">Ommabop kurslar</h3>
              <button className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline">Barchasi</button>
           </div>
           <div className="space-y-4">
              {stats?.topCourses?.map((course: any, i: number) => (
                 <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center font-black text-xs">
                          {i + 1}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{course.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{course.student_count} ta talaba</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 rounded-full" 
                            style={{ width: `${(course.student_count / (stats?.totalStudents || 1)) * 100}%` }} 
                          />
                       </div>
                    </div>
                 </div>
              ))}
              {!stats?.topCourses?.length && (
                 <p className="text-center py-8 text-slate-400 text-sm">Ma'lumot topilmadi</p>
              )}
           </div>
        </div>
      </div>

      {/* Leaderboard Table (Top Students) */}
      <div className="card p-8">
         <div className="flex items-center justify-between mb-8">
            <h3 className="section-title text-xl">Top Talabalar</h3>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zo'r natija</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yaxshi natija</span>
               </div>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-800 pb-4">
                     <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Talaba</th>
                     <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">O'rtacha Ball</th>
                     <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Davomat %</th>
                     <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
               </thead>
               <tbody>
                  {stats?.topStudents?.map((s: any, i: number) => (
                     <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4">
                           <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-transform group-hover:scale-110",
                                i === 0 ? "bg-amber-100 text-amber-600 shadow-lg shadow-amber-500/20" : 
                                i === 1 ? "bg-slate-100 text-slate-600" :
                                i === 2 ? "bg-orange-100 text-orange-600" : "bg-primary-50 text-primary-600"
                              )}>
                                 {i < 3 ? '🏆' : s.first_name?.[0]}
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.first_name} {s.last_name}</p>
                                 <p className="text-[10px] text-slate-400">{s.email || '—'}</p>
                              </div>
                           </div>
                        </td>
                        <td className="py-4 font-black text-slate-900 dark:text-white tabular-nums">{s.avg_score}%</td>
                        <td className="py-4 font-black text-slate-900 dark:text-white tabular-nums">{s.attendance_pct}%</td>
                        <td className="py-4">
                           <span className={cn(
                             "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                             Number(s.avg_score) >= 90 ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"
                           )}>
                              {Number(s.avg_score) >= 90 ? 'Ekspert' : 'Faol'}
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
