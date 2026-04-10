import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import ExamTimer from '../components/ExamTimer';
import SidebarNavigator from '../components/SidebarNavigator';
import AntiCheatModal from '../components/AntiCheatModal';
import TimeUpModal from '../components/TimeUpModal';
import SubmitConfirmModal from '../components/SubmitConfirmModal';
import AlreadySubmittedModal from '../components/AlreadySubmittedModal';
import AnswerInput from '../components/AnswerInput';
import FlagButton from '../components/FlagButton';
import { displayQuestionTextUz } from '../lib/questionText';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

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
    attemptId,
    finishReason,
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
  const [isBlurred, setIsBlurred] = useState(false);
  const isInitialMount = useRef(true);
  const prevViolations = useRef(violations);

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Check if already submitted (ONLY on mount to avoid flicker after finish)
  useEffect(() => {
    if (isInitialMount.current && isExamFinished) {
      setShowAlreadySubmitted(true);
    }
    isInitialMount.current = false;
  }, [isExamFinished]);

  // Anti-cheat: Tab switch/blur detection (merged for reliability)
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isExamStarted && !isExamFinished) {
        e.preventDefault();
        e.returnValue = ''; // Required for some browsers
      }
    };
    
    const handleLocalBlur = () => {
      if (isExamStarted && !isExamFinished) {
        setIsBlurred(true);
        incrementViolations();
      }
    };
    const handleLocalFocus = () => setIsBlurred(false);

    document.addEventListener('copy', prevent);
    document.addEventListener('paste', prevent);
    document.addEventListener('contextmenu', prevent);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('blur', handleLocalBlur);
    window.addEventListener('focus', handleLocalFocus);

    return () => {
      document.removeEventListener('copy', prevent);
      document.removeEventListener('paste', prevent);
      document.removeEventListener('contextmenu', prevent);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', handleLocalBlur);
      window.removeEventListener('focus', handleLocalFocus);
    };
  }, [isExamStarted, isExamFinished, incrementViolations]);

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
        navigate(
          attemptId ? `/exams/${examId}/result?attempt=${encodeURIComponent(attemptId)}` : `/exams/${examId}/result`,
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isExamFinished, examId, attemptId, navigate]);

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

  if (isExamFinished && finishReason === 'cheating') {
    return (
      <div className="exam-platform-session min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg)] p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-black text-[var(--text-h)] max-w-md">Imtihondan chetlashtirildingiz</h2>
        <p className="text-sm text-[var(--text)] max-w-lg leading-relaxed">
          3 marta ogohlantirishdan keyin boshqa tab yoki ekrandan chiqish qoidalarga zid deb topildi. Javoblaringiz yuborildi; AI baholash va natija keyingi sahifada.
        </p>
        <p className="text-xs text-[var(--text)] opacity-70">Siz natija sahifasiga yo‘naltirilmoqdasiz…</p>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="exam-platform-session min-h-screen flex flex-col items-center justify-center space-y-4 bg-[var(--bg)]">
        <Loader2 className="w-10 h-10 text-[var(--accent)] animate-spin" />
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
    <div className="exam-platform-session flex bg-[var(--bg)] min-h-screen no-select overflow-hidden">
      <SidebarNavigator />

      <div className="flex-1 flex flex-col min-h-0 h-[100dvh] relative">
        {isBlurred && (
           <div className="on-screen-mask">
              <p className="animate-pulse">DIQQAT: EKRAN BLOKLANDI.<br/>DAVOM ETISH UCHUN TIZIMGA QAYTING.</p>
           </div>
        )}

        <header className="h-16 bg-[var(--bg-card)] border-b border-[var(--border)] px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent-bg)] rounded-xl flex items-center justify-center border border-[var(--accent-border)]">
              <Info className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[var(--text)] uppercase tracking-widest opacity-80">Savol</p>
              <p className="text-sm font-black text-[var(--text-h)] leading-none">
                {currentQuestionIndex + 1} / {questions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <ExamTimer />
            <button 
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              className="cursor-pointer px-6 py-2.5 bg-[var(--accent)] hover:brightness-110 text-white rounded-xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[var(--accent)]/25"
            >
              Topshirish
            </button>
          </div>
        </header>

        <div className="h-1 bg-[var(--divide)] w-full shrink-0">
          <div className="h-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className={`flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10 transition-all duration-500 ${isBlurred ? 'cheat-blur' : ''}`}>
          <div className="w-full max-w-[min(96rem,calc(100vw-3rem))] mx-auto space-y-8 animate-in slide-in-from-right-5 duration-300 px-1">
            <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border)] shadow-[var(--shadow)] p-8 lg:p-12 relative">
              <div className="absolute -top-3 left-8 px-4 py-1.5 bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-md shadow-[var(--accent)]/30">
                Savol #{currentQuestionIndex + 1}
              </div>
              <div className="flex justify-between items-start mb-8">
                 <h2 className="text-xl lg:text-2xl font-bold text-[var(--text-h)] leading-tight flex-1 pr-4">
                    {displayQuestionTextUz(currentQuestion.text)}
                 </h2>
                 <FlagButton 
                    isFlagged={isFlagged} 
                    onToggle={() => toggleFlag(currentQuestion.id)} 
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
            <div className="flex items-center gap-4 px-6 py-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-xs font-semibold text-[var(--text-h)] opacity-90 leading-relaxed">
                Javoblar avtomatik saqlanadi. Boshqa tabga o‘tish 3 marta ogohlantirish bilan cheklanadi; 3-chisidan keyin imtihon yopiladi. Topshirilgach AI javoblarni tekshiradi, ball va sharh natija/review bo‘limida.
              </p>
            </div>
          </div>
        </div>

        <footer className="h-20 bg-[var(--bg-card)] border-t border-[var(--border)] px-6 flex items-center justify-between shrink-0 z-20">
          <button 
            type="button"
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className="cursor-pointer flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[var(--text)] hover:text-[var(--text-h)] hover:bg-[var(--hover-bg)] disabled:opacity-0 disabled:pointer-events-none transition-all font-mono"
          >
            <ChevronLeft className="w-5 h-5" /> ORQAGA
          </button>
          <div className="flex items-center gap-2">
            {questions.map((_, idx) => (
              <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentQuestionIndex ? 'w-6 bg-[var(--accent)]' : 'bg-[var(--divide)]'}`} />
            ))}
          </div>
          <button 
            type="button"
            onClick={nextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
            className="cursor-pointer flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[var(--accent)] hover:bg-[var(--accent-bg)] disabled:opacity-0 disabled:pointer-events-none transition-all font-mono"
          >
            KEYINGISI <ChevronRight className="w-5 h-5" />
          </button>
        </footer>
      </div>

      <AnimatePresence>
        {showAntiCheat && <AntiCheatModal isOpen={showAntiCheat} violations={violations} onClose={() => setShowAntiCheat(false)} />}
        {showTimeUp && <TimeUpModal isOpen={showTimeUp} onAutoSubmit={handleAutoSubmit} />}
        {showSubmitConfirm && (
          <SubmitConfirmModal 
            isOpen={showSubmitConfirm} 
            answeredCount={answeredCount}
            totalCount={questions.length}
            onConfirm={handleSubmit} 
            onCancel={() => setShowSubmitConfirm(false)} 
          />
        )}
        {showAlreadySubmitted && (
          <AlreadySubmittedModal
            isOpen={showAlreadySubmitted}
            onGoHome={() =>
              navigate(
                attemptId
                  ? `/exams/${examId}/result?attempt=${encodeURIComponent(attemptId)}`
                  : `/exams/${examId}/result`,
              )
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExamPage;
