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
        <h1 className="text-2xl font-black text-slate-900">Davomat</h1>
        <p className="text-slate-400 text-sm mt-1">Darslarga qatnashish statistikasi</p>
      </div>

      {isLoading ? (
        <div className="card p-12 flex justify-center"><Loader2 className="w-7 h-7 text-primary-400 animate-spin" /></div>
      ) : (
        <>
          {/* Stats cards */}
          {attendanceStats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="label-subtle">Umumiy davomat</p>
                    <p className="text-4xl font-black text-slate-900 mt-1">{pct}%</p>
                  </div>
                  <div className={`px-3 py-2 rounded-xl border font-bold text-sm ${badgeColor}`}>
                    {emoji} {badge}
                  </div>
                </div>
                <div className="mt-4 w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${pct >= 85 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="card p-4 flex items-center gap-3">
                <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="label-subtle">Keldi</p>
                  <p className="text-2xl font-black text-green-600">{attendanceStats.present_count}</p>
                </div>
              </div>
              <div className="card p-4 flex items-center gap-3">
                <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="label-subtle">Qoldirdi</p>
                  <p className="text-2xl font-black text-red-500">{attendanceStats.absent_count}</p>
                </div>
              </div>
              <div className="card p-4 flex items-center gap-3 sm:col-span-1">
                <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="label-subtle">Jami dars</p>
                  <p className="text-2xl font-black text-slate-800">{attendanceStats.total_lessons}</p>
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
                  <div key={r.id || i} className="flex items-center gap-4 p-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${r.status === 'PRESENT' ? 'bg-green-50' : 'bg-red-50'}`}>
                      {r.status === 'PRESENT'
                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                        : <XCircle className="w-4 h-4 text-red-400" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{r.lesson_date ? new Date(r.lesson_date).toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' }) : `Dars #${i + 1}`}</p>
                      {r.notes && <p className="text-xs text-slate-400 mt-0.5">{r.notes}</p>}
                    </div>
                    <span className={`status-pill ${r.status === 'PRESENT' ? 'pill-active' : 'pill-missed'}`}>
                      {r.status === 'PRESENT' ? '● Keldi' : '● Qoldirdi'}
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
