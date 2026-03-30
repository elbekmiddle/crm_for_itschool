import React, { useEffect } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import {
  TrendingUp, Users, GraduationCap, DollarSign,
  AlertTriangle, Download, Sparkles, BarChart3
} from 'lucide-react';
import { cn } from '../lib/utils';

const AnalyticsPage: React.FC = () => {
  const { stats, students, courses, fetchStats, fetchStudents, fetchCourses } = useAdminStore();

  useEffect(() => { fetchStats(); fetchStudents(); fetchCourses(); }, []);

  const totalRevenue = 42500000;
  const enrollmentGrowth = [20, 35, 42, 48, 58, 65, 72, 88];
  const completionGrowth = [15, 22, 30, 38, 42, 50, 58, 65];
  const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg'];

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
            <span className="stat-badge bg-green-50 text-green-600">+18%</span>
          </div>
          <p className="label-subtle">Jami ro'yxat</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{stats?.totalStudents || students.length}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center"><GraduationCap className="w-5 h-5 text-green-600" /></div>
            <span className="stat-badge bg-green-50 text-green-600">+5.2%</span>
          </div>
          <p className="label-subtle">Tugatish darajasi</p>
          <p className="text-3xl font-black text-slate-800 mt-1">78.4%</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
            <span className="stat-badge bg-green-50 text-green-600">+24%</span>
          </div>
          <p className="label-subtle">Jami Daromad</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{(totalRevenue / 1e6).toFixed(1)}M</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
          </div>
          <p className="label-subtle">Chiqib ketish xavfi</p>
          <p className="text-3xl font-black text-red-500 mt-1">{Math.ceil((stats?.totalStudents || students.length) * 0.08)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title">O'sish Tendentsiyasi</h2>
              <p className="text-xs text-slate-400 mt-0.5">Yangi ro'yxatga olish va tugatish</p>
            </div>
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button className="px-4 py-2 rounded-lg text-xs font-bold bg-white shadow-sm text-slate-700">8 oy</button>
              <button className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400">1 yil</button>
            </div>
          </div>

          <div className="flex items-end gap-3 h-40">
            {months.map((m, i) => (
              <div key={m} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-1 items-end h-full">
                  <div className="flex-1 bg-primary-200 rounded-t-md" style={{ height: `${enrollmentGrowth[i]}%` }} />
                  <div className="flex-1 bg-green-300 rounded-t-md" style={{ height: `${completionGrowth[i]}%` }} />
                </div>
                <span className="text-[9px] font-bold text-slate-400">{m}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-primary-200" />
              <span className="text-slate-500 font-semibold">Ro'yxatga olish</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-green-300" />
              <span className="text-slate-500 font-semibold">Tugatish</span>
            </div>
          </div>
        </div>

        {/* Revenue by Course */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Kurs bo'yicha daromad</h2>
          <div className="space-y-4">
            {courses.slice(0, 5).map((c: any, i: number) => {
              const rev = [38, 28, 18, 10, 6][i] || 5;
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-600 truncate flex-1">{c.name}</span>
                    <span className="font-bold text-slate-700 ml-2">{rev}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={cn("h-2 rounded-full", i === 0 ? "bg-primary-500" : i === 1 ? "bg-green-500" : i === 2 ? "bg-amber-500" : i === 3 ? "bg-pink-500" : "bg-slate-400")} style={{ width: `${rev}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-primary-50 rounded-xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <p className="text-xs text-primary-700 font-semibold">AI: Web Dasturlash eng yuqori ROI ko'rsatmoqda.</p>
          </div>
        </div>
      </div>

      {/* Top Students */}
      <div className="card overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-50">
          <h2 className="section-title">Top Talabalar — Ishlashi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Talaba</th>
                <th>Kurs</th>
                <th>GPA</th>
                <th>Davomat</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {students.slice(0, 5).map((s: any, i: number) => {
                const gpa = [4.8, 4.6, 4.5, 4.3, 4.1][i] || 4.0;
                const att = [98, 96, 95, 92, 90][i] || 88;
                const prog = [95, 88, 82, 78, 72][i] || 70;
                return (
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
                    <td><span className="course-badge bg-primary-50 text-primary-600">{s.course_name || 'Web Dev'}</span></td>
                    <td className="font-bold text-slate-800">{gpa}</td>
                    <td className="font-bold text-slate-800">{att}%</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${prog}%` }} />
                        </div>
                        <span className="text-xs font-bold text-primary-600 w-10 text-right">{prog}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-400">Talabalar topilmadi</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
