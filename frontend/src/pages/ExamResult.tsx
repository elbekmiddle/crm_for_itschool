import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useStudentStore } from '../store/useStudentStore';
import { 
  Trophy, 
  XCircle, 
  CheckCircle,
  CheckCircle2, 
  ArrowLeft, 
  ChevronRight,
  Clock,
  Target,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/api';

const ExamResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isReview = location.pathname.endsWith('/review');
  const { fetchResult, isLoading } = useStudentStore();
  const [result, setResult] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchResult(id).then(setResult);
      if (isReview) {
        api.get(`/student/exams/${id}/attempt`).then(res => setAttempt(res.data));
      }
    }
  }, [id, isReview]);

  if (isLoading || !result) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const isPassed = result.score >= (result.exam?.passing_score || 60);

  if (isReview && attempt) {
     return (
      <div className="page-container max-w-4xl mx-auto animate-in pt-10">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary-600 transition-all">
             <ArrowLeft className="w-4 h-4" /> Orqaga
           </button>
           <h1 className="text-xl font-black text-slate-800">Imtihon tahlili</h1>
           <div className="w-20" />
        </div>

        <div className="space-y-6 mb-12">
          {attempt.answers?.map((ans: any, idx: number) => {
            const q = attempt.questions?.find((bq: any) => bq.id === ans.question_id);
            return (
              <div key={idx} className={cn("card p-6 border-l-4", ans.is_correct ? "border-l-green-500" : "border-l-red-500")}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Savol {idx + 1}</p>
                    <p className="text-base font-bold text-slate-700">{q?.text || "Savol topilmadi"}</p>
                  </div>
                  {ans.is_correct ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <XCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {q?.options && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {Object.entries(q.options).map(([key, val]: [string, any]) => {
                      const isSelected = ans.answer_payload?.option === key;
                      const isCorrect = q.correct_answer === key;
                      return (
                        <div 
                          key={key} 
                          className={cn(
                            "p-4 rounded-xl border text-sm font-bold transition-all",
                            isCorrect ? "bg-green-400 border-green-500 text-white shadow-lg shadow-green-500/20" : 
                            isSelected && !isCorrect ? "bg-red-50 border-red-200 text-red-700" :
                            "bg-white border-slate-100 text-slate-500"
                          )}
                        >
                          <span className={cn("mr-2 uppercase opacity-70", isCorrect ? "text-white" : "text-slate-400")}>{key}:</span> {val}
                          {isCorrect && <span className="ml-2 text-[10px] font-black bg-white text-green-600 px-1.5 py-0.5 rounded uppercase shadow-sm">To'g'ri</span>}
                          {isSelected && !isCorrect && <span className="ml-2 text-[10px] font-black bg-red-200 text-red-700 px-1.5 py-0.5 rounded uppercase">Sizning javob</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {(!q?.options || Object.keys(q.options).length === 0) && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sizning javobingiz:</p>
                    <div className={cn(
                      "p-4 rounded-xl border text-sm",
                      q?.type === 'code' ? "bg-slate-900 border-slate-800 text-green-400 font-mono whitespace-pre-wrap" : "bg-slate-50 border-slate-100 text-slate-600"
                    )}>
                      {typeof ans.answer_payload === 'string' ? ans.answer_payload : JSON.stringify(ans.answer_payload)}
                    </div>
                  </div>
                )}
                
                {!ans.is_correct && q?.correct_answer && q?.type !== 'multiple_choice' && (
                  <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">To'g'ri javob namunasi / Kalit so'zlar:</p>
                    <p className="text-xs text-emerald-700 leading-relaxed font-bold">{String(q.correct_answer)}</p>
                  </div>
                )}
                
                {q?.explanation && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Eslatma / Izoh:</p>
                    <p className="text-xs text-slate-600 leading-relaxed italic">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
     );
  }

  return (
    <div className="page-container max-w-4xl mx-auto animate-in pt-10 pb-20">
      <div className="text-center mb-12">
        <div className={cn(
          "w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transition-all scale-110",
          isPassed ? "bg-green-500 text-white shadow-green-200" : "bg-red-500 text-white shadow-red-200"
        )}>
          {isPassed ? <Trophy className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
        </div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
          {isPassed ? "Tabriklaymiz!" : "Afsuski, o'ta olmadingiz"}
        </h1>
        <p className="text-slate-400 font-medium">
          {result.exam?.title} imtihoni natijasi
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 text-center">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3">
             <Target className="w-5 h-5 text-primary-600" />
          </div>
          <p className="label-subtle">Sizning balingiz</p>
          <p className={cn("text-3xl font-black mt-1", isPassed ? "text-green-600" : "text-red-600")}>
            {result.score}%
          </p>
        </div>
        <div className="card p-6 text-center">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
             <Clock className="w-5 h-5 text-slate-400" />
          </div>
          <p className="label-subtle">Sarflangan vaqt</p>
          <p className="text-3xl font-black text-slate-800 mt-1">
            {Math.round(result.duration_seconds / 60)} <span className="text-sm">daq</span>
          </p>
        </div>
        <div className="card p-6 text-center">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
             <CheckCircle2 className="w-5 h-5 text-slate-400" />
          </div>
          <p className="label-subtle">To'g'ri javoblar</p>
          <p className="text-3xl font-black text-slate-800 mt-1">
            {result.correct_answers} / {result.total_questions}
          </p>
        </div>
      </div>

      <div className="card p-8 mb-10 overflow-hidden relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Natijalar tahlili</h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-semibold">O'tish bali</span>
                    <span className="font-bold text-slate-700">{result.exam?.passing_score || 60}%</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-3 relative overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-slate-300 border-r-2 border-white z-10" 
                      style={{ width: `${result.exam?.passing_score || 60}%` }} 
                    />
                    <div 
                      className={cn("absolute left-0 top-0 h-full z-20 transition-all duration-1000", isPassed ? "bg-green-500" : "bg-red-500")}
                      style={{ width: `${result.score}%` }}
                    />
                 </div>
                 <p className="text-xs text-slate-400 font-medium italic">
                    * Sizning balingiz kamida {result.exam?.passing_score || 60}% bo'lishi kerak edi.
                 </p>
              </div>
           </div>
           <div className="w-full md:w-auto">
              <button 
                onClick={() => navigate(`/student/exams/${id}/review`)}
                className="w-full py-4 px-8 bg-slate-800 text-white rounded-2xl font-bold text-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
              >
                Savollarni ko'rib chiqish <ChevronRight className="w-5 h-5" />
              </button>
           </div>
        </div>
      </div>

      <div className="flex justify-center">
         <button 
           onClick={() => navigate('/student/exams')}
           className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary-600 transition-all"
         >
           <ArrowLeft className="w-4 h-4" /> Barcha imtihonlarga qaytish
         </button>
      </div>
    </div>
  );
};

export default ExamResult;
