import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import ExamTimer from '../components/ExamTimer';
import SidebarNavigator from '../components/SidebarNavigator';
import AntiCheatModal from '../components/AntiCheatModal';
import TimeUpModal from '../components/TimeUpModal';
import SubmitConfirmModal from '../components/SubmitConfirmModal';
import AlreadySubmittedModal from '../components/AlreadySubmittedModal';
import QuestionCard from '../components/QuestionCard';
import AnswerInput from '../components/AnswerInput';
import FlagButton from '../components/FlagButton';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2, Flag, AlertTriangle, Timer, Info } from 'lucide-react';

const ExamPage: React.FC = () => {
  const {
    questions,
    currentQuestionIndex,
    answers,
    flagged,
    violations,
    isExamStarted,
    isExamFinished,
    timeLeft,
    examId,
    setAnswer,
    nextQuestion,
    prevQuestion,
    toggleFlag,
    incrementViolations,
    finishExam,
    restoreSession,
  } = useExamStore();

  const navigate = useNavigate();
  const [showAntiCheat, setShowAntiCheat] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showAlreadySubmitted, setShowAlreadySubmitted] = useState(false);
  const prevViolations = useRef(violations);

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Check if already submitted
  useEffect(() => {
    if (isExamFinished && !isExamStarted) {
      setShowAlreadySubmitted(true);
    }
  }, [isExamFinished, isExamStarted]);

  // Anti-cheat: Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !isExamFinished) {
        incrementViolations();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [incrementViolations, isExamFinished]);

  // Show anti-cheat modal on new violation
  useEffect(() => {
    if (violations > prevViolations.current && violations < 3) {
      setShowAntiCheat(true);
    }
    prevViolations.current = violations;
  }, [violations]);

  // Time up detection
  useEffect(() => {
    if (timeLeft <= 0 && isExamStarted && !isExamFinished) {
      setShowTimeUp(true);
    }
  }, [timeLeft, isExamStarted, isExamFinished]);

  // Navigate away after finish
  useEffect(() => {
    if (isExamFinished && examId) {
      const timer = setTimeout(() => {
        navigate(`/exams/${examId}/result`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isExamFinished, examId, navigate]);

  // Disable copy/paste/context menu & Exit warning
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isExamStarted && !isExamFinished) {
        e.preventDefault();
        e.returnValue = ''; // Required for some browsers
      }
    };
    const handleBlur = () => {
      if (isExamStarted && !isExamFinished) {
        incrementViolations();
      }
    };

    document.addEventListener('copy', prevent);
    document.addEventListener('paste', prevent);
    document.addEventListener('contextmenu', prevent);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('copy', prevent);
      document.removeEventListener('paste', prevent);
      document.removeEventListener('contextmenu', prevent);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isExamStarted, isExamFinished, incrementViolations]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextQuestion(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prevQuestion(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nextQuestion, prevQuestion]);

  const handleAutoSubmit = useCallback(() => {
    finishExam();
    setShowTimeUp(false);
  }, [finishExam]);

  const handleSubmit = useCallback(() => {
    finishExam();
    setShowSubmitConfirm(false);
  }, [finishExam]);

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="label-subtle">Savollar yuklanmoqda...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isFlagged = flagged.has(currentQuestion.id);
  const answeredCount = Object.keys(answers).filter((k) =>
    questions.some((q) => q.id === k)
  ).length;

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen no-select overflow-hidden">
      <SidebarNavigator />

      <div className="flex-1 flex flex-col h-screen relative">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center">
              <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Savol</p>
              <p className="text-sm font-black text-slate-800 dark:text-white leading-none">
                {currentQuestionIndex + 1} / {questions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <ExamTimer />
            <button 
              onClick={() => setShowSubmitConfirm(true)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20"
            >
              Topshirish
            </button>
          </div>
        </header>

        <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full shrink-0">
          <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10">
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-5 duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-8 lg:p-12 relative">
              <div className="absolute -top-3 left-8 px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">
                Savol #{currentQuestionIndex + 1}
              </div>
              <div className="flex justify-between items-start mb-8">
                 <h2 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white leading-tight">
                    {currentQuestion.text}
                 </h2>
                 <FlagButton 
                    active={isFlagged} 
                    onClick={() => toggleFlag(currentQuestion.id)} 
                 />
              </div>
              <div className="space-y-4">
                <AnswerInput 
                  question={currentQuestion} 
                  value={answers[currentQuestion.id]} 
                  onChange={(val) => setAnswer(currentQuestion.id, val)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-4 bg-amber-50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/10 rounded-2xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 opacity-80">
                Diqqat: Har bir tanlangan javob avtomatik saqlab boriladi. Internet uzilsa ham holatingiz saqlanib qoladi.
              </p>
            </div>
          </div>
        </div>

        <footer className="h-20 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 z-20">
          <button 
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-0 transition-all font-mono"
          >
            <ChevronLeft className="w-5 h-5" /> ORQAGA
          </button>
          <div className="flex items-center gap-2">
            {questions.map((_, idx) => (
              <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentQuestionIndex ? 'w-6 bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
            ))}
          </div>
          <button 
            onClick={nextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 disabled:opacity-0 transition-all font-mono"
          >
            KEYINGISI <ChevronRight className="w-5 h-5" />
          </button>
        </footer>
      </div>

      <AnimatePresence>
        {showAntiCheat && <AntiCheatModal isOpen={showAntiCheat} violations={violations} onClose={() => setShowAntiCheat(false)} />}
        {showTimeUp && <TimeUpModal isOpen={showTimeUp} onConfirm={handleAutoSubmit} />}
        {showSubmitConfirm && (
          <SubmitConfirmModal 
            isOpen={showSubmitConfirm} 
            answeredCount={answeredCount}
            totalCount={questions.length}
            onConfirm={handleSubmit} 
            onCancel={() => setShowSubmitConfirm(false)} 
          />
        )}
        {showAlreadySubmitted && <AlreadySubmittedModal isOpen={showAlreadySubmitted} onClose={() => navigate(`/exams/${examId}/result`)} />}
      </AnimatePresence>
    </div>
  );
};

export default ExamPage;
