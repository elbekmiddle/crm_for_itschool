import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { 
  Plus, 
  Search, 
  Users, 
  BookOpen, 
  Settings, 
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { cn } from '../lib/utils';

const GroupCard = ({ group, onDelete }: any) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 relative group flex flex-col justify-between"
  >
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-12">
          <Users className="w-6 h-6" />
        </div>
        <button onClick={() => onDelete(group.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-3xl font-black text-slate-900 leading-tight tracking-tighter uppercase">{group.name}</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none flex items-center gap-2">
           <BookOpen className="w-3.5 h-3.5" /> {group.course_name || "Web Development"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-50">
        <div className="space-y-1">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sig'im</div>
           <div className="text-lg font-black text-slate-800">{group.students_count || 0} / {group.capacity || 20}</div>
        </div>
        <div className="space-y-1">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bosqich</div>
           <div className="text-lg font-black text-indigo-600 uppercase">3-OY</div>
        </div>
      </div>
    </div>

    <div className="mt-8">
       <Button variant="ghost" className="w-full justify-between items-center px-6 group-hover:bg-slate-50">
          Yo'qlama <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
       </Button>
    </div>
  </motion.div>
);

const GroupsPage = () => {
  const { groups, fetchGroups, createGroup, courses, fetchCourses, deleteStudent, isLoading } = useAdminStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
    fetchCourses();
  }, [fetchGroups, fetchCourses]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    await createGroup(data);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsConfirmOpen(true);
  };

  return (
    <div className="p-14 space-y-14 animate-in fade-in duration-500">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">Guruhlar</h1>
          <p className="text-lg text-slate-400 font-bold tracking-wide uppercase px-2 leading-none">O'quv guruhlari va kurslar bo'yicha taqsimot</p>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 border border-slate-50 group">
              <Search className="w-6 h-6 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
              <input placeholder="Guruh qidirish..." className="outline-none border-none bg-transparent font-bold text-slate-600 w-64 text-lg" />
           </div>
           
           <Button onClick={() => setIsModalOpen(true)} className="px-10 py-6">
              <Plus className="w-6 h-6" /> YANGI GURUH
           </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
        <AnimatePresence>
          {groups.map((group) => (
             <GroupCard key={group.id} group={group} onDelete={handleDelete} />
          ))}
        </AnimatePresence>
      </div>

      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-10">
           <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
           <p className="font-black text-xl uppercase tracking-widest leading-none">Guruhlar yuklanmoqda...</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yangi Guruh Yaratish">
         <form onSubmit={handleCreate} className="space-y-8">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Guruh nomi</label>
               <input name="name" required placeholder="Masalan: Web-234" className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold text-slate-800 border-2 border-transparent focus:border-primary-500" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Kursni tanlang</label>
               <select name="course_id" className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold text-slate-800">
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
            </div>
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Maksimal sig'im</label>
                  <input type="number" name="capacity" defaultValue={20} className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold text-slate-800" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">O'qituvchi ID</label>
                  <input name="teacher_id" className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold text-slate-800" />
               </div>
            </div>
            <Button type="submit" className="w-full py-8 text-lg">YARATISH</Button>
         </form>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => deletingId && deleteStudent(deletingId)}
        title="Guruhni o'chirish?"
        message="Guruh ochirilsa, unga bog'liq barcha dars va imtihon ma'lumotlari ham o'chib ketadi."
      />

    </div>
  );
};

export default GroupsPage;
