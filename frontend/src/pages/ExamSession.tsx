import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentStore } from '../store/useStudentStore';
import { 
  Clock, 
  Send, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  ShieldAlert,
  ClipboardList
} from 'lucide-react';
import { cn } from '../lib/utils';

const ExamSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeAttempt, timeLeft, startExam, saveAnswer, submitExam, decrementTime, resetAttempt, isLoading } = useStudentStore();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [warnings, setWarnings] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  
  const timerRef = useRef<any>(null);

  // Initialize Exam
  useEffect(() => {
    if (id) {
       startExam(id).catch(() => navigate('/student/exams'));
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      resetAttempt();
    };
  }, [id]);

  // Timer logic
  useEffect(() => {
    if (activeAttempt && !timerRef.current) {
      timerRef.current = setInterval(() => {
        decrementTime();
      }, 1000);
    }
    if (timeLeft === 0 && activeAttempt) {
      handleFinalSubmit();
    }
  }, [activeAttempt, timeLeft]);

  // Anti-cheat: Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && activeAttempt) {
        const nextWarnings = warnings + 1;
        setWarnings(nextWarnings);
        setShowWarning(true);
        if (nextWarnings >= 3) {
          handleFinalSubmit();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeAttempt, warnings]);

  const handleAnswerSelect = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    if (activeAttempt) {
      saveAnswer(activeAttempt.id, questionId, value);
    }
  };

  const handleFinalSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (activeAttempt) {
      try {
        await submitExam(activeAttempt.id);
        navigate(`/student/exams/${id}/result`);
      } catch (e) {
        alert("Imtihonni topshirishda xato yuz berdi. Iltimos qayta urinib ko'ring.");
      }
    }
  };

  if (isLoading || !activeAttempt) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center gap-4 z-[100]">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Imtihon yuklanmoqda...</p>
      </div>
    );
  }

  const questions = activeAttempt.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-20 pb-10 px-4">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black text-slate-800 leading-tight truncate max-w-[200px]">{activeAttempt.exam.title}</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentQuestionIndex + 1} / {totalQuestions} SAVOL</p>
            </div>
          </div>

          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all",
            timeLeft < 300 ? "bg-red-50 border-red-200 text-red-600 animate-pulse" : "bg-primary-50 border-primary-100 text-primary-600"
          )}>
            <Clock className="w-4 h-4" />
            <span className="text-lg font-black font-mono">{formatTime(timeLeft)}</span>
          </div>

          <button 
            onClick={() => { if(confirm("Imtihonni topshirmoqchimisiz?")) handleFinalSubmit(); }}
            className="btn-primary py-2.5 px-6 flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> <span>Yakunlash</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full mt-8 animate-in">
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full mb-8 overflow-hidden">
          <div className="bg-primary-600 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Question Card */}
        <div className="card p-8 min-h-[400px] flex flex-col">
          <div className="flex items-start gap-4 mb-8">
            <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 shrink-0">
               {currentQuestionIndex + 1}
            </span>
            <h2 className="text-xl font-bold text-slate-800 leading-snug">
              {currentQuestion.text}
            </h2>
          </div>

          <div className="space-y-3 mb-12">
            {(currentQuestion.options || []).map((option: any, idx: number) => (
              <label 
                key={idx}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer group",
                  answers[currentQuestion.id] === option.value 
                    ? "border-primary-500 bg-primary-50/50" 
                    : "border-slate-50 hover:border-slate-200"
                )}
              >
                <input 
                  type="radio" 
                  name={`q-${currentQuestion.id}`} 
                  className="hidden"
                  checked={answers[currentQuestion.id] === option.value}
                  onChange={() => handleAnswerSelect(currentQuestion.id, option.value)}
                />
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  answers[currentQuestion.id] === option.value 
                    ? "border-primary-500 bg-primary-500 text-white" 
                    : "border-slate-200 group-hover:border-slate-400"
                )}>
                  {answers[currentQuestion.id] === option.value && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-sm font-semibold text-slate-700">{option.text}</span>
              </label>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-8">
            <button 
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(v => v - 1)}
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Oldingisi
            </button>
            
            {currentQuestionIndex < totalQuestions - 1 ? (
              <button 
                onClick={() => setCurrentQuestionIndex(v => v + 1)}
                className="px-8 py-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-900 transition-all flex items-center gap-2"
              >
                Keyingisi <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={() => { if(confirm("Imtihonni topshirmoqchimisiz?")) handleFinalSubmit(); }}
                className="px-8 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 shadow-lg shadow-green-100 transition-all flex items-center gap-2"
              >
                Tugatish <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Warnings Overlay */}
        {showWarning && (
          <div className="fixed inset-0 z-[110] bg-red-900/40 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl text-center animate-in-bounce">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-600">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">DIQQAT! OGOHLANTIRISH</h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                Sahifani tark etish yoki boshqa oynaga o'tish taqiqlanadi. 
                <br />
                <strong>{3 - warnings}</strong> ta imkoniyat qoldi. 3-marta ogohlantirilsangiz, imtihon avtomatik tarzda yakunlanadi.
              </p>
              <button 
                onClick={() => setShowWarning(false)}
                className="btn-primary w-full py-4 text-lg"
              >
                Tushundim, davom etaman
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="max-w-3xl mx-auto w-full mt-6 flex items-center justify-between text-slate-400">
         <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> Auto-save faol
         </div>
         <p className="text-[10px] font-bold uppercase tracking-widest italic"> Scholar Flow Security System v2.0 </p>
      </footer>
    </div>
  );
};

export default ExamSession;
