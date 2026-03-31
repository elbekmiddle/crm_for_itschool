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
  ClipboardList,
  CheckCircle,
  Menu
} from 'lucide-react';
import { cn } from '../lib/utils';
import AntiCheatWarningModal from '../components/AntiCheatWarningModal';
import SubmitConfirmModal from '../components/SubmitConfirmModal';

const ExamSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeAttempt, timeLeft, startExam, saveAnswer, submitExam, decrementTime, resetAttempt, isLoading } = useStudentStore();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [warnings, setWarnings] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  const saveTimeoutRef = useRef<any>(null);
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

  // Anti-cheat: Multi-tab prevention & Tab switch detection
  useEffect(() => {
    // 1. Multi-tab block via localStorage
    const sessionKey = `active_exam_session`;
    if (localStorage.getItem(sessionKey) && localStorage.getItem(sessionKey) !== id) {
       alert("Sizda boshqa aktiv imtihon sessiyasi mavjud. Kirish taqiqlanadi.");
       navigate('/student/exams');
       return;
    }
    localStorage.setItem(sessionKey, id || '');

    // 2. Restore backed up answers
    const backupKey = `exam_backup_${id}`;
    const backup = localStorage.getItem(backupKey);
    if (backup) {
      setAnswers(JSON.parse(backup));
    }

    const handleVisibilityChange = () => {
      if (document.hidden && activeAttempt) {
        setWarnings(prev => {
          const next = prev + 1;
          setShowWarning(true);
          if (next >= 3) {
            handleFinalSubmit();
          }
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
       document.removeEventListener('visibilitychange', handleVisibilityChange);
       localStorage.removeItem(sessionKey);
    };
  }, [activeAttempt]);

  const handleAnswerSelect = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    // 1. LocalStorage fallback
    localStorage.setItem(`exam_backup_${id}`, JSON.stringify(newAnswers));

    // 2. Debounced API save
    if (activeAttempt) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveAnswer(activeAttempt.id, questionId, value);
      }, 1000);
    }
  };

  const handleFinalSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
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
    <div className="min-h-screen bg-slate-50 flex flex-col pt-20">
      
      {/* Modals */}
      <SubmitConfirmModal 
        isOpen={showSubmitConfirm} 
        onClose={() => setShowSubmitConfirm(false)} 
        onConfirm={handleFinalSubmit} 
      />
      <AntiCheatWarningModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
        message={`Sahifani tark etish yoki boshqa oynaga o'tish taqiqlanadi. ${3 - warnings} ta imkoniyat qoldi. 3-marta qoidabuzarlikda imtihon yakunlanadi.`}
        confirmText="TUSHUNDIM"
      />

      {/* TOP: Sticky Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 px-6 py-3">
        <div className="mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="md:hidden p-2 bg-slate-100 rounded-lg text-slate-500">
               <Menu className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black text-slate-800 leading-tight truncate max-w-[300px]">{activeAttempt.exam.title}</h1>
              <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{currentQuestionIndex + 1} / {totalQuestions} SAVOL</p>
            </div>
          </div>

          <div className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-xl border-2 transition-all shadow-sm",
            timeLeft < 300 ? "bg-red-50 border-red-200 text-red-600 animate-pulse" : "bg-white border-primary-100 text-slate-800"
          )}>
            <Clock className={cn("w-5 h-5", timeLeft < 300 ? "text-red-500" : "text-primary-500")} />
            <span className="text-xl font-black font-mono tracking-tight">{formatTime(timeLeft)}</span>
          </div>

          <button 
            onClick={() => setShowSubmitConfirm(true)}
            className="btn-primary py-2.5 px-6 hidden md:flex items-center gap-2 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
            <Send className="w-4 h-4" /> <span>Yakunlash</span>
          </button>
        </div>
      </header>

      {/* Layout Container */}
      <div className="flex-1 flex w-full relative">
        
        {/* LEFT: Question Navigation */}
        <aside className={cn(
          "w-72 bg-white border-r border-slate-200 fixed top-16 bottom-0 overflow-y-auto p-6 md:translate-x-0 transition-transform z-30",
          mobileNavOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}>
           <h3 className="font-bold text-slate-800 mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
             <ClipboardList className="w-4 h-4 text-primary-500" /> Savollar
           </h3>
           <div className="grid grid-cols-4 gap-2">
             {questions.map((q: any, idx: number) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button 
                    key={q.id}
                    onClick={() => { setCurrentQuestionIndex(idx); setMobileNavOpen(false); }}
                    className={cn(
                       "aspect-square rounded-xl font-bold flex items-center justify-center text-sm transition-all border-2",
                       isCurrent 
                          ? "border-primary-500 bg-primary-50 text-primary-700 shadow-sm shadow-primary-100 scale-105" 
                          : isAnswered 
                             ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" 
                             : "border-slate-100 bg-white text-slate-500 hover:border-slate-300"
                    )}
                  >
                    {idx + 1}
                  </button>
                )
             })}
           </div>
           
           <div className="mt-8 space-y-4">
             <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                <div className="w-4 h-4 rounded-md border-2 border-green-200 bg-green-50" /> Yechilgan
             </div>
             <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                <div className="w-4 h-4 rounded-md border-2 border-slate-100 bg-white" /> Yechilmagan
             </div>
             <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                <div className="w-4 h-4 rounded-md border-2 border-primary-500 bg-primary-50" /> Joriy savol
             </div>
           </div>

           <button 
             onClick={() => setShowSubmitConfirm(true)}
             className="w-full mt-10 btn-primary md:hidden py-3 flex items-center justify-center gap-2"
           >
             <Send className="w-4 h-4" /> Yakunlash
           </button>
        </aside>

        {/* CENTER: Main Question Area */}
        <main className="flex-1 md:pl-72 p-6 md:p-10 flex flex-col items-center">
            
            <div className="w-full max-w-3xl">
              {/* Progress Bar (small context) */}
              <div className="w-full bg-slate-200 h-2 rounded-full mb-8 overflow-hidden shadow-inner">
                <div className="bg-primary-500 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>

              {/* Question Card */}
              <div className="card p-8 md:p-10 mb-8 shadow-xl shadow-slate-200/40 relative overflow-hidden bg-white">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary-500" />
                <div className="flex items-start gap-4 mb-8">
                  <span className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-sm font-black text-slate-500 shrink-0 border border-slate-100">
                    {currentQuestionIndex + 1}
                  </span>
                  <h2 className="text-2xl font-black text-slate-800 leading-normal pt-1 break-words">
                    {currentQuestion.text}
                  </h2>
                </div>

                <div className="space-y-4 mb-10">
                  {(currentQuestion.options || []).map((option: any, idx: number) => (
                    <label 
                      key={idx}
                      className={cn(
                        "flex items-center gap-5 p-5 rounded-2xl border-2 transition-all cursor-pointer group hover:shadow-md",
                        answers[currentQuestion.id] === option.value 
                          ? "border-primary-500 bg-primary-50 shadow-sm shadow-primary-100/50" 
                          : "border-slate-100 bg-white hover:border-primary-200"
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
                        "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                        answers[currentQuestion.id] === option.value 
                          ? "border-primary-500 bg-primary-500 text-white" 
                          : "border-slate-300 group-hover:border-primary-400 bg-slate-50"
                      )}>
                        {answers[currentQuestion.id] === option.value && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-base font-bold text-slate-700 leading-snug">{option.text}</span>
                    </label>
                  ))}
                </div>

                {/* BOTTOM: Prev / Next / Submit */}
                <div className="mt-10 flex gap-4 border-t border-slate-100 pt-8 flex-wrap sm:flex-nowrap">
                  <button 
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(v => v - 1)}
                    className="flex-1 px-6 py-4 rounded-xl border-2 border-slate-200 text-slate-600 font-black hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-3 transition-colors uppercase tracking-widest text-xs"
                  >
                    <ChevronLeft className="w-5 h-5" /> Oldingisi
                  </button>
                  
                  {currentQuestionIndex < totalQuestions - 1 ? (
                    <button 
                      onClick={() => setCurrentQuestionIndex(v => v + 1)}
                      className="flex-1 px-6 py-4 rounded-xl bg-slate-800 text-white font-black hover:bg-slate-900 flex items-center justify-center gap-3 transition-colors shadow-lg shadow-slate-800/20 uppercase tracking-widest text-xs"
                    >
                      Keyingisi <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => setShowSubmitConfirm(true)}
                      className="flex-1 px-6 py-4 rounded-xl bg-green-500 text-white font-black hover:bg-green-600 flex items-center justify-center gap-3 transition-colors shadow-lg shadow-green-500/30 uppercase tracking-widest text-xs"
                    >
                      Tugatish <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Footer */}
              <div className="flex items-center justify-between text-slate-400">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-green-500" /> Auto-save faol
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest"> Scholar Flow Security System v2.0 </p>
              </div>
            </div>

        </main>
      </div>
    </div>
  );
};

export default ExamSession;
