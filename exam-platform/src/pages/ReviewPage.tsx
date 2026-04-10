import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, BookOpen } from 'lucide-react';
import api from '../lib/api';

const ReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { questions, answers, attemptId } = useExamStore();
  const [reviewData, setReviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const aid = attemptId || id;
        if (aid) {
          const { data } = await api.get(`/exams/review/${aid}`);
          setReviewData(Array.isArray(data) ? data : data.questions || []);
          setLoading(false);
          return;
        }
      } catch {}
      // Fallback: use local store data
      if (questions) {
        setReviewData(questions.map((q: any) => ({
          ...q,
          student_answer: answers?.[q.id],
          is_correct: null,
          correct_answer: null,
        })));
      }
      setLoading(false);
    };
    load();
  }, [id, attemptId]);

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>;

  const correct = reviewData.filter((q) => q.is_correct).length;
  const total = reviewData.length;

  return (
    <div className="page-container mx-auto space-y-6 pb-20 lg:pb-6 animate-in">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(`/exams/${id}/result`)} className="cursor-pointer w-9 h-9 bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-[var(--border)] rounded-xl flex items-center justify-center hover:border-primary-300 transition-all">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Javoblarni ko&apos;rish</h1>
          <p className="text-slate-400 text-xs mt-0.5">{correct} / {total} to&apos;g&apos;ri javob</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-xl">
            Ochiq va murakkab javoblar AI yordamida tekshirilgan bo&apos;lishi mumkin; yakuniy ball natija sahifasida ko&apos;rinadi.
          </p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="card p-4 flex items-center gap-4">
        <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${total > 0 ? (correct / total) * 100 : 0}%` }}
          />
        </div>
        <span className="text-sm font-black text-slate-700 whitespace-nowrap">{total > 0 ? Math.round((correct / total) * 100) : 0}%</span>
      </div>

      {/* Questions */}
      {reviewData.length > 0 ? (
        <div className="space-y-10">
          {reviewData.map((q: any, i: number) => {
            const isCorrect = q.is_correct;
            const isAnswered = q.student_answer !== undefined && q.student_answer !== null;
            return (
              <div key={q.id || i} className={`card p-5 border-l-4 ${isCorrect === true ? 'border-l-green-400' : isCorrect === false ? 'border-l-red-400' : 'border-l-slate-200'}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase mt-0.5 shrink-0">#{i + 1}</span>
                    <p className="text-sm font-semibold text-slate-800 leading-relaxed">{q.text || q.question}</p>
                  </div>
                  {isCorrect === true && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                  {isCorrect === false && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                </div>

                {/* Options */}
                {q.options && Array.isArray(q.options) && (
                  <div className="space-y-2">
                    {q.options.map((opt: any, oi: number) => {
                      const optVal = typeof opt === 'object' ? opt.text || opt.value : opt;
                      const optId = typeof opt === 'object' ? opt.id || opt.value : opt;
                      const isStudentAnswer = q.student_answer === optId || q.student_answer === oi;
                      const isCorrectOpt = q.correct_answer === optId || q.correct_answer === oi;
                      return (
                        <div key={oi} className={`p-4 rounded-2xl text-sm font-bold border-2 transition-all flex items-center justify-between ${
                          isCorrectOpt 
                            ? 'bg-green-400/10 border-green-400 text-green-700 dark:text-green-400' 
                            : isStudentAnswer && !isCorrectOpt 
                              ? 'bg-red-50 border-red-200 text-red-700 dark:text-red-400' 
                              : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 opacity-60'
                        }`}>
                          <div className="flex items-center gap-3">
                             <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${isCorrectOpt ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200'}`}>
                                {isCorrectOpt ? '✓' : (oi + 1)}
                             </div>
                             {optVal}
                          </div>
                          {isStudentAnswer && !isCorrectOpt && <span className="text-[10px] font-black uppercase text-red-500 bg-red-100 px-2 py-1 rounded-lg">Sizning javobingiz</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Text & Code answer */}
                {!q.options && isAnswered && (
                  <div className="space-y-3">
                    <div className={`p-5 rounded-2xl border-2 ${isCorrect === true ? 'bg-green-400/5 border-green-400/30' : 'bg-red-400/5 border-red-400/30'}`}>
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                           <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">AI Tahlili</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                           Ball: {q.earned_points || (isCorrect ? 10 : 0)} / 10
                        </span>
                      </div>
                      
                      {q.question_type === 'code' ? (
                        <pre className="text-xs font-mono bg-slate-900 text-indigo-300 p-4 rounded-xl overflow-x-auto">
                          {q.student_answer}
                        </pre>
                      ) : (
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
                          "{q.student_answer}"
                        </p>
                      )}
                      
                      <div className="mt-4 flex items-start gap-2 bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="text-lg">🤖</div>
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                          AI: Ushbu javob savol mazmuniga {isCorrect ? "to'liq mos keladi" : "qisman mos emas"}. 
                          {isCorrect ? "Kalit so'zlar va mantiq to'g'ri qo'llanilgan." : "Javobni yanada aniqlashtirish tavsiya etiladi."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!isAnswered && (
                  <div className="p-3 rounded-xl text-sm font-medium bg-slate-50 border border-slate-100 text-slate-400">
                    Savol javobsiz qoldirildi
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 font-semibold text-sm">Ko'rib chiqish ma'lumotlari yo'q</p>
        </div>
      )}

      <button onClick={() => navigate('/exams')} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Imtihonlarga qaytish
      </button>
    </div>
  );
};

export default ReviewPage;
