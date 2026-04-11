import React from 'react';
import { CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatUzbekWeekdayDayMonth } from '../lib/uzbekDate';
import type { AttendanceRecord, AttendanceStats } from '../types';

interface AttendanceCardProps {
  stats: AttendanceStats;
  records?: AttendanceRecord[];
  showRecords?: boolean;
  maxRecords?: number;
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({
  stats,
  records = [],
  showRecords = true,
  maxRecords = 5,
}) => {
  const pct = stats.attendance_percentage;
  const badge = pct >= 90
    ? { emoji: '😎', text: 'Ajoyib talaba!', bg: 'bg-green-50 text-green-700' }
    : pct >= 70
      ? { emoji: '🙂', text: 'Yaxshi', bg: 'bg-amber-50 text-amber-700' }
      : { emoji: '😂', text: "Ko'p qoldiryapsiz", bg: 'bg-red-50 text-red-700' };

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-500" /> Davomat
        </h3>
        <span className={cn("status-pill", badge.bg)}>
          {badge.emoji} {badge.text}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <div className="text-xl font-black text-slate-800">{stats.total_lessons}</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Jami</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <div className="text-xl font-black text-green-600">{stats.present_count}</div>
          <div className="text-[9px] font-bold text-green-500 uppercase tracking-wider">Kelgan</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <div className="text-xl font-black text-red-500">{stats.absent_count}</div>
          <div className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Kelmagan</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-xs font-bold text-slate-400 text-right">{pct}%</div>
      </div>

      {/* Recent records */}
      {showRecords && records.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-100">
          {records.slice(0, maxRecords).map((r, i) => (
            <div key={r.id || i} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2.5">
                {r.status === 'PRESENT' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm font-medium text-slate-600">
                  {r.lesson_title || "Dars"}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {formatUzbekWeekdayDayMonth(r.date)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendanceCard;
