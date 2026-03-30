import { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { Check, X, Calendar, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import { cn } from '../lib/utils';

const AttendancePage = () => {
  const { groups, fetchGroups, fetchGroupStudents, fetchAttendance, markAttendance, attendance } = useAdminStore();
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [groupStudents, setGroupStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleGroupSelect = async (groupId: string) => {
    setSelectedGroup(groupId);
    if (groupId) {
      const students = await fetchGroupStudents(groupId);
      setGroupStudents(students);
      await fetchAttendance(groupId);
      // Pre-fill today's attendance
      const todayAttendance: Record<string, string> = {};
      (attendance || []).forEach((a: any) => {
        if (a.lesson_date === todayDate) {
          todayAttendance[a.student_id] = a.status;
        }
      });
      setAttendanceMap(todayAttendance);
    } else {
      setGroupStudents([]);
      setAttendanceMap({});
    }
  };

  const toggleStatus = (studentId: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'PRESENT' ? 'ABSENT' : 'PRESENT'
    }));
  };

  const handleSubmitAll = async () => {
    setIsSubmitting(true);
    try {
      for (const [studentId, status] of Object.entries(attendanceMap)) {
        await markAttendance({
          group_id: selectedGroup,
          student_id: studentId,
          status,
          lesson_date: todayDate,
        });
      }
      alert('Davomat muvaffaqiyatli saqlandi!');
    } catch (e) {
      alert('Xato yuz berdi!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 lg:p-14 space-y-10">
      <header className="space-y-2">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">Yo'qlama</h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-600" />
          {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </header>

      {/* Group Selector */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-3 block">Guruhni tanlang</label>
        <select 
          value={selectedGroup} 
          onChange={(e) => handleGroupSelect(e.target.value)}
          className="w-full max-w-md p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800 transition-all"
        >
          <option value="">— Guruh tanlang —</option>
          {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name} ({g.course_name || 'Kurs'})</option>)}
        </select>
      </div>

      {/* Students Attendance List */}
      {selectedGroup && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Users className="w-6 h-6 text-primary-600" />
              <span className="font-black text-slate-800 uppercase tracking-tight">Talabalar ({groupStudents.length})</span>
            </div>
            <Button onClick={handleSubmitAll} isLoading={isSubmitting} className="px-8 py-4">
              SAQLASH
            </Button>
          </div>
          
          <div className="divide-y divide-slate-50">
            {groupStudents.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-300 font-bold">Bu guruhda talabalar yo'q</p>
              </div>
            ) : (
              groupStudents.map((s: any, idx) => {
                const studentId = s.id || s.student_id;
                const status = attendanceMap[studentId] || 'PRESENT';
                const isPresent = status === 'PRESENT';
                return (
                  <motion.div 
                    key={studentId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="px-8 py-6 flex items-center justify-between group hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                        {(s.first_name || s.student_first_name || '?')[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{s.first_name || s.student_first_name} {s.last_name || s.student_last_name}</div>
                        <div className="text-xs text-slate-400 font-mono">{s.phone || ''}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleStatus(studentId)}
                      className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                        isPresent 
                          ? "bg-green-100 text-green-700 hover:bg-green-200" 
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      )}
                    >
                      {isPresent ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      {isPresent ? 'KELGAN' : 'KELMAGAN'}
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      )}

      {/* Attendance History */}
      {selectedGroup && attendance.length > 0 && (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-50 p-8">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6">Davomat Tarixi</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Talaba</th>
                  <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Sana</th>
                  <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attendance.slice(0, 20).map((a: any, i: number) => (
                  <tr key={a.id || i} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-bold text-slate-700">{a.student_first_name || a.student_id?.slice(0, 8)}</td>
                    <td className="py-4 px-6 font-mono text-slate-500 text-sm">{a.lesson_date}</td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-black uppercase",
                        a.status === 'PRESENT' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {a.status === 'PRESENT' ? 'Kelgan' : 'Kelmagan'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
