import React from 'react';
import { Clock, Target, ChevronRight, BookOpen, Play, RotateCcw, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { ExamStatus } from '../types';

interface ExamCardProps {
  id: string;
  title: string;
  duration: number;
  questions_count?: number;
  status: ExamStatus;
  score?: number;
  onClick: () => void;
}

const statusConfig: Record<ExamStatus, { label: string; color: string; icon: typeof Play; cta: string }> = {
  NOT_STARTED: { label: 'Boshlanmagan', color: 'bg-slate-50 text-slate-500 border-slate-200', icon: Play, cta: 'Boshlash' },
  IN_PROGRESS: { label: 'Davom etmoqda', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: RotateCcw, cta: 'Davom etish' },
  COMPLETED: { label: 'Yakunlangan', color: 'bg-green-50 text-green-600 border-green-200', icon: CheckCircle2, cta: 'Natija' },
};

const ExamCard: React.FC<ExamCardProps> = ({
  title,
  duration,
  questions_count,
  status,
  score,
  onClick,
}) => {
  const config = statusConfig[status] || statusConfig.NOT_STARTED;
  const StatusIcon = config.icon;

  return (
    <div onClick={onClick} className="card p-6 cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
          <BookOpen className="w-5 h-5" />
        </div>
        <span className={cn("status-pill", config.color)}>
          {config.label}
        </span>
      </div>

      <h4 className="font-bold text-slate-800 mb-3 text-lg line-clamp-2 group-hover:text-primary-600 transition-colors">
        {title}
      </h4>

      <div className="flex items-center gap-4 text-xs text-slate-400 font-medium mb-6">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> {duration} min
        </span>
        <span className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" /> {questions_count || '—'} savol
        </span>
      </div>

      {status === 'COMPLETED' && score !== undefined && (
        <div className="mb-4">
          <div className="text-2xl font-black text-green-600">{score}%</div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2 text-primary-600 font-bold text-sm group-hover:gap-3 transition-all">
          <StatusIcon className="w-4 h-4" />
          {config.cta}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
};

export default ExamCard;
