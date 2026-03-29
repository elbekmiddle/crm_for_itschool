import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Save, 
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import api from '../lib/api';
import { cn } from '../lib/utils';

const AttendancePage = () => {
  const { groups, fetchGroups, isLoading } = useAdminStore();
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const loadStudents = async (groupId: string) => {
    try {
      const { data } = await api.get(`/groups/${groupId}/students`);
      setStudents(data);
      const initial: Record<string, 'PRESENT' | 'ABSENT'> = {};
      data.forEach((s: any) => initial[s.id] = 'PRESENT');
      setAttendance(initial);
    } catch (e) {
      alert("Talabalarni yuklashda xato");
    }
  };

  const handleToggle = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'PRESENT' ? 'ABSENT' : 'PRESENT'
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post(`/attendance`, {
        group_id: selectedGroup.id,
        date: new Date().toISOString().split('T')[0],
        records: Object.entries(attendance).map(([student_id, status]) => ({
          student_id,
          status
        }))
      });
      alert("Yo'qlama muvaffaqiyatli saqlandi!");
      setSelectedGroup(null);
    } catch (e) {
      alert("Saqlashda xato");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-14 space-y-14">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">Yo"qlama</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm px-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" /> {new Date().toLocaleDateString('uz-UZ', { month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
      </header>

      {!selectedGroup ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {groups.map((group) => (
            <motion.div 
              whileHover={{ scale: 1.02 }}
              key={group.id} 
              onClick={() => { setSelectedGroup(group); loadStudents(group.id); }}
              className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 cursor-pointer group hover:bg-slate-900 transition-all duration-500"
            >
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-12">
                 <Users className="w-6 h-6" />
              </div>
              <div className="mt-8 space-y-1">
                 <h4 className="text-2xl font-black text-slate-900 group-hover:text-white uppercase tracking-tighter leading-tight">{group.name}</h4>
                 <p className="text-xs font-bold text-slate-300 uppercase tracking-widest leading-none">{group.course_name || "Frontend Web"}</p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.students_count || 0} kishi</div>
                 <ChevronRight className="w-5 h-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          <div className="flex items-center justify-between bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-50">
             <div className="flex items-center gap-6">
                <div onClick={() => setSelectedGroup(null)} className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
                   <ChevronDown className="w-6 h-6 rotate-90 text-slate-500" />
                </div>
                <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{selectedGroup.name} (Guruh Yo'qlamasi)</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{selectedGroup.course_name}</p>
                </div>
             </div>
             <Button isLoading={isSaving} onClick={handleSave} className="px-10 py-6">
                <Save className="w-5 h-5" /> SAQLASH
             </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {students.map((s) => (
               <div 
                 key={s.id}
                 onClick={() => handleToggle(s.id)}
                 className={cn(
                   "p-8 rounded-[3rem] border-4 transition-all cursor-pointer flex items-center justify-between group",
                   attendance[s.id] === 'PRESENT' 
                     ? "bg-white border-primary-500 shadow-xl shadow-primary-50" 
                     : "bg-red-50/50 border-red-100 grayscale"
                 )}
               >
                 <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all",
                      attendance[s.id] === 'PRESENT' ? "bg-primary-600 text-white shadow-lg" : "bg-red-500 text-white shadow-lg"
                    )}>
                      {s.first_name[0]}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 tracking-tight leading-tight uppercase">{s.first_name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.phone}</p>
                    </div>
                 </div>
                 {attendance[s.id] === 'PRESENT' ? (
                   <CheckCircle className="w-10 h-10 text-primary-500" />
                 ) : (
                   <XCircle className="w-10 h-10 text-red-500" />
                 )}
               </div>
             ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AttendancePage;
