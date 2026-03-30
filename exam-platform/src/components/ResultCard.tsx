import React from 'react';
import { BarChart3, Clock, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';

interface ResultCardProps {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({
  score,
  totalQuestions,
  correctAnswers,
  timeTaken,
}) => {
  const percentage = totalQuestions > 0
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : score;

  const badge = percentage >= 80
    ? { emoji: '😎', text: 'Ajoyib natija!', color: 'text-green-600', bg: 'bg-green-100', glow: 'bg-green-500' }
    : percentage >= 50
      ? { emoji: '🙂', text: "Yomon emas", color: 'text-amber-600', bg: 'bg-amber-100', glow: 'bg-amber-500' }
      : { emoji: '😂', text: 'Yana harakat qiling', color: 'text-red-600', bg: 'bg-red-100', glow: 'bg-red-500' };

  return (
    <div className="glass-card rounded-3xl p-8 space-y-6 text-center">
      {/* Badge */}
      <div className="flex flex-col items-center gap-3">
        <div className={cn("relative w-24 h-24 rounded-full flex items-center justify-center shadow-xl", badge.bg)}>
          <span className="text-5xl">{badge.emoji}</span>
        </div>
        <h2 className={cn("text-2xl font-black", badge.color)}>{badge.text}</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-2xl">
          <div className="flex items-center justify-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span className="label-subtle">To'g'ri</span>
          </div>
          <div className="text-2xl font-black text-slate-800">{correctAnswers} / {totalQuestions}</div>
        </div>
        {timeTaken && (
          <div className="p-4 bg-slate-50 rounded-2xl">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="label-subtle">Vaqt</span>
            </div>
            <div className="text-2xl font-black text-slate-800">{timeTaken}</div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-1000", badge.glow)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs font-bold text-slate-400">Natija: {percentage}%</p>
      </div>
    </div>
  );
};

export default ResultCard;
