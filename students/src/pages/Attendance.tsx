import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import {
  Calendar, Loader2, CheckCircle, XCircle, ChevronDown,
  Users, Sparkles
} from 'lucide-react';

const AttendancePage: React.FC = () => {
  const { groups, attendance, fetchGroups, fetchAttendance, markAttendance, updateAttendance, isLoading } = useAdminStore();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const { fetchGroupStudents } = useAdminStore();

  useEffect(() => { fetchGroups(); }, []);

  const loadGroup = async (groupId: string) => {
    setSelectedGroupId(groupId);
    const data = await fetchGroupStudents(groupId);
    setStudents(data || []);
    await fetchAttendance(groupId);
  };

  const selectedGroup = groups.find((g: any) => g.id === selectedGroupId);
  const today = new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' });

  const handleMark = async (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    await markAttendance({
      student_id: studentId,
      group_id: selectedGroupId,
      status,
      lesson_date: new Date().toISOString().split('T')[0],
    });
    await fetchAttendance(selectedGroupId);
  };

  const presentCount = attendance.filter((a: any) => a.status?.toUpperCase() === 'PRESENT').length;
  const totalStudents = students.length || 1;
  const attendancePercent = Math.round((presentCount / totalStudents) * 100);

  return (
    <div className="page-container animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="label-subtle mb-1">GURUHLAR › SINF KO'RINISHI</p>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{selectedGroup?.name || 'Davomat'}</h1>
          {selectedGroup && <p className="text-sm text-slate-400 mt-0.5">{selectedGroup.course_name}</p>}
        </div>
        <select
          value={selectedGroupId}
          onChange={(e) => loadGroup(e.target.value)}
          className="select max-w-xs"
        >
          <option value="">Guruhni tanlang</option>
          {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {selectedGroupId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Attendance Marking */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="section-title">Bugungi dars</h2>
                    <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[10px] font-bold rounded-full uppercase">Live Now</span>
                  </div>
                  <p className="text-xs text-slate-400">Sana: {today}</p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
              ) : (
                <div className="space-y-2">
                  {students.map((s: any) => {
                    const record = attendance.find((a: any) => a.student_id === s.id);
                    const status = record?.status;
                    return (
                      <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-xs font-black text-primary-600">
                            {s.first_name?.[0]}{s.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">{s.first_name} {s.last_name}</p>
                            <p className="text-[10px] text-slate-400">ID: {s.id?.slice(0, 8)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("status-pill", s.status === 'active' ? 'pill-active' : s.status === 'frozen' ? 'pill-frozen' : 'pill-active')}>
                            {s.status || 'active'}
                          </span>
                          {s.status === 'frozen' ? (
                            <span className="text-xs text-slate-400 font-semibold">N/A</span>
                          ) : (
                            <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleMark(s.id, 'PRESENT')}
                                  className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-bold border transition-all",
                                    status?.toUpperCase() === 'PRESENT'
                                      ? "bg-green-500 text-white border-green-500"
                                      : "border-slate-200 text-slate-500 hover:border-green-300 hover:text-green-600"
                                  )}
                                >
                                  Present
                                </button>
                                <button
                                  onClick={() => handleMark(s.id, 'ABSENT')}
                                  className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-bold border transition-all",
                                    status?.toUpperCase() === 'ABSENT'
                                      ? "bg-red-500 text-white border-red-500"
                                      : "border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600"
                                  )}
                                >
                                  Absent
                                </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {students.length === 0 && (
                    <div className="text-center py-12 text-slate-400">Bu guruhda talabalar yo'q</div>
                  )}
                </div>
              )}

              {students.length > 0 && (
                <button className="btn-primary w-full mt-5 py-4 text-base">
                  Davomatni Saqlash ✓
                </button>
              )}
            </div>
          </div>

          {/* Right — Stats */}
          <div className="space-y-4">
            {/* AI Insight */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white">
              <h3 className="text-sm font-black uppercase tracking-widest mb-2">Davomat Hall of Fame 🏆</h3>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 mt-3">
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">Haftalik AI Insight</p>
                <p className="text-sm mt-2 font-semibold leading-relaxed opacity-95">
                  "Bu guruhda davomat 92% — zo'r natija! Eng ko'p qatnashgan talaba — hafta yulduzi! ⭐"
                </p>
              </div>
            </div>

            {/* Group Pulse */}
            <div className="card p-6">
              <h3 className="section-title mb-4">Guruh Pulsi</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-500 font-semibold">O'rtacha Davomat</span>
                    <span className="font-bold text-green-600">{attendancePercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${attendancePercent}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-500 font-semibold">Imtihon tayyorligi</span>
                    <span className="font-bold text-primary-600">78%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-primary-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-primary-600">{students.length}</p>
                  <p className="text-[10px] font-bold text-primary-400 uppercase mt-1">Talabalar</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-green-600">{presentCount}</p>
                  <p className="text-[10px] font-bold text-green-400 uppercase mt-1">Kelganlar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-16 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-500">Guruhni tanlang</h2>
          <p className="text-sm text-slate-400 mt-1">Davomat belgilash uchun guruhni tanlang.</p>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
