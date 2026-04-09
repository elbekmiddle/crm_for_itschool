import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Sparkles, Loader2, ChevronRight, ChevronLeft,
  Radio, FileText, Code2, Trash2, Edit2, Eye, Check, Zap
} from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import toast from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';

export type QuestionType = 'select' | 'text' | 'code';

export interface Question {
  id?: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correct_answer?: string | string[];
  code_template?: string;
  test_cases?: { input: string; output: string }[];
  points?: number;
  generated?: boolean;
}

interface AIExamBuilderProps {
  examId: string;
  examTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onQuestionsAdded: (questions: Question[]) => void;
  onAiGenerate?: (params: any) => Promise<any>;
}

const AIExamBuilder: React.FC<AIExamBuilderProps> = ({
  examId,
  examTitle,
  isOpen,
  onClose,
  onQuestionsAdded,
  onAiGenerate,
}) => {
  const confirm = useConfirm();
  const { joinExamRoom, leaveExamRoom, on, off, isConnected } = useSocket();
  const [step, setStep] = useState<'config' | 'ai-generate' | 'review' | 'edit'>('config');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [aiConfig, setAiConfig] = useState({
    topic: examTitle,
    level: 'medium' as 'easy' | 'medium' | 'hard',
    count: 5,
    selectCount: 3,
    textCount: 1,
    codeCount: 1,
  });

  const [manualQuestion, setManualQuestion] = useState<Question>({
    type: 'select',
    text: '',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 10,
  });

  // Socket.IO setup
  useEffect(() => {
    if (!isOpen || !isConnected) return;

    // Join exam room
    joinExamRoom(examId, 'teacher-id', 'teacher');

    // Listen for AI generation events
    on('ai_generation_started', (data) => {
      console.log('AI generation started:', data);
      setIsGenerating(true);
      setGenerationProgress(0);
      toast.success('AI savol yaratishni boshladi...');
    });

    on('question_generated', (data) => {
      console.log('Question generated:', data);
      setQuestions((prev) => [...prev, data.question]);
      setGenerationProgress(data.progress);
    });

    on('ai_generation_completed', (data) => {
      console.log('AI generation completed:', data);
      setQuestions(data.questions);
      setIsGenerating(false);
      setGenerationProgress(100);
      setStep('review');
      toast.success(`${data.questions.length} ta savol yaratildi!`);
    });

    return () => {
      leaveExamRoom(examId, 'teacher-id');
      off('ai_generation_started');
      off('question_generated');
      off('ai_generation_completed');
    };
  }, [isOpen, isConnected, examId, joinExamRoom, leaveExamRoom, on, off]);

  // Close handler with validation
  const handleClose = async () => {
    if (questions.length > 0 || manualQuestion.text) {
      const ok = await confirm({
        title: 'Tasdiqni bekor qilish?',
        message: 'Siz masalalarni qo\'shmadingiz. Haqiqatan ham chiqmoqchimisiz?',
        confirmText: 'HA, CHIQ',
        type: 'warning',
      });
      if (!ok) return;
    }
    setQuestions([]);
    setManualQuestion({ type: 'select', text: '', options: ['', '', '', ''], correct_answer: '', points: 10 });
    setStep('config');
    onClose();
  };

  // AI Generate Questions
  const handleAiGenerate = async () => {
    if (!aiConfig.topic.trim()) {
      toast.error('Mavzuni kiriting!');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setStep('ai-generate');

    try {
      const params = {
        topic: aiConfig.topic,
        level: aiConfig.level,
        count: aiConfig.count,
        selectCount: aiConfig.selectCount,
        textCount: aiConfig.textCount,
        codeCount: aiConfig.codeCount,
      };

      if (onAiGenerate) {
        const result = await onAiGenerate(params);
        if (result?.questions) {
          setQuestions(result.questions);
          setGenerationProgress(100);
          setTimeout(() => setStep('review'), 500);
        }
      } else {
        // Mock AI response with progress simulation
        const mockQuestions = generateMockQuestions(params);
        for (let i = 0; i < mockQuestions.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          setQuestions((prev) => [...prev, mockQuestions[i]]);
          setGenerationProgress(((i + 1) / mockQuestions.length) * 100);
        }
        setTimeout(() => setStep('review'), 500);
      }
    } catch (error: any) {
      toast.error(error.message || 'AI savol yaratishda xato');
      setStep('config');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add manual question
  const handleAddQuestion = () => {
    if (!manualQuestion.text.trim()) {
      toast.error('Savol matnini kiriting!');
      return;
    }

    if (manualQuestion.type === 'select') {
      const filledOptions = manualQuestion.options?.filter(o => o.trim()) || [];
      if (filledOptions.length < 2) {
        toast.error('Kamida 2 ta variant kiriting!');
        return;
      }
      if (!manualQuestion.correct_answer) {
        toast.error('To\'g\'ri javobni tanlang!');
        return;
      }
    }

    setQuestions([...questions, { ...manualQuestion, id: `q-${Date.now()}` }]);
    setManualQuestion({ type: 'select', text: '', options: ['', '', '', ''], correct_answer: '', points: 10 });
    toast.success('Savol qo\'shildi');
  };

  // Save all questions
  const handleSaveQuestions = async () => {
    if (questions.length === 0) {
      toast.error('Kamida 1 ta savol qo\'shing!');
      return;
    }

    const ok = await confirm({
      title: 'Savollarni imtihonga qo\'shish?',
      message: `Siz ${questions.length} ta savolni imtihonga qo'shmoqchisiz. Keyinroq ularni tahrirlashingiz mumkin.`,
      confirmText: 'QO\'SHISH',
      type: 'info',
    });

    if (ok) {
      onQuestionsAdded(questions);
      setQuestions([]);
      setStep('config');
      onClose();
      toast.success('Savollar imtihonga qo\'shildi!');
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40"
          />

          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto pointer-events-auto relative"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">AI Savol Yaratuvchi</h2>
                  <p className="text-xs text-slate-400 font-bold mt-1">{examTitle}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-8">
                {/* STEP 0: AI Generation Progress */}
                {step === 'ai-generate' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center space-y-6 py-12"
                  >
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#E5EFD1"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#84BD38"
                          strokeWidth="8"
                          strokeDasharray={`${2 * Math.PI * 45}`}
                          strokeDashoffset={`${2 * Math.PI * 45 * (1 - generationProgress / 100)}`}
                          className="transition-all duration-300"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-black text-primary-600">
                          {Math.round(generationProgress)}%
                        </span>
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-black text-slate-800">
                        AI Savollarni Yaratmoqda...
                      </h3>
                      <p className="text-sm text-slate-500">
                        {Math.round(generationProgress / 20) <= questions.length
                          ? `${questions.length} ta savol yaratildi`
                          : 'Oxirgi savollar yaratilmoqda...'}
                      </p>
                    </div>

                    <div className="space-y-2 w-full">
                      {questions.slice(0, 3).map((q, i) => (
                        <motion.div
                          key={q.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl"
                        >
                          <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-700 truncate">
                            {q.text.substring(0, 50)}...
                          </span>
                        </motion.div>
                      ))}
                      {questions.length > 3 && (
                        <p className="text-xs text-slate-400 text-center">
                          +{questions.length - 3} ko'proq savol...
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 1: Config */}
                {step === 'config' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-primary-50 border border-primary-200 rounded-2xl p-6 space-y-4">
                      <h3 className="font-bold text-slate-800">AI bilan Savol Yaratish</h3>
                      
                      <div>
                        <label className="input-label">Mavzu yoki Kontekst</label>
                        <input
                          value={aiConfig.topic}
                          onChange={(e) => setAiConfig({ ...aiConfig, topic: e.target.value })}
                          placeholder="Masalan: JavaScript async/await..."
                          className="input"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="input-label">Qiyinlik Darajasi</label>
                          <select
                            value={aiConfig.level}
                            onChange={(e) => setAiConfig({ ...aiConfig, level: e.target.value as any })}
                            className="select font-bold"
                          >
                            <option value="easy">Oson</option>
                            <option value="medium">O'rtacha</option>
                            <option value="hard">Qiyin</option>
                          </select>
                        </div>
                        <div>
                          <label className="input-label">Jami Savollar</label>
                          <input
                            type="number"
                            value={aiConfig.count}
                            onChange={(e) => setAiConfig({ ...aiConfig, count: Math.max(1, parseInt(e.target.value) || 1) })}
                            min={1}
                            max={20}
                            className="input"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="input-label">Select Savollari</label>
                          <input
                            type="number"
                            value={aiConfig.selectCount}
                            onChange={(e) => setAiConfig({ ...aiConfig, selectCount: Math.max(0, parseInt(e.target.value) || 0) })}
                            min={0}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="input-label">Matn Savollari</label>
                          <input
                            type="number"
                            value={aiConfig.textCount}
                            onChange={(e) => setAiConfig({ ...aiConfig, textCount: Math.max(0, parseInt(e.target.value) || 0) })}
                            min={0}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="input-label">Kod Savollari</label>
                          <input
                            type="number"
                            value={aiConfig.codeCount}
                            onChange={(e) => setAiConfig({ ...aiConfig, codeCount: Math.max(0, parseInt(e.target.value) || 0) })}
                            min={0}
                            className="input"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleAiGenerate}
                        disabled={isGenerating}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Savollar yaratilmoqda...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            AI BILAN GENERATE QILISH
                          </>
                        )}
                      </button>
                    </div>

                    {/* Manual question input */}
                    <div className="border-t border-slate-200 pt-6">
                      <h3 className="font-bold text-slate-800 mb-4">Qo'l Bilan Savol Qo'shish</h3>
                      <ManualQuestionEditor
                        question={manualQuestion}
                        onChange={setManualQuestion}
                        onAdd={handleAddQuestion}
                      />
                    </div>

                    {/* Added questions preview */}
                    {questions.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                        <p className="font-bold text-green-700 mb-4">
                          ✓ {questions.length} ta savol qo'shildi
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {questions.map((q, i) => (
                            <div key={q.id} className="flex items-center gap-3 text-sm">
                              <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {i + 1}
                              </span>
                              <span className="flex-1 text-slate-700 font-medium">{q.text.substring(0, 50)}...</span>
                              <span className="text-xs px-2 py-1 bg-white rounded font-mono">
                                {q.type === 'select' ? 'SELECT' : q.type === 'text' ? 'TEXT' : 'CODE'}
                              </span>
                              <button
                                onClick={() => {
                                  setQuestions(questions.filter((_, idx) => idx !== questions.indexOf(q)));
                                  toast.success('Savol o\'chirildi');
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={handleSaveQuestions}
                          className="btn-primary w-full mt-4 py-3"
                        >
                          SAVOLLARNI QO'SHISH
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 2: Review AI-Generated Questions */}
                {step === 'review' && currentQuestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800">
                        Savol {currentQuestionIndex + 1} / {questions.length}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setQuestions(questions.filter((_, i) => i !== currentQuestionIndex))
                          }
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStep('edit')}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <QuestionPreview question={currentQuestion} />

                    <div className="flex gap-3 justify-between">
                      <button
                        onClick={() =>
                          setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
                        }
                        disabled={currentQuestionIndex === 0}
                        type="button"
                        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Orqaga
                      </button>

                      {currentQuestionIndex === questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={handleSaveQuestions}
                          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold text-sm rounded-xl transition enabled:hover:bg-primary-700"
                        >
                          <Check className="w-4 h-4" />
                          TASDIQLA VA QO'SHISH
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))
                          }
                          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary-100 text-primary-700 font-bold text-sm transition enabled:hover:bg-primary-200"
                        >
                          Keyingi
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Edit Question */}
                {step === 'edit' && currentQuestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <QuestionEditor
                      question={currentQuestion}
                      onSave={(updated) => {
                        const newQuestions = [...questions];
                        newQuestions[currentQuestionIndex] = updated;
                        setQuestions(newQuestions);
                        setStep('review');
                        toast.success('Savol yangilandi');
                      }}
                      onCancel={() => setStep('review')}
                    />
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

/* --- Sub Components --- */

interface ManualQuestionEditorProps {
  question: Question;
  onChange: (q: Question) => void;
  onAdd: () => void;
}

const ManualQuestionEditor: React.FC<ManualQuestionEditorProps> = ({
  question,
  onChange,
  onAdd,
}) => {
  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
      <div>
        <label className="input-label">Savol Turi</label>
        <select
          value={question.type}
          onChange={(e) => {
            const newType = e.target.value as QuestionType;
            onChange({ ...question, type: newType });
          }}
          className="select font-bold"
        >
          <option value="select">Select (Ko'p variantli)</option>
          <option value="text">Text (Matn Javob)</option>
          <option value="code">Code (Kod Yozish)</option>
        </select>
      </div>

      <div>
        <label className="input-label">Savol Matni</label>
        <textarea
          value={question.text}
          onChange={(e) => onChange({ ...question, text: e.target.value })}
          placeholder="Savol matnini kiriting..."
          className="input min-h-20"
        />
      </div>

      {question.type === 'select' && (
        <>
          <div>
            <label className="input-label">Variantlar</label>
            <div className="space-y-2">
              {(question.options || []).map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={question.correct_answer === opt}
                    onChange={() => onChange({ ...question, correct_answer: opt })}
                    className="w-4 h-4 mt-3 cursor-pointer"
                  />
                  <input
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...(question.options || [])];
                      newOpts[i] = e.target.value;
                      onChange({ ...question, options: newOpts });
                    }}
                    placeholder={`Variant ${i + 1}`}
                    className="input"
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {question.type === 'text' && (
        <div>
          <label className="input-label">To'g'ri Javob (Kalit So'z)</label>
          <input
            value={question.correct_answer as string}
            onChange={(e) => onChange({ ...question, correct_answer: e.target.value })}
            placeholder="To'g'ri javobni kiriting..."
            className="input"
          />
        </div>
      )}

      {question.type === 'code' && (
        <div>
          <label className="input-label">Kod Shabloni</label>
          <textarea
            value={question.code_template || ''}
            onChange={(e) => onChange({ ...question, code_template: e.target.value })}
            placeholder="function solution() {\n  // Kodingizni yozing\n}"
            className="input font-mono min-h-24 text-xs"
          />
        </div>
      )}

      <button
        onClick={onAdd}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3"
      >
        <Plus className="w-4 h-4" />
        SAVOL QO'SHISH
      </button>
    </div>
  );
};

interface QuestionPreviewProps {
  question: Question;
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({ question }) => {
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
          {question.type === 'select' && <Radio className="w-5 h-5 text-primary-600" />}
          {question.type === 'text' && <FileText className="w-5 h-5 text-primary-600" />}
          {question.type === 'code' && <Code2 className="w-5 h-5 text-primary-600" />}
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-800 leading-relaxed">{question.text}</p>
        </div>
      </div>

      {question.type === 'select' && question.options && (
        <div className="space-y-2 pt-4 border-t border-slate-200">
          {question.options.map((opt, i) => (
            <label key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer">
              <input
                type="radio"
                checked={question.correct_answer === opt}
                readOnly
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-slate-700">{opt}</span>
              {question.correct_answer === opt && (
                <span className="ml-auto text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-bold">
                  ✓ To'g'ri
                </span>
              )}
            </label>
          ))}
        </div>
      )}

      {question.type === 'text' && (
        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 font-bold mb-2">TO'G'RI JAVOB:</p>
          <p className="text-sm font-mono text-slate-700 bg-white p-2 rounded-lg">
            {question.correct_answer}
          </p>
        </div>
      )}

      {question.type === 'code' && (
        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 font-bold mb-2">KOD SHABLONI:</p>
          <pre className="text-xs font-mono text-slate-700 bg-white p-3 rounded-lg overflow-x-auto">
            {question.code_template}
          </pre>
        </div>
      )}
    </div>
  );
};

interface QuestionEditorProps {
  question: Question;
  onSave: (q: Question) => void;
  onCancel: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, onSave, onCancel }) => {
  const [edited, setEdited] = useState<Question>(question);

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-800">Savol Tahrirlash</h3>

      <div>
        <label className="input-label">Savol Matni</label>
        <textarea
          value={edited.text}
          onChange={(e) => setEdited({ ...edited, text: e.target.value })}
          className="input min-h-24"
        />
      </div>

      {edited.type === 'select' && edited.options && (
        <div>
          <label className="input-label">Variantlar</label>
          <div className="space-y-2">
            {edited.options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="radio"
                  checked={edited.correct_answer === opt}
                  onChange={() => setEdited({ ...edited, correct_answer: opt })}
                  className="w-4 h-4 mt-3"
                />
                <input
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...edited.options!];
                    newOpts[i] = e.target.value;
                    setEdited({ ...edited, options: newOpts });
                  }}
                  className="input"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-secondary flex-1 py-3">
          Bekor Qilish
        </button>
        <button onClick={() => onSave(edited)} className="btn-primary flex-1 py-3">
          Saqlash
        </button>
      </div>
    </div>
  );
};

/* --- Helper Functions --- */

function generateMockQuestions(config: any): Question[] {
  const questions: Question[] = [];
  const topics = config.topic.split(/[,;]/).map((t: string) => t.trim());

  for (let i = 0; i < config.selectCount; i++) {
    questions.push({
      id: `q-select-${i}`,
      type: 'select',
      text: `Quyidagi ${topics[0] || 'mavzu'} bilan bog'liq savol ${i + 1} nima?`,
      options: [
        'Javob variantı 1',
        'Javob variantı 2',
        'Javob variantı 3',
        'Javob variantı 4',
      ],
      correct_answer: 'Javob variantı 1',
      points: 10,
      generated: true,
    });
  }

  for (let i = 0; i < config.textCount; i++) {
    questions.push({
      id: `q-text-${i}`,
      type: 'text',
      text: `${topics[0] || 'Mavzu'} bo'yicha matnli savol ${i + 1}: ...?`,
      correct_answer: 'Kutilgan javob',
      points: 10,
      generated: true,
    });
  }

  for (let i = 0; i < config.codeCount; i++) {
    questions.push({
      id: `q-code-${i}`,
      type: 'code',
      text: `Quyidagi masalani JavaScript da yechish:`,
      code_template: `function solution() {\n  // Kodingizni yozing\n}`,
      points: 20,
      generated: true,
    });
  }

  return questions;
}

export default AIExamBuilder;
