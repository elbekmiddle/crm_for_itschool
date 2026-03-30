import React from 'react';
import { cn } from '../lib/utils';

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  text: string;
  isFlagged: boolean;
  children: React.ReactNode;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  questionNumber,
  totalQuestions,
  text,
  isFlagged,
  children,
}) => {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="stat-badge bg-primary-50 text-primary-600">
            Savol {questionNumber} / {totalQuestions}
          </span>
          {isFlagged && (
            <span className="stat-badge bg-amber-50 text-amber-600">
              🚩 Belgilangan
            </span>
          )}
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed">
          {text}
        </h2>
      </header>

      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};

export default QuestionCard;
