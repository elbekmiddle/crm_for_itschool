import React, { useEffect } from 'react';
import { useStudentStore } from '../store/useStudentStore';
import { useAuthStore } from '../store/useAuthStore';
import { CalendarCheck, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const AttendancePage: React.FC = () => {
  const { attendance, attendanceStats, fetchAttendance, isLoading } = useStudentStore();
  const { user } = useAuthStore();

  useEffect(() => { if (user?.id) fetchAttendance(user.id); }, [user?.id]);

  const pct = attendanceStats?.attendance_percentage ?? 0;
  const emoji = pct >= 85 ? '😎' : pct >= 60 ? '🙂' : '😢';
  const badge = pct >= 85 ? "A'talmas talaba!" : pct >= 60 ? 'Yaxshi talaba' : "Ko'proq kelgin!";
  const badgeColor = pct >= 85 ? 'text-green-600 bg-green-50 border-green-200' : pct >= 60 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-red-600 bg-red-50 border-red-200';

  return (
    <div className="page-container space-y-6 pb-20 lg:pb-6 animate-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Davomat</h1>
        <p className="text-slate-400 text-sm mt-1">Darslarga qatnashish statistikasi</p>
      </div>

      {isLoading ? (
        <div className="card p-12 flex justify-center"><Loader2 className="w-7 h-7 text-primary-400 animate-spin" /></div>
      ) : (
        <>
          {/* Redesigned Stats cards */}
          {attendanceStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-6 col-span-2 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full flex -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Umumiy davomat</p>
                    <p className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-slate-100 mt-2 tabular-nums">{pct}%</p>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ${badgeColor}`}>
                    <span className="text-lg">{emoji}</span> {badge}
                  </div>
                </div>
                <div className="mt-6 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${pct >= 85 ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]' : pct >= 60 ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="card p-6 flex flex-col items-center justify-center gap-2 text-center group hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 ring-4 ring-green-50/50 dark:ring-green-900/10">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div className="mt-2">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Keldi</p>
                  <p className="text-2xl font-black text-green-600 dark:text-green-400 mt-1">{attendanceStats.present_count}</p>
                </div>
              </div>
              
              <div className="card p-6 flex flex-col items-center justify-center gap-2 text-center group hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 ring-4 ring-red-50/50 dark:ring-red-900/10">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
                <div className="mt-2">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Qoldirdi</p>
                  <p className="text-2xl font-black text-red-500 dark:text-red-400 mt-1">{attendanceStats.absent_count}</p>
                </div>
              </div>

              <div className="card p-6 flex items-center gap-4 col-span-2 md:col-span-4 bg-indigo-600 dark:bg-indigo-900/40 text-white relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-500">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-700" />
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-7 h-7 text-white" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Kurs bo'yicha jami darslar</p>
                  <p className="text-3xl font-black mt-1 tabular-nums">{attendanceStats.total_lessons}</p>
                </div>
                <div className="ml-auto hidden sm:block">
                   <div className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">Statistika yangilangan</div>
                </div>
              </div>
            </div>
          )}

          {/* Records */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-50">
              <h2 className="section-title text-base">Darslar tarixi</h2>
            </div>
            {attendance.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {attendance.slice().reverse().map((r: any, i: number) => (
                  <div key={r.id || i} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${r.status === 'PRESENT' ? 'bg-green-50 ring-4 ring-green-50/50' : 'bg-red-50 ring-4 ring-red-50/50'}`}>
                      {r.status === 'PRESENT'
                        ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                        : <XCircle className="w-5 h-5 text-red-400" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100">{r.lesson_date ? new Date(r.lesson_date).toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' }) : `Dars #${i + 1}`}</p>
                      {r.notes && <p className="text-[11px] font-medium text-slate-400 mt-1">{r.notes}</p>}
                    </div>
                    <span className={`status-pill px-4 rounded-full ${r.status === 'PRESENT' ? 'pill-active' : 'pill-missed'}`}>
                      {r.status === 'PRESENT' ? 'Keldi' : 'Qoldirdi'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <CalendarCheck className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-semibold">Hozircha davomat ma'lumotlari yo'q</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AttendancePage;
