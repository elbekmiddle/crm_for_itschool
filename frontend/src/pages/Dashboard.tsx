import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import {
  Users, BookOpen, UserCheck, Wallet,
  TrendingUp, Sparkles, ChevronRight,
  Loader2, BarChart3, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const Dashboard: React.FC = () => {
  const { stats, courses, groups, fetchStats, fetchCourses, fetchGroups, isLoading } = useAdminStore();
  const navigate = useNavigate();
  const [view, setView] = useState<'daily' | 'monthly'>('daily');

  useEffect(() => {
    fetchStats();
    fetchCourses();
    fetchGroups();
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard</h1>
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
              <button onClick={() => navigate('/courses')} className="text-sm font-bold text-primary-600 hover:underline flex items-center gap-1">
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
                    <span className="text-slate-400 font-semibold">Curriculum Progress</span>
                    <span className="font-bold text-primary-600">{course.progress ?? Math.floor(Math.random() * 50 + 40)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${course.progress ?? Math.floor(Math.random() * 50 + 40)}%` }}
                    />
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <div className="col-span-2 text-center py-8 text-slate-400 text-sm">Kurslar topilmadi</div>
              )}
            </div>
          </div>

          {/* Attendance Trends */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title">Davomat Tendentsiyasi</h2>
                <p className="text-sm text-slate-400 mt-0.5">O'rtacha davomat: <span className="text-green-600 font-bold">94.2%</span></p>
              </div>
              <div className="bg-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500">So'nggi 30 kun</div>
            </div>
            <div className="flex items-end gap-2 h-32">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                const h = [75, 88, 92, 95, 80, 65][i];
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-primary-100 rounded-lg relative overflow-hidden" style={{ height: `${h}%` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-primary-500/40 to-primary-300/20 rounded-lg" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{day}</span>
                  </div>
                );
              })}
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
                <div key={group.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer" onClick={() => navigate('/groups')}>
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
            <button onClick={() => navigate('/groups')} className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-400 hover:border-primary-300 hover:text-primary-600 transition-all">
              + Yangi Guruh
            </button>
          </div>

          {/* AI Insight */}
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">AI Insight 🤖</span>
            </div>
            <p className="text-sm font-semibold leading-relaxed opacity-95">
              "Bugun talabalar davomati 94% — juda zo'r natija! Eng faol talaba — <strong>Ahmad Karimov</strong>."
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-3 opacity-70">
              ● Hafta talabasi: Ahmad K.
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
