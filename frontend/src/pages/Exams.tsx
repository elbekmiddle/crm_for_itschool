import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Zap, 
  Clock, 
  HelpCircle,
  Bot,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

const ExamCard = ({ exam, onDelete, onAi }: any) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-50 relative group flex flex-col justify-between"
  >
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="p-4 bg-primary-50 rounded-2xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-sm border border-primary-100">
           <Zap className="w-6 h-6" />
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => onAi(exam)}
             className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all shadow-sm"
           >
             <Sparkles className="w-5 h-5" />
           </button>
           <button 
             onClick={() => onDelete(exam.id)}
             className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-sm"
           >
             <Trash2 className="w-5 h-5" />
           </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-primary-600 transition-colors uppercase">{exam.title}</h3>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{exam.course_name || "Frontend Web"}</p>
      </div>

      <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
         <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
            <Clock className="w-4 h-4" /> {exam.duration} min
         </div>
         <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
            <HelpCircle className="w-4 h-4" /> {exam.questions?.length || 0} savol
         </div>
      </div>
    </div>
    
    <div className="mt-8">
       <Button variant="ghost" className="w-full justify-between px-6 py-5 group-hover:bg-slate-50">
          NATIJALAR <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
       </Button>
    </div>
  </motion.div>
);

const ExamsPage = () => {
  const { exams, fetchExams, createExam, generateAiExam, deleteStudent, isLoading } = useAdminStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    await createExam(data);
    setIsModalOpen(false);
  };

  const handleAiGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const options = Object.fromEntries(formData.entries());
    
    setIsGenerating(true);
    await generateAiExam(selectedExam.id, options);
    setIsGenerating(false);
    setIsAiModalOpen(false);
    setSelectedExam(null);
  };

  const handleDelete = (id: string) => {
    // using existing logic for delete exam placeholder
    setDeletingId(id);
    setIsConfirmOpen(true);
  };

  return (
    <div className="p-8 lg:p-14 space-y-14">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-indigo-50 px-5 py-2 rounded-full border border-indigo-100/50 shadow-sm text-indigo-600 font-black text-[10px] uppercase tracking-widest">
             <Bot className="w-4 h-4" /> AI Powered Engine
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase">Imtihonlar</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm px-2 leading-none">Sertifikat uchun yakuniy nazoratlar boshqaruvi</p>
        </div>
        
        <Button onClick={() => setIsModalOpen(true)} className="px-10 py-6">
           <Plus className="w-6 h-6" /> TEST YARATISH
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
        <AnimatePresence>
          {exams.map((exam) => (
             <ExamCard 
               key={exam.id} 
               exam={exam} 
               onDelete={handleDelete}
               onAi={(exam: any) => { setSelectedExam(exam); setIsAiModalOpen(true); }}
             />
          ))}
        </AnimatePresence>
        
        {exams.length === 0 && !isLoading && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center gap-6 opacity-20">
             <Zap className="w-24 h-24 text-primary-600" />
             <p className="text-2xl font-black uppercase tracking-widest">Hozircha testlar mavjud emas</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yangi Test Yaratish">
         <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Sarlavha</label>
               <input name="title" required placeholder="Masalan: React Hooks Mid-term" className="w-full p-6 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Vaqt (Daqiqa)</label>
                  <input type="number" name="duration" defaultValue={60} className="w-full p-6 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kurs ID (Ixtiyoriy)</label>
                  <input name="course_id" className="w-full p-6 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800" />
               </div>
            </div>
            <Button type="submit" className="w-full py-6">YARATISH</Button>
         </form>
      </Modal>

      <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="AI Savollar Generatsiyasi">
         <form onSubmit={handleAiGenerate} className="space-y-8">
            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Sparkles className="w-6 h-6 animate-pulse" />
               </div>
               <div>
                  <h4 className="font-black text-indigo-900 uppercase text-xs tracking-widest">{selectedExam?.title}</h4>
                  <p className="text-xs font-bold text-indigo-400">AI tomonidan {selectedExam?.course_name || "kurs"} bo'yicha savollar yaratiladi.</p>
               </div>
            </div>
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mavzu / Kalit so"zlar</label>
                  <input name="topic" required placeholder="Masalan: useEffect, Custom Hooks, Redux Saga" className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-3xl outline-none font-bold" />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Daraja</label>
                     <select name="difficulty" className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold border-none">
                        <option value="easy">Boshlang"ich</option>
                        <option value="medium">O"rta</option>
                        <option value="hard">Professional</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Savol soni</label>
                     <input type="number" name="count" defaultValue={20} className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold border-none" />
                  </div>
               </div>
            </div>
            <Button isLoading={isGenerating} type="submit" className="w-full py-6 bg-indigo-600 shadow-xl">
               <Zap className="w-5 h-5" /> GENERATSIYA QILISH
            </Button>
         </form>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => deletingId && deleteStudent(deletingId)}
        title="Imtihonni o'chirish?"
        message="Ushbu imtihon barcha natijalari bilan birga butunlay o'chib ketadi."
      />

    </div>
  );
};

export default ExamsPage;
