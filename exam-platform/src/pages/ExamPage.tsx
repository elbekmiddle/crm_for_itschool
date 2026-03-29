import React, { useEffect } from 'react';
import { useExamStore } from '../store/useExamStore';
import ExamTimer from '../components/ExamTimer';
import SidebarNavigator from '../components/SidebarNavigator';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

const ExamPage: React.FC = () => {
  const { 
    questions, 
    currentQuestionIndex, 
    answers, 
    setAnswer, 
    nextQuestion, 
    prevQuestion,
    incrementViolations,
    finishExam
  } = useExamStore();

  const currentQuestion = questions[currentQuestionIndex];

  // Anti-cheat: Tab Switch Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        incrementViolations();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [incrementViolations]);

  if (!currentQuestion) return <div>Loading questions...</div>;

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="flex bg-white min-h-screen">
      <SidebarNavigator />
      
      <div className="flex-1 flex flex-col">
        <ExamTimer />
        
        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 w-full overflow-hidden">
          <div 
            className="h-full bg-primary-500 transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>

        <main className="flex-1 p-12 max-w-5xl mx-auto w-full">
          <div className="space-y-12">
            <header className="space-y-4">
              <span className="text-primary-600 font-bold bg-primary-50 px-3 py-1 rounded-full text-sm">
                Savol {currentQuestionIndex + 1} / {questions.length}
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
                {currentQuestion.text}
              </h2>
            </header>

            <div className="space-y-4 mt-8">
              {currentQuestion.type === 'multiple_choice' ? (
                currentQuestion.options.map((opt) => (
                  <label 
                    key={opt.id}
                    className={cn(
                      "flex items-center p-6 border-2 rounded-2xl cursor-pointer transition-all active:scale-[0.99]",
                      answers[currentQuestion.id] === opt.id 
                        ? "border-primary-600 bg-primary-50 ring-1 ring-primary-200" 
                        : "border-slate-100 hover:border-slate-300 bg-slate-50 shadow-sm"
                    )}
                  >
                    <input 
                      type="radio" 
                      name={currentQuestion.id} 
                      className="hidden" 
                      checked={answers[currentQuestion.id] === opt.id}
                      onChange={() => setAnswer(currentQuestion.id, opt.id)}
                    />
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 shrink-0 transition-colors",
                      answers[currentQuestion.id] === opt.id 
                        ? "border-primary-600 bg-primary-600" 
                        : "border-slate-300 bg-white"
                    )}>
                      {answers[currentQuestion.id] === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className={cn(
                      "text-lg font-medium",
                      answers[currentQuestion.id] === opt.id ? "text-primary-900" : "text-slate-700"
                    )}>
                      {opt.text}
                    </span>
                  </label>
                ))
              ) : (
                <textarea 
                  className="w-full min-h-[300px] p-6 text-xl bg-slate-50 border-2 border-slate-200 rounded-3xl outline-none focus:border-primary-500 focus:bg-white transition-all shadow-inner"
                  placeholder="Javobingizni bu yerga kiriting..."
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                />
              )}
            </div>

            <footer className="flex items-center justify-between pt-12 border-t border-slate-100">
              <button 
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 font-bold text-slate-500 disabled:opacity-30 hover:text-primary-600 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" /> Oldingisi
              </button>

              <div className="flex gap-4">
                {currentQuestionIndex === questions.length - 1 ? (
                  <button 
                    onClick={() => { if(window.confirm('Imtihonni yakunlaysizmi?')){ finishExam(); } }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-green-100 transition-all active:scale-95"
                  >
                    Yakunlash <CheckCircle2 className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={nextQuestion}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-primary-200 transition-all active:scale-95"
                  >
                    Keyingisi <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExamPage;
