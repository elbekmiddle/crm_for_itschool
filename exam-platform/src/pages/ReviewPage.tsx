import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Info,
  Clock,
  Target,
  Trophy,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const ReviewPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await api.get(`/exams/result/${id}`);
        setResult(data);
      } catch (error) {
        console.error('Failed to fetch result review:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tahlillarni yuklanmoqda...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8 lg:p-14 space-y-12 max-w-7xl mx-auto">
      
      {/* Header */}
      <header className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/dashboard')}
          className="p-4 bg-white rounded-2xl shadow-lg border border-slate-50 hover:bg-slate-50 transition-all text-slate-400 group"
        >
          <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="text-right space-y-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">Natija Tahlili</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{result?.exam_title}</p>
        </div>
      </header>

      {/* Summary Score */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-slate-100 flex flex-col md:flex-row items-center justify-between gap-12 border border-slate-50 relative overflow-hidden"
      >
        <div className="space-y-4 relative z-10 text-center md:text-left">
           <div className="flex items-center justify-center md:justify-start gap-3">
              <Trophy className="w-8 h-8 text-orange-400" />
              <h2 className="text-5xl font-black text-slate-900 leading-none">{result?.score}%</h2>
           </div>
           <p className="text-slate-400 font-bold max-w-md uppercase tracking-wide text-xs leading-none">Siz jami {result?.total_questions} ta savoldan {result?.correct_answers} tasiga to'g'ri javob berdingiz.</p>
        </div>

        <div className="flex gap-8 relative z-10">
           <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-[1.5rem] bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
                 <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="text-lg font-black text-slate-800">{result?.correct_answers}</span>
           </div>
           <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-[1.5rem] bg-red-50 text-red-500 flex items-center justify-center shadow-sm">
                 <XCircle className="w-8 h-8" />
              </div>
              <span className="text-lg font-black text-slate-800">{result?.total_questions - result?.correct_answers}</span>
           </div>
        </div>
        
        <target className="absolute -right-10 -bottom-10 w-64 h-64 text-slate-50 opacity-10 rotate-12" />
      </motion.div>

      {/* Questions Review */}
      <div className="space-y-8">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest px-4">Batafsil sharh</h3>
        <div className="grid gap-6">
          {result?.details.map((item: any, idx: number) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={cn(
                "p-8 rounded-[3rem] border-4 transition-all bg-white shadow-xl shadow-slate-50",
                item.is_correct ? "border-green-100" : "border-red-100"
              )}
            >
              <div className="flex items-start gap-6">
                 <div className={cn(
                   "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black",
                   item.is_correct ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
                 )}>
                    {idx + 1}
                 </div>
                 <div className="flex-1 space-y-6">
                    <h4 className="text-xl font-bold text-slate-800 tracking-tight leading-relaxed">{item.question_text}</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="p-5 bg-slate-50 rounded-2xl border-2 border-transparent">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                             Sizning javob
                          </p>
                          <div className={cn(
                            "text-md font-bold",
                            item.is_correct ? "text-green-600" : "text-red-500"
                          )}>
                             {item.student_answer || "Javob berilmagan"}
                          </div>
                       </div>
                       
                       {!item.is_correct && (
                         <div className="p-5 bg-green-50 rounded-2xl border-2 border-transparent">
                            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                               To'g'ri javob
                            </p>
                            <div className="text-md font-bold text-green-600">
                               {item.correct_answer}
                            </div>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ReviewPage;
