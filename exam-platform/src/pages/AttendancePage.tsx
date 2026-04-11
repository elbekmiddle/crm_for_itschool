import React, { useEffect } from 'react';
import { useStudentStore } from '../store/useStudentStore';
import { useAuthStore } from '../store/useAuthStore';
import { CalendarCheck, CheckCircle2, XCircle, Loader2, Sparkles, Zap, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatUzbekWeekdayDayMonth } from '../lib/uzbekDate';

const AttendancePage: React.FC = () => {
  const { attendance, attendanceStats, fetchAttendance, isLoading } = useStudentStore();
  const { user } = useAuthStore();

  useEffect(() => { if (user?.id) fetchAttendance(user.id); }, [user?.id]);

  const pct = attendanceStats?.attendance_percentage ?? 0;
  const emoji = pct >= 85 ? '😎' : pct >= 60 ? '🙂' : '😢';
  const badge = pct >= 85 ? "A'lo talaba!" : pct >= 60 ? 'Yaxshi talaba' : "Ko'proq kelgin!";

  return (
    <div className="page-container space-y-8 pb-32 lg:pb-12 h-full">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 text-[var(--accent)] font-black text-[10px] uppercase tracking-[0.3em] mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Statistika</span>
          </div>
          <h1 className="text-4xl font-black text-[var(--text-h)] tracking-tight">Davomat</h1>
          <p className="text-[var(--text)] font-medium mt-1">Darslarga qatnashish statistikasi</p>
        </motion.div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)]">
          <Loader2 className="w-10 h-10 text-[var(--accent)] animate-spin" />
          <p className="mt-4 text-[var(--text)] font-bold uppercase tracking-widest text-[10px]">Yuklanmoqda...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {attendanceStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main percentage card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="md:col-span-2 bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-[var(--border)] relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent)]/5 rounded-full blur-3xl -mr-24 -mt-24 group-hover:scale-125 transition-transform duration-700" />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-[var(--text)] uppercase tracking-[0.2em] mb-2">Umumiy natija</p>
                    <p className="text-6xl font-black text-[var(--text-h)] tabular-nums tracking-tighter">{pct}%</p>
                    <div className={cn(
                      "mt-4 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2",
                      pct >= 85 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      pct >= 60 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      <span className="text-lg">{emoji}</span> {badge}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="56" stroke="var(--border)" strokeWidth="10" fill="transparent" />
                        <circle cx="64" cy="64" r="56"
                          stroke={pct >= 85 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="10" fill="transparent"
                          strokeDasharray={352} strokeDashoffset={352 - (352 * pct) / 100}
                          strokeLinecap="round" className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <TrendingUp className={cn(
                          "w-8 h-8",
                          pct >= 85 ? "text-emerald-500" : pct >= 60 ? "text-amber-500" : "text-red-500"
                        )} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 w-full bg-[var(--bg-muted)] rounded-full h-3 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 ease-out",
                      pct >= 85 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' :
                      pct >= 60 ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]' :
                      'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </motion.div>

              {/* Quick stats column */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="bg-[var(--bg-card)] p-8 rounded-[2rem] border border-[var(--border)] text-center group hover:shadow-xl transition-all"
                >
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>
                  <p className="text-[9px] font-black text-[var(--text)] uppercase tracking-[0.2em] mb-1">Kelgan darslar</p>
                  <p className="text-3xl font-black text-emerald-500 tabular-nums">{attendanceStats.present_count}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="bg-[var(--bg-card)] p-8 rounded-[2rem] border border-[var(--border)] text-center group hover:shadow-xl transition-all"
                >
                  <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <XCircle className="w-7 h-7 text-red-500" />
                  </div>
                  <p className="text-[9px] font-black text-[var(--text)] uppercase tracking-[0.2em] mb-1">Qoldirilgan</p>
                  <p className="text-3xl font-black text-red-500 tabular-nums">{attendanceStats.absent_count}</p>
                </motion.div>
              </div>

              {/* Total lessons banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="md:col-span-3 bg-gradient-to-br from-[#7d1fc7] via-[#9329e6] to-[#aa3bff] p-8 rounded-[2.5rem] text-white relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 group-hover:scale-125 transition-transform duration-700" />
                <div className="relative z-10 flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Jami o'tkazilgan darslar</p>
                    <p className="text-4xl font-black mt-1 tabular-nums tracking-tighter">{attendanceStats.total_lessons}</p>
                  </div>
                  <div className="ml-auto hidden sm:block">
                    <div className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-2xl border border-white/10">Statistika yangilangan</div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Records List */}
          <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] overflow-hidden">
            <div className="p-6 border-b border-[var(--divide)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <h2 className="text-xl font-black text-[var(--text-h)] tracking-tight">Darslar Tarixi</h2>
              </div>
            </div>
            {attendance.length > 0 ? (
              <div>
                {attendance.slice().reverse().map((r: any, i: number) => (
                  <div
                    key={r.id || i}
                    className="flex items-center gap-5 p-6 border-b border-[var(--divide)] last:border-b-0 row-hover transition-colors"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                      r.status === 'PRESENT' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    )}>
                      {r.status === 'PRESENT'
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        : <XCircle className="w-5 h-5 text-red-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-[var(--text-h)] truncate">
                        {r.lesson_date ? formatUzbekWeekdayDayMonth(r.lesson_date) : `Dars #${i + 1}`}
                      </p>
                      {r.notes && <p className="text-[11px] font-medium text-[var(--text)] mt-1 truncate">{r.notes}</p>}
                    </div>
                    <span className={cn(
                      "status-pill px-4",
                      r.status === 'PRESENT' ? 'pill-active' : 'pill-missed'
                    )}>
                      {r.status === 'PRESENT' ? 'Keldi' : 'Qoldirdi'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-20">
                <div className="w-20 h-20 bg-[var(--bg-muted)] rounded-full flex items-center justify-center mb-6">
                  <CalendarCheck className="w-8 h-8 text-[var(--text)] opacity-30" />
                </div>
                <p className="text-[var(--text)] font-black text-xs uppercase tracking-widest opacity-50">Hozircha davomat ma'lumotlari yo'q</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AttendancePage;
