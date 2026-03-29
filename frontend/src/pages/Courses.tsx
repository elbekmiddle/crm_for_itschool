import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  DollarSign, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Modal from '../components/Modal';

const CourseCard = ({ course, onDelete }: any) => (
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
        <button onClick={() => onDelete(course.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tighter">{course.name}</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Yo'nalish: Dasturlash</p>
      </div>

      <div className="flex items-center gap-2 bg-slate-50 p-4 rounded-2xl">
         <DollarSign className="w-5 h-5 text-green-500" />
         <span className="text-xl font-black text-slate-800">{course.price?.toLocaleString()} SO'M</span>
      </div>
    </div>

    <div className="mt-8 border-t border-slate-50 pt-6">
       <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span>{course.students_count || 0} Talaba</span>
          <button className="text-primary-600 hover:translate-x-1 transition-transform flex items-center gap-1">
            Batafsil <ChevronRight className="w-4 h-4" />
          </button>
       </div>
    </div>
  </motion.div>
);

const CoursesPage = () => {
  const { courses, fetchCourses, createCourse, isLoading } = useAdminStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    await createCourse({ ...data, price: Number(data.price) });
    setIsModalOpen(false);
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
             <CourseCard key={course.id} course={course} onDelete={() => {}} />
          ))}
        </AnimatePresence>
      </div>

      {isLoading && courses.length === 0 && (
         <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-10">
           <Loader2 className="w-12 h-12 animate-spin" />
           <p className="font-black text-xl uppercase tracking-widest">Kurslar yuklanmoqda...</p>
         </div>
      )}

      {/* New Course Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yangi Kurs Qo'shish">
         <form onSubmit={handleCreate} className="space-y-8">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Kurs Nomi</label>
               <input name="name" required placeholder="Masalan: Full-Stack Bootcamp" className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold text-slate-800" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Narxi (SO'M)</label>
               <input name="price" type="number" required placeholder="1,200,000" className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold text-green-600" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tavsif (Majburiy emas)</label>
               <textarea name="description" className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold text-slate-800 h-32" />
            </div>
            <Button type="submit" className="w-full py-8 text-lg">DAVOM ETISH</Button>
         </form>
      </Modal>
    </div>
  );
};

export default CoursesPage;
