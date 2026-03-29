import React, { useEffect } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { 
  Users, 
  GraduationCap, 
  TrendingUp, 
  Wallet,
  ArrowUpRight,
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <div className="bg-white p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-50 flex flex-col items-center text-center space-y-6 relative overflow-hidden group">
    <div className={cn("inline-flex items-center justify-center p-6 rounded-[2rem] transition-transform group-hover:scale-110", color)}>
      <Icon className="w-10 h-10" />
    </div>
    <div className="space-y-2">
      <div className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{label}</div>
      <div className="text-5xl font-black text-slate-900 tabular-nums">{value}</div>
    </div>
    {trend && (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-black">
        <ArrowUpRight className="w-3.5 h-3.5" /> +{trend}%
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const { stats, fetchStats, isLoading } = useAdminStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading && !stats) return (
    <div className="h-[90vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Ma'lumotlar yuklanmoqda...</p>
    </div>
  );

  return (
    <div className="p-8 lg:p-14 space-y-14 animate-in fade-in duration-700">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-slate-900">Asosiy Dashboard</h1>
          <p className="text-lg text-slate-400 font-semibold tracking-wide flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" /> Bugun 30-Mart, 2026. Tizim holati barqaror.
          </p>
        </div>
        
        <div className="bg-primary-600 p-6 rounded-[2rem] shadow-2xl shadow-primary-200 text-white flex items-center gap-6">
           <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
             <TrendingUp className="w-6 h-6" />
           </div>
           <div>
             <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-0.5">Joriy KPI</div>
             <div className="text-2xl font-black">+14.2%</div>
           </div>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <StatCard 
          icon={Users} 
          label="Talabalar" 
          value={stats?.total_students || 128} 
          trend={8.4}
          color="bg-primary-100 text-primary-600"
        />
        <StatCard 
          icon={GraduationCap} 
          label="Guruhlar" 
          value={stats?.active_groups || 14} 
          color="bg-indigo-100 text-indigo-600"
        />
        <StatCard 
          icon={Wallet} 
          label="Tushum (SUM)" 
          value={stats?.total_revenue || '4.2M'} 
          trend={12}
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard 
          icon={AlertCircle} 
          label="Qarzdorlar" 
          value={stats?.debtors || 6} 
          color="bg-red-100 text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-14">
        
        {/* Activity Feed / Chart (Mockup) */}
        <div className="lg:col-span-2 space-y-8 bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900">Daromad Grafigi</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Oxirgi 30 kunlik dinamika</p>
            </div>
            <select className="bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-slate-600 text-sm outline-none">
              <option>Oxirgi 30 kun</option>
              <option>Oxirgi choyrak</option>
            </select>
          </div>
          
          <div className="h-80 w-full bg-slate-50 rounded-[2rem] flex items-center justify-center relative group overflow-hidden">
             <div className="text-slate-300 font-black text-6xl opacity-20 select-none group-hover:scale-110 transition-transform">CHART DISPLAY</div>
             <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between gap-4 h-40">
                {[45, 60, 40, 80, 50, 90, 70, 75, 45, 85].map((h, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-primary-600/20 rounded-t-xl hover:bg-primary-600 transition-all duration-500 cursor-pointer"
                    style={{ height: `${h}%` }}
                  ></div>
                ))}
             </div>
          </div>
        </div>

        {/* Quick Notifications / System Health */}
        <div className="space-y-10">
           <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white space-y-8 relative overflow-hidden group">
              <div className="space-y-2">
                <h3 className="text-2xl font-black leading-tight">AI Analitika Tayyor! 🤖</h3>
                <p className="text-sm font-bold text-slate-400">Yangi talabalar analitikasi va imtihon natijalari qayta ishlandi.</p>
              </div>
              <button className="w-full bg-white text-slate-900 font-extrabold py-4 rounded-2xl active:scale-95 transition-all text-sm uppercase tracking-widest shadow-xl">Hisobotni ko'rish</button>
              <Users className="absolute -bottom-8 -right-8 w-40 h-40 text-white opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
           </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
