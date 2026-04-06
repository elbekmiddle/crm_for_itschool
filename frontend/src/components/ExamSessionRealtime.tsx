import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { Clock, AlertCircle, Send, Loader2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

interface Question {
  id: string;
  type: 'select' | 'text' | 'code';
  text: string;
  options?: string[];
  code_template?: string;
}

interface ExamSessionProps {
  examId: string;
  attemptId: string;
  questions: Question[];
  duration: number; // minutes
  onSubmit: (answers: Record<string, any>) => Promise<void>;
}

const ExamSession: React.FC<ExamSessionProps> = ({
  examId,
  attemptId,
  questions,
  duration,
  onSubmit,
}) => {
  const { joinExamRoom, leaveExamRoom, on, off, emit, isConnected } = useSocket();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(duration * 60); // seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);

  // Anti-cheat monitoring
  const { violations, isTabActive, violationCount } = useAntiCheat({
    enableTabMonitoring: true,
    enableScreenShare: true,
    enableCopyPaste: true,
    enableRightClick: true,
    maxViolations: 3,
    onViolation: (violation) => {
      // Send violation to server
      emit('violation_detected', {
        attemptId,
        type: violation.type,
        severity: violation.severity,
        timestamp: new Date(),
      });
    },
    onMaxViolationsReached: () => {
      toast.error('Imtihon avtomatik tugatildi - Natiqalaylik qaytdi!');
      handleSubmit();
    },
  });

  // Socket.IO setup
  useEffect(() => {
    if (!isConnected) return;

    joinExamRoom(examId, 'student-id', 'student');

    // Listen for exam events
    on('user_joined', (data) => {
      console.log('User joined:', data);
    });

    on('time_warning', (data) => {
      if (data.attemptId === attemptId && data.timeLeftMs < 300000) {
        // Less than 5 minutes
        setShowTimeWarning(true);
        toast.error('⏰ 5 daqiqa vaqti qoldi!');
      }
    });

    on('exam_ended', (data) => {
      if (data.examId === examId) {
        toast.error('Imtihon vaqti tugadi!');
      }
    });

    return () => {
      leaveExamRoom(examId, 'student-id');
      off('user_joined');
      off('time_warning');
      off('exam_ended');
    };
  }, [isConnected, examId, attemptId, joinExamRoom, leaveExamRoom, on, off]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }

        // Emit time warning if less than 5 minutes
        if (prev === 300) {
          emit('time_warning', {
            attemptId,
            timeLeftMs: prev * 1000,
          });
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attemptId, emit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerChange = useCallback(
    (answer: any) => {
      const newAnswers = { ...answers, [currentQuestion.id]: answer };
      setAnswers(newAnswers);

      // Auto-save answer via Socket.IO
      emit('answer_saved', {
        attemptId,
        questionId: currentQuestion.id,
        answer,
        timestamp: new Date(),
      });

      // Also save via API
      // await api.post(`/exams/attempts/${attemptId}/answers`, { questionId: currentQuestion.id, answer });
    },
    [answers, currentQuestion, attemptId, emit],
  );

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(answers);
      emit('exam_submitted', {
        examId,
        attemptId,
        answers,
        timestamp: new Date(),
      });
      toast.success('Imtihon yuborildi!');
    } catch (error: any) {
      toast.error(error.message || 'Xato yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 rounded-2xl mb-6 p-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Imtihon Sessiyasi</h1>
            <p className="text-xs text-slate-400 font-bold mt-1">
              Savol {currentQuestionIndex + 1} / {questions.length}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Anti-Cheat Status */}
            {violationCount > 0 && (
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold ${
                  violationCount >= 2
                    ? 'bg-red-50 text-red-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
                <span className="text-sm">
                  {violationCount}/3 Natiqalaylik
                </span>
              </div>
            )}

            {/* Tab Active Status */}
            {!isTabActive && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold animate-pulse">
                <AlertCircle className="w-5 h-5" />
                Tab o'zgartirildi!
              </div>
            )}

            <div className="flex items-center gap-6">
              {/* Time */}
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold ${
                  timeLeft < 300
                    ? 'bg-red-50 text-red-600'
                    : 'bg-primary-50 text-primary-600'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
              </div>

              {/* Active Users */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                {activeUsers} faol
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {showTimeWarning && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-700">Vaqt tugayotgan!</p>
              <p className="text-sm text-red-600">Juda tez imtihonni yakunlashingiz kerak.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-8 sticky top-32">
              <h2 className="text-xl font-black text-slate-800 mb-6 leading-relaxed">
                {currentQuestion?.text}
              </h2>

              {currentQuestion?.type === 'select' && (
                <div className="space-y-3">
                  {(currentQuestion?.options || []).map((opt, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition"
                    >
                      <input
                        type="radio"
                        name={`q-${currentQuestion.id}`}
                        value={opt}
                        checked={answers[currentQuestion.id] === opt}
                        onChange={() => handleAnswerChange(opt)}
                        className="w-5 h-5 text-primary-600 cursor-pointer"
                      />
                      <span className="font-medium text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion?.type === 'text' && (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Javobingizni shu joyga yozing..."
                  className="input w-full min-h-32"
                />
              )}

              {currentQuestion?.type === 'code' && (
                <div className="space-y-4">
                  <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                    <pre className="text-xs font-mono text-slate-300">
                      {currentQuestion?.code_template}
                    </pre>
                  </div>
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="// Kodingizni shu joyga yozing"
                    className="input w-full min-h-40 font-mono text-xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Question Navigator */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase">
                Savollar ({answers ? Object.keys(answers).length : 0}/{questions.length})
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(i)}
                    className={`w-full aspect-square rounded-lg font-bold text-xs transition-all ${
                      i === currentQuestionIndex
                        ? 'bg-primary-600 text-white shadow-lg'
                        : answers[q.id]
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <button
                onClick={() =>
                  setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
                }
                disabled={currentQuestionIndex === 0}
                className="btn-secondary w-full py-2.5 disabled:opacity-50 text-sm"
              >
                ← Orqaga
              </button>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={() =>
                    setCurrentQuestionIndex(
                      Math.min(questions.length - 1, currentQuestionIndex + 1),
                    )
                  }
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  Keyingi →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Yuborilmoqda...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      IMTIHONNI YUBORISH
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Info */}
            <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
              <p>
                <span className="font-bold">💡</span> Barcha javoblar avtomatik saqlanadi
              </p>
              <p>
                <span className="font-bold">⚠️</span> Vaqt tugagandan so'ng yangi javoblar
                saqlanmaydi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamSession;
