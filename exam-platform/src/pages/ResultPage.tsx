import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { Trophy, Clock, CheckCircle2, XCircle, ArrowLeft, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import api from '../lib/api';

const ResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { attemptId, questions, answers, finishReason } = useExamStore();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Try server result first
      try {
        const aid = attemptId || id;
        if (aid) {
          const { data } = await api.get(`/exams/attempt/${aid}/result`);
          setResult(data);
          setLoading(false);
          return;
        }
      } catch {}
      // Fallback: compute locally
      if (questions && answers) {
        const answered = Object.keys(answers).length;
        setResult({ score: Math.round((answered / Math.max(questions.length, 1)) * 100), correct: answered, total: questions.length });
      }
      setLoading(false);
    };
    load();
  }, [id, attemptId]);

  const score = result?.score ?? 0;
  const emoji = score >= 80 ? '😎' : score >= 50 ? '🙂' : '😢';
  const badge = score >= 80 ? 'Ajoyib natija!' : score >= 50 ? 'Yaxshi harakat!' : 'Ko\'proq o\'rgan!';
  const color = score >= 80 ? 'from-green-500 to-emerald-600' : score >= 50 ? 'from-amber-400 to-orange-500' : 'from-red-500 to-rose-600';

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>;

  return (
    <div className="min-h-[90vh] w-full flex items-center justify-center bg-slate-50/50 dark:bg-transparent overflow-hidden relative">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-400/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-sm animate-in space-y-5 relative z-10 px-4">

        {/* Score card */}
        <div className={`bg-gradient-to-br ${color} rounded-[2rem] p-10 text-white text-center relative overflow-hidden shadow-2xl`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12" />
          <div className="relative z-10">
            <div className="text-7xl mb-4 drop-shadow-lg">{emoji}</div>
            <p className="text-white/90 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{badge}</p>
            <div className="text-7xl font-black mb-1 tracking-tighter tabular-nums">{score}%</div>
            <div className="flex items-center justify-center gap-1.5 opacity-80">
               <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
               <p className="text-xs font-bold">Umumiy natija</p>
            </div>
          </div>
        </div>

        {/* Cheating warning */}
        {finishReason === 'cheating' && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-3xl p-6 text-center animate-in zoom-in-95 duration-500">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-black text-red-900 dark:text-red-200 mb-1">Imtihondan chetlatildingiz!</h3>
            <p className="text-xs font-semibold text-red-700 dark:text-red-400/80 leading-relaxed">
              Siz 3 marta ogohlantirish (boshqa tabga o'tish yoki ekrandan chiqish) oldingiz. Imtihon yakunlandi.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-6 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-12 h-12 bg-green-500/5 rounded-full -mr-6 -mt-6" />
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-3 ring-4 ring-green-50/50">
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">To'g'ri</p>
            <p className="text-3xl font-black text-green-600 tabular-nums">{result?.correct ?? result?.correct_count ?? '—'}</p>
          </div>

          <div className="card p-6 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/5 rounded-full -mr-6 -mt-6" />
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-3 ring-4 ring-red-50/50">
              <XCircle className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Noto'g'ri</p>
            <p className="text-3xl font-black text-red-500 tabular-nums">
              {result?.incorrect ?? result?.incorrect_count ?? (result?.total && (result?.correct || result?.correct_count) ? result.total - (result.correct || result.correct_count) : '—')}
            </p>
          </div>

          <div className="card p-6 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-12 h-12 bg-primary-500/5 rounded-full -mr-6 -mt-6" />
            <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mb-3 ring-4 ring-primary-50/50">
              <Trophy className="w-7 h-7 text-primary-500" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jami savol</p>
            <p className="text-3xl font-black text-slate-800 tabular-nums">{result?.total ?? result?.total_questions ?? questions?.length ?? '—'}</p>
          </div>

          <div className="card p-6 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 rounded-full -mr-6 -mt-6" />
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-3 ring-4 ring-amber-50/50">
              <Clock className="w-7 h-7 text-amber-500" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sarf vaqt</p>
            <p className="text-3xl font-black text-slate-800 tabular-nums">{result?.time_taken ? `${result.time_taken}s` : '—'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => navigate(`/exams/${id}/review`)}
            className="btn-secondary w-full py-3.5 flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" /> Javoblarni ko'rish
          </button>
          <button
            onClick={() => navigate('/exams')}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Imtihonlarga qaytish
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
