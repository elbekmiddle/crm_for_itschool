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
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';

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

  // Disable copy/paste/context menu
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener('copy', prevent);
    document.addEventListener('paste', prevent);
    document.addEventListener('contextmenu', prevent);
    return () => {
      document.removeEventListener('copy', prevent);
      document.removeEventListener('paste', prevent);
      document.removeEventListener('contextmenu', prevent);
    };
  }, []);

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
    <div className="flex bg-white min-h-screen no-select">
      <SidebarNavigator />

      <div className="flex-1 flex flex-col min-h-screen">
        <ExamTimer />

        {/* Progress bar */}
        <div className="h-1 bg-slate-100 w-full">
          <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full">
          <div className="space-y-8">
            {/* Question header + flag button */}
            <div className="flex items-start justify-between gap-4">
              <QuestionCard
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                text={currentQuestion.text}
                isFlagged={isFlagged}
              >
                <AnswerInput
                  questionId={currentQuestion.id}
                  type={currentQuestion.type}
                  options={currentQuestion.options}
                  currentAnswer={answers[currentQuestion.id]}
                  onAnswer={setAnswer}
                />
              </QuestionCard>

              <FlagButton
                isFlagged={isFlagged}
                onToggle={() => toggleFlag(currentQuestion.id)}
              />
            </div>

            {/* Navigation footer */}
            <footer className="flex items-center justify-between pt-8 border-t border-slate-100">
              <button
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 font-bold text-slate-500 disabled:opacity-30 hover:text-primary-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" /> Oldingisi
              </button>

              <div className="flex gap-3">
                {currentQuestionIndex === questions.length - 1 ? (
                  <button onClick={() => setShowSubmitConfirm(true)} className="btn-primary flex items-center gap-2">
                    Yakunlash <CheckCircle2 className="w-5 h-5" />
                  </button>
                ) : (
                  <button onClick={nextQuestion} className="btn-primary flex items-center gap-2">
                    Keyingisi <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* Modals */}
      <AntiCheatModal isOpen={showAntiCheat} violations={violations} onClose={() => setShowAntiCheat(false)} />
      <TimeUpModal isOpen={showTimeUp} onAutoSubmit={handleAutoSubmit} />
      <SubmitConfirmModal
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={handleSubmit}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
      />
      <AlreadySubmittedModal
        isOpen={showAlreadySubmitted}
        onGoHome={() => navigate('/dashboard')}
      />
    </div>
  );
};

export default ExamPage;
