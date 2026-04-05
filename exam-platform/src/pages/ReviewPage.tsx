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
    <div className="page-container max-w-2xl mx-auto space-y-6 pb-20 lg:pb-6 animate-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/exams/${id}/result`)} className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center hover:border-primary-300 transition-all">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900">Javoblarni ko'rish</h1>
          <p className="text-slate-400 text-xs mt-0.5">{correct} / {total} to'g'ri javob</p>
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
                        <div key={oi} className={`p-3 rounded-xl text-sm font-medium border transition-all ${isCorrectOpt ? 'bg-green-50 border-green-200 text-green-800' : isStudentAnswer && !isCorrectOpt ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                          {isCorrectOpt && <span className="font-bold mr-1">✓</span>}
                          {isStudentAnswer && !isCorrectOpt && <span className="font-bold mr-1">✗</span>}
                          {optVal}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Text answer */}
                {!q.options && isAnswered && (
                  <div className={`p-3 rounded-xl text-sm font-medium border ${isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    Javobingiz: {q.student_answer}
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
