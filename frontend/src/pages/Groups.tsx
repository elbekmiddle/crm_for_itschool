import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { 
  Plus, Search, GraduationCap, Trash2, Edit2, UserPlus, UserMinus, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';


const GroupsPage = () => {
  const { groups, fetchGroups, createGroup, updateGroup, deleteGroup, courses, fetchCourses, users, fetchUsers, addStudentToGroup, removeStudentFromGroup, fetchGroupStudents, students, fetchStudents } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [groupStudents, setGroupStudents] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
    fetchCourses();
    fetchUsers();
    fetchStudents();
  }, []);

  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const teachers = (users || []).filter((u: any) => u.role === 'TEACHER');

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    if (editingGroup) {
      await updateGroup(editingGroup.id, data);
    } else {
      await createGroup(data);
    }
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  const toggleExpand = async (groupId: string) => {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
      setGroupStudents([]);
    } else {
      setExpandedGroup(groupId);
      const data = await fetchGroupStudents(groupId);
      setGroupStudents(data);
    }
  };

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const studentId = formData.get('student_id') as string;
    if (selectedGroupId && studentId) {
      await addStudentToGroup(selectedGroupId, studentId);
      const data = await fetchGroupStudents(selectedGroupId);
      setGroupStudents(data);
      setIsStudentModalOpen(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (expandedGroup) {
      await removeStudentFromGroup(expandedGroup, studentId);
      const data = await fetchGroupStudents(expandedGroup);
      setGroupStudents(data);
    }
  };

  return (
    <div className="p-8 lg:p-14 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Guruhlar</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Jami: {groups.length} guruh</p>
        </motion.div>
        
        <div className="flex gap-4">
          <div className="bg-white px-6 py-4 rounded-3xl shadow-xl flex items-center gap-4 border border-slate-50 focus-within:ring-2 focus-within:ring-primary-100 transition-all group">
            <Search className="w-5 h-5 text-slate-300 group-focus-within:text-primary-600" />
            <input placeholder="Guruh nomi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="outline-none border-none bg-transparent font-bold text-slate-600 w-48" />
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-6 h-6" /> QO'SHISH
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <AnimatePresence>
          {filteredGroups.map((group, idx) => (
            <motion.div 
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-[2.5rem] shadow-xl border border-slate-50 overflow-hidden"
            >
              <div className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{group.name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {group.course_name || 'Kurs'} • {group.teacher_name || 'O\'qituvchi'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setSelectedGroupId(group.id); setIsStudentModalOpen(true); }} className="p-3 hover:bg-green-50 hover:text-green-600 rounded-2xl transition-all text-slate-400">
                    <UserPlus className="w-5 h-5" />
                  </button>
                  <button onClick={() => toggleExpand(group.id)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400">
                    {expandedGroup === group.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  <button onClick={() => { setEditingGroup(group); setIsModalOpen(true); }} className="p-3 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all text-slate-400">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setDeletingId(group.id); setIsConfirmOpen(true); }} className="p-3 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all text-slate-400">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {expandedGroup === group.id && (
                <div className="px-8 pb-8 border-t border-slate-50 pt-6">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Talabalar ({groupStudents.length})</div>
                  {groupStudents.length === 0 ? (
                    <p className="text-sm font-bold text-slate-300">Hozircha talabalar yo'q</p>
                  ) : (
                    <div className="space-y-3">
                      {groupStudents.map((s: any) => (
                        <div key={s.id || s.student_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm">
                              {(s.first_name || s.student_first_name || '?')[0]}
                            </div>
                            <span className="font-bold text-slate-700">{s.first_name || s.student_first_name} {s.last_name || s.student_last_name}</span>
                          </div>
                          <button onClick={() => handleRemoveStudent(s.id || s.student_id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create/Edit Group Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingGroup(null); }} title={editingGroup ? "Guruhni Tahrirlash" : "Yangi Guruh"}>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Guruh Nomi</label>
            <input required name="name" defaultValue={editingGroup?.name} placeholder="RN-1" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kurs</label>
            <select required name="course_id" defaultValue={editingGroup?.course_id} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800 transition-all">
              <option value="">Tanlang...</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">O'qituvchi</label>
            <select name="teacher_id" defaultValue={editingGroup?.teacher_id} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800 transition-all">
              <option value="">Tanlang...</option>
              {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.email})</option>)}
            </select>
          </div>
          <Button type="submit" className="w-full py-6">SAQLASH</Button>
        </form>
      </Modal>

      {/* Add Student to Group Modal */}
      <Modal isOpen={isStudentModalOpen} onClose={() => setIsStudentModalOpen(false)} title="Talaba Qo'shish">
        <form onSubmit={handleAddStudent} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Talaba</label>
            <select required name="student_id" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800 transition-all">
              <option value="">Tanlang...</option>
              {(students || []).map((s: any) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.phone}</option>)}
            </select>
          </div>
          <Button type="submit" className="w-full py-6">QO'SHISH</Button>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => { if (deletingId) { deleteGroup(deletingId); setDeletingId(null); } }}
        title="Guruhni o'chirish"
        message="Rostdan ham bu guruhni o'chirasizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'CHIRISH"
      />
    </div>
  );
};

export default GroupsPage;
