import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { Trophy, Clock, CheckCircle2, XCircle, ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import api from '../lib/api';

const ResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { attemptId, questions, answers } = useExamStore();
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
    <div className="relative py-10 w-full flex items-center justify-center">
      <div className="w-full max-w-sm animate-in space-y-5">

        {/* Score card */}
        <div className={`bg-gradient-to-br ${color} rounded-3xl p-8 text-white text-center relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12" />
          <div className="relative z-10">
            <div className="text-6xl mb-3">{emoji}</div>
            <p className="text-white/80 text-sm font-bold uppercase tracking-widest">{badge}</p>
            <div className="text-6xl font-black mt-3 mb-0.5">{score}%</div>
            <p className="text-white/70 text-sm font-semibold">Umumiy ball</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <p className="label-subtle">To'g'ri</p>
            <p className="text-2xl font-black text-green-600">{result?.correct ?? result?.correct_count ?? '—'}</p>
          </div>
          <div className="card p-4">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center mb-2">
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <p className="label-subtle">Noto'g'ri</p>
            <p className="text-2xl font-black text-red-500">
              {result?.incorrect ?? result?.incorrect_count ?? (result?.total && result?.correct ? result.total - result.correct : '—')}
            </p>
          </div>
          <div className="card p-4">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center mb-2">
              <Trophy className="w-4 h-4 text-primary-500" />
            </div>
            <p className="label-subtle">Jami savol</p>
            <p className="text-2xl font-black text-slate-800">{result?.total ?? result?.total_questions ?? questions?.length ?? '—'}</p>
          </div>
          <div className="card p-4">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center mb-2">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="label-subtle">Sarflangan vaqt</p>
            <p className="text-2xl font-black text-slate-800">{result?.time_taken ? `${result.time_taken}s` : '—'}</p>
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
