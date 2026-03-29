import React from 'react';
import { useExamStore } from '../store/useExamStore';
import { cn } from '../lib/utils'; // I'll add this later

const SidebarNavigator: React.FC = () => {
  const { questions, currentQuestionIndex, jumpToQuestion, answers } = useExamStore();

  return (
    <div className="w-80 bg-slate-50 border-r min-h-screen p-6 sticky top-20 overflow-y-auto">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Savollar Ro'yxati</h3>
      
      <div className="grid grid-cols-5 gap-3">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentQuestionIndex;
          const isAnswered = !!answers[q.id];
          
          return (
            <button
              key={q.id}
              onClick={() => jumpToQuestion(idx)}
              className={cn(
                "h-12 w-12 rounded-xl text-lg font-bold flex items-center justify-center transition-all duration-200 border-2",
                isCurrent 
                  ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200" 
                  : isAnswered 
                    ? "bg-primary-100 border-primary-200 text-primary-700"
                    : "bg-white border-slate-200 text-slate-400 hover:border-primary-400 hover:text-primary-600"
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-12 space-y-4 pt-12 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-primary-600" />
          <span className="text-sm font-medium text-slate-600">Joriy Savol</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-primary-100 border border-primary-200" />
          <span className="text-sm font-medium text-slate-600">Javob Berilgan</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-white border border-slate-200" />
          <span className="text-sm font-medium text-slate-600">Ochib Ko'rilmagan</span>
        </div>
      </div>
    </div>
  );
};

export default SidebarNavigator;
