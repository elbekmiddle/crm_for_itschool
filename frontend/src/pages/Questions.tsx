import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { 
  Plus, 
  Search, 
  HelpCircle, 
  Trash2, 
  Edit2, 
  Filter,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Modal from '../components/Modal';
import api from '../lib/api';
import { cn } from '../lib/utils';

const QuestionsPage = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/questions');
      setQuestions(data);
    } catch (e) {
      console.error('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // In a real app, we'd handle options array here
    try {
      if (editingQuestion) {
        await api.patch(`/questions/${editingQuestion.id}`, data);
      } else {
        await api.post('/questions', data);
      }
      fetchQuestions();
      setIsModalOpen(false);
    } catch (e) {
      alert("Saqlashda xato!");
    }
  };

  return (
    <div className="p-14 space-y-14">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">Savollar Bazasi</h1>
          <p className="text-lg text-slate-400 font-bold tracking-wide uppercase px-2 leading-none">Imtihonlar uchun test savollarini qo'lda boshqarish</p>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 border border-slate-50">
              <Search className="w-6 h-6 text-slate-300" />
              <input placeholder="Savol qidirish..." className="outline-none border-none bg-transparent font-bold text-slate-600 w-64 text-lg" />
           </div>
           <Button onClick={() => setIsModalOpen(true)} className="px-10 py-6">
              <Plus className="w-6 h-6" /> SAVOL QO'SHISH
           </Button>
        </div>
      </header>

      <div className="grid gap-8">
        {questions.map((q, idx) => (
          <motion.div 
            key={q.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 group hover:shadow-2xl transition-all"
          >
            <div className="flex items-start gap-10">
               <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 font-black text-xl group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                  {idx + 1}
               </div>
               
               <div className="flex-1 space-y-6">
                  <div className="flex items-center justify-between">
                     <span className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm leading-none">
                        {q.topic || 'Dasturlash'}
                     </span>
                     <div className="flex gap-2">
                        <button className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 transition-all"><Edit2 className="w-5 h-5" /></button>
                        <button className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-all"><Trash2 className="w-5 h-5" /></button>
                     </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-800 leading-tight tracking-tight uppercase">{q.text}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {q.options?.map((opt: string, i: number) => (
                       <div key={i} className={cn(
                         "p-5 rounded-2xl border-2 font-bold flex items-center justify-between",
                         opt === q.correct_answer ? "bg-green-50 border-green-200 text-green-700" : "bg-slate-50 border-transparent text-slate-600"
                       )}>
                          {opt}
                          {opt === q.correct_answer && <CheckCircle2 className="w-5 h-5" />}
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </motion.div>
        ))}
        
        {loading && (
          <div className="py-40 flex flex-col items-center justify-center gap-6 opacity-20">
             <Loader2 className="w-16 h-16 animate-spin" />
             <p className="font-black text-xl uppercase tracking-widest leading-none">Savollar yuklanmoqda...</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default QuestionsPage;
