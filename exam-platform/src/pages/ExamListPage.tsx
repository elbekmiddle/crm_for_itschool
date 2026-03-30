import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { ClipboardList, Clock, HelpCircle, Loader2, Trophy, Play, ArrowRight } from 'lucide-react';

type FilterTab = 'all' | 'upcoming' | 'completed';

const ExamListPage: React.FC = () => {
  const { exams, fetchExams, isLoading } = useExamStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<FilterTab>('all');

  useEffect(() => { fetchExams(); }, []);

  const safeExams = Array.isArray(exams) ? exams : [];
  const filtered = safeExams.filter((e: any) => {
    if (tab === 'upcoming') return e.status !== 'COMPLETED';
    if (tab === 'completed') return e.status === 'COMPLETED';
    return true;
  });

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'Barchasi' },
    { id: 'upcoming', label: 'Kutilmoqda' },
    { id: 'completed', label: 'Yakunlangan' },
  ];

  return (
    <div className="page-container space-y-6 pb-20 lg:pb-6 animate-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Imtihonlar</h1>
        <p className="text-slate-400 text-sm mt-1">Barcha imtihonlaringiz</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${tab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
          >
            {label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-black ${tab === id ? 'bg-primary-100 text-primary-600' : 'bg-slate-200 text-slate-400'}`}>
              {safeExams.filter((e: any) => {
                if (id === 'upcoming') return e.status !== 'COMPLETED';
                if (id === 'completed') return e.status === 'COMPLETED';
                return true;
              }).length}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card p-12 flex justify-center"><Loader2 className="w-7 h-7 text-primary-400 animate-spin" /></div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((exam: any) => {
            const isCompleted = exam.status === 'COMPLETED';
            const isInProgress = exam.status === 'IN_PROGRESS';
            return (
              <button
                key={exam.id}
                onClick={() => navigate(isCompleted ? `/exams/${exam.id}/result` : `/exams/${exam.id}`)}
                className="card-hover w-full p-5 flex items-center gap-4 text-left"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isCompleted ? 'bg-green-50' : isInProgress ? 'bg-amber-50' : 'bg-primary-50'}`}>
                  {isCompleted
                    ? <Trophy className="w-6 h-6 text-green-500" />
                    : isInProgress
                    ? <Play className="w-6 h-6 text-amber-500" />
                    : <ClipboardList className="w-6 h-6 text-primary-500" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{exam.title}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-slate-400 font-semibold">
                      <Clock className="w-3 h-3" /> {exam.duration} daqiqa
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400 font-semibold">
                      <HelpCircle className="w-3 h-3" /> {exam.questions_count} savol
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {isCompleted && exam.score !== undefined && (
                    <p className={`text-lg font-black ${exam.score >= 70 ? 'text-green-600' : 'text-red-500'}`}>{exam.score}%</p>
                  )}
                  <span className={`status-pill ${isCompleted ? 'pill-done' : isInProgress ? 'pill-pending' : 'pill-frozen'}`}>
                    {isCompleted ? '✓ Yakunlandi' : isInProgress ? '▶ Davom etmoqda' : '○ Kutilmoqda'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">
            {tab === 'completed' ? 'Yakunlangan imtihonlar yo\'q' : 'Imtihonlar topilmadi'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ExamListPage;
