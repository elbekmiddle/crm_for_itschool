import React, { useState } from 'react';
import { useExamStore } from '../store/useExamStore';
import { cn } from '../lib/utils';
import { Flag, Menu, X, ChevronLeft } from 'lucide-react';

const SidebarNavigator: React.FC = () => {
  const { questions, currentQuestionIndex, jumpToQuestion, answers, flagged } = useExamStore();
  const [isOpen, setIsOpen] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const flaggedCount = flagged.size;

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Savollar</h3>
        <button className="md:hidden p-2 hover:bg-slate-100 rounded-xl" onClick={() => setIsOpen(false)}>
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentQuestionIndex;
          const isAnswered = !!answers[q.id];
          const isFlagged = flagged.has(q.id);

          return (
            <button
              key={q.id}
              onClick={() => { jumpToQuestion(idx); setIsOpen(false); }}
              className={cn(
                "relative h-11 w-11 rounded-xl text-sm font-bold flex items-center justify-center transition-all duration-200 border-2",
                isCurrent
                  ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200"
                  : isAnswered
                    ? "bg-primary-50 border-primary-200 text-primary-700"
                    : "bg-white border-slate-200 text-slate-400 hover:border-primary-300"
              )}
            >
              {idx + 1}
              {isFlagged && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                  <Flag className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="space-y-3 pt-6 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-primary-600" />
          <span className="text-xs font-semibold text-slate-500">Joriy savol</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-primary-50 border border-primary-200" />
          <span className="text-xs font-semibold text-slate-500">Javob berilgan ({answeredCount})</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-white border border-slate-200" />
          <span className="text-xs font-semibold text-slate-500">Javobsiz ({questions.length - answeredCount})</span>
        </div>
        {flaggedCount > 0 && (
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300 flex items-center justify-center">
              <Flag className="w-2.5 h-2.5 text-amber-500" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Belgilangan ({flaggedCount})</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed bottom-6 left-4 z-40 w-12 h-12 bg-primary-600 text-white rounded-2xl shadow-xl shadow-primary-200 flex items-center justify-center"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-0 w-72 h-full bg-white p-6 overflow-y-auto shadow-2xl animate-in">
            {content}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 min-h-screen p-6 sticky top-0 overflow-y-auto h-screen no-scrollbar">
        {content}
      </div>
    </>
  );
};

export default SidebarNavigator;
