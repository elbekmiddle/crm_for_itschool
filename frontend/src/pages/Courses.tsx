import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { 
  Plus, Trash2, DollarSign, ChevronRight, Loader2, Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

const CourseCard = ({ course, onEdit, onDelete }: any) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 flex flex-col justify-between group"
  >
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 font-black text-xl group-hover:bg-primary-600 group-hover:text-white transition-all">
          {course.name[0]}
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(course)} className="p-3 text-slate-300 hover:text-blue-600 transition-colors">
            <Edit2 className="w-5 h-5" />
          </button>
          <button onClick={() => onDelete(course.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tighter">{course.name}</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{course.description || "Yo'nalish: Dasturlash"}</p>
      </div>

      <div className="flex items-center gap-2 bg-slate-50 p-4 rounded-2xl">
         <DollarSign className="w-5 h-5 text-green-500" />
         <span className="text-xl font-black text-slate-800">{Number(course.price)?.toLocaleString()} SO'M</span>
      </div>
    </div>

    <div className="mt-8 border-t border-slate-50 pt-6">
       <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span>{course.students_count || 0} Talaba</span>
          <span className="text-primary-600 flex items-center gap-1">
            Batafsil <ChevronRight className="w-4 h-4" />
          </span>
       </div>
    </div>
  </motion.div>
);

const CoursesPage = () => {
  const { courses, fetchCourses, createCourse, updateCourse, deleteCourse, isLoading } = useAdminStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const payload = { ...data, price: Number(data.price) };
    if (editingCourse) {
      await updateCourse(editingCourse.id, payload);
    } else {
      await createCourse(payload);
    }
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  return (
    <div className="p-14 space-y-14">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter">Kurslar</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm px-2">Akademiya ta'lim yo'nalishlari</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="px-10 py-6">
           <Plus className="w-6 h-6" /> KURS QO'SHISH
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        <AnimatePresence>
          {courses.map((course) => (
             <CourseCard 
               key={course.id} 
               course={course} 
               onEdit={(c: any) => { setEditingCourse(c); setIsModalOpen(true); }}
               onDelete={(id: string) => { setDeletingId(id); setIsConfirmOpen(true); }} 
             />
          ))}
        </AnimatePresence>
      </div>

      {isLoading && courses.length === 0 && (
         <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-10">
           <Loader2 className="w-12 h-12 animate-spin" />
           <p className="font-black text-xl uppercase tracking-widest">Kurslar yuklanmoqda...</p>
         </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCourse(null); }} title={editingCourse ? "Kursni Tahrirlash" : "Yangi Kurs Qo'shish"}>
         <form onSubmit={handleSave} className="space-y-8">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Kurs Nomi</label>
               <input name="name" required defaultValue={editingCourse?.name} placeholder="Masalan: Full-Stack Bootcamp" className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold text-slate-800" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Narxi (SO'M)</label>
               <input name="price" type="number" required defaultValue={editingCourse?.price} placeholder="1,200,000" className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold text-green-600" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tavsif (Majburiy emas)</label>
               <textarea name="description" defaultValue={editingCourse?.description} className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold text-slate-800 h-32" />
            </div>
            <Button type="submit" className="w-full py-8 text-lg">SAQLASH</Button>
         </form>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => { if (deletingId) { deleteCourse(deletingId); setDeletingId(null); } }}
        title="Kursni o'chirish"
        message="Rostdan ham bu kursni o'chirasizmi? Barcha bog'liq ma'lumotlar ham o'chiriladi."
        confirmText="O'CHIRISH"
      />
    </div>
  );
};

export default CoursesPage;
