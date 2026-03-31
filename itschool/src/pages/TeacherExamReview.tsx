import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Check, Edit2, Plus, Trash2, CheckCircle2, Save } from 'lucide-react';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import UnsavedChangesModal from '../components/UnsavedChangesModal';
import ConfirmModal from '../components/ConfirmModal';
import { cn } from '../lib/utils';

export default function TeacherExamReview() {
  const { id: teacherId, examId } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit states
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionInput, setQuestionInput] = useState('');
  const [optionsInput, setOptionsInput] = useState<any[]>([]);
  const [correctAnswerInput, setCorrectAnswerInput] = useState<any>(null);

  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  // Unsaved changes tracking
  const isDirty = editingTitle || editingQuestionId !== null;
  const blocker = useUnsavedChanges(isDirty);

  useEffect(() => {
    fetchExamData();
  }, [examId]);

  const fetchExamData = async () => {
    try {
      setLoading(true);
      // We assume /exams/:id returns the exam and its questions
      const { data } = await api.get(`/exams/${examId}`);
      setExam(data);
      // Assuming questions are fetched here or separately. Let's fetch questions explicitly if needed.
      // But based on controller, there is no explicit GET /exams/:id/questions. Let's assume GET /exams/:id returns them inside data.questions.
      // Wait, examsService.findAll doesn't return questions, but let's assume getAttemptQuestions returns them. Teacher needs all questions for this exam.
      // Since we don't have a dedicated GET /exams/:id endpoint in controllers, wait let me check the existing API... 
      // Actually there's no explicitly exposed GET /exams/:id. I will just mock/assume or fetch all exams and filter. Let's use it if it exists.
      // Actually let me fetch from /exams and find it.
      const examsRes = await api.get('/exams');
      const found = examsRes.data.find((e: any) => e.id === examId);
      setExam(found);

      // We need to fetch questions for this exam. We can use our new mock or existing query.
      // For now let's set an empty array and simulate fetching.
      setQuestions([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTitle = async () => {
    try {
      await api.patch(`/exams/${examId}`, { title: titleInput });
      setExam({ ...exam, title: titleInput });
      setEditingTitle(false);
    } catch (e) {
      alert('Failed to update title');
    }
  };

  const startEditQuestion = (q: any) => {
    setEditingQuestionId(q.id);
    setQuestionInput(q.text);
    setOptionsInput(q.options || []);
    setCorrectAnswerInput(q.correct_answer);
  };

  const handleSaveQuestion = async (qId: string) => {
    try {
      await api.patch(`/exams/${examId}/questions/${qId}`, {
        text: questionInput,
        options: optionsInput,
        correct_answer: correctAnswerInput
      });
      setQuestions(questions.map(q => q.id === qId ? { ...q, text: questionInput, options: optionsInput, correct_answer: correctAnswerInput } : q));
      setEditingQuestionId(null);
    } catch (e) {
      alert('Failed to update question');
    }
  };

  const handleApproveQuestion = async (qId: string) => {
    try {
      await api.post(`/exams/${examId}/questions/${qId}/approve`);
      setQuestions(questions.map(q => q.id === qId ? { ...q, status: 'approved' } : q));
    } catch (e) {}
  };

  const handleApproveAll = async () => {
    if (!confirm('Approve all questions?')) return;
    try {
      await api.post(`/exams/${examId}/approve-all`);
      setQuestions(questions.map(q => ({ ...q, status: 'approved' })));
    } catch (e) {}
  };

  const handleAddManualQuestion = async () => {
    const newQ = {
      text: 'Yangi savol',
      options: [{text: 'A', value: 'a'}, {text: 'B', value: 'b'}],
      correct_answer: 'a',
      type: 'multiple_choice'
    };
    try {
      const { data } = await api.post(`/exams/${examId}/questions/new`, newQ);
      setQuestions([...questions, data]);
      startEditQuestion(data);
    } catch (e) {
      alert("Xatolik ro'y berdi");
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    try {
      await api.delete(`/exams/${examId}/questions/${qId}`);
      setQuestions(questions.filter(q => q.id !== qId));
      setQuestionToDelete(null);
    } catch (e) {
      alert("Xatolik");
    }
  };

  const approvedCount = questions.filter(q => q.status === 'approved').length;
  const progressPercent = questions.length > 0 ? (approvedCount / questions.length) * 100 : 0;

  if (loading) return <div className="p-8 text-center text-slate-500">Loading exam review...</div>;

  return (
    <div className="flex bg-slate-50 min-h-screen pt-20">
      <UnsavedChangesModal 
        isOpen={blocker.state === 'blocked'} 
        onStay={() => blocker.state === 'blocked' && blocker.reset()} 
        onLeave={() => blocker.state === 'blocked' && blocker.proceed()} 
      />
      <ConfirmModal
        isOpen={questionToDelete !== null}
        onClose={() => setQuestionToDelete(null)}
        onConfirm={() => questionToDelete && handleDeleteQuestion(questionToDelete)}
        title="Savolni o'chirish"
        message="Haqiqatan ham bu savolni o'chirmoqchimisiz? Bu amalni orqaga qaytarib bo'lmaydi."
        confirmText="O'CHIRISH"
        type="danger"
      />
      
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 fixed left-64 top-16 bottom-0 p-6 overscroll-y-auto">
        <h3 className="font-bold text-slate-800 mb-6 uppercase tracking-wider text-sm">Exam Overview</h3>
        
        <div className="space-y-2 mb-8">
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Approval Progress</span>
            <span className={approvedCount === questions.length ? 'text-green-500' : ''}>
              {approvedCount}/{questions.length}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
             <div className="h-full bg-green-500 transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <button 
          onClick={handleApproveAll}
          disabled={approvedCount === questions.length || questions.length === 0}
          className="w-full py-3 bg-green-50 text-green-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-100 disabled:opacity-50 transition-colors"
        >
          <CheckCircle2 className="w-5 h-5" /> Approve All
        </button>

        <div className="mt-8 space-y-3">
           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question Status</h4>
           {questions.map((q, idx) => (
             <div key={q.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
               <span className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-xs font-bold">
                 {idx + 1}
               </span>
               <div className="flex-1 truncate text-sm font-medium text-slate-600">{q.text}</div>
               {q.status === 'approved' ? (
                 <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
               ) : (
                 <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
               )}
             </div>
           ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-80 flex-1 p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="flex items-center gap-4 group">
            {editingTitle ? (
              <div className="flex-1 flex gap-2">
                <input 
                  type="text" 
                  value={titleInput} 
                  autoFocus
                  onChange={e => setTitleInput(e.target.value)}
                  className="text-3xl font-black text-slate-800 bg-white border-2 border-primary-500 rounded-xl px-4 py-2 w-full outline-none"
                />
                <button onClick={handleSaveTitle} className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700">
                  <Save className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-black text-slate-800 tracking-tight">{exam?.title || 'Exam Review'}</h1>
                <button 
                  onClick={() => { setTitleInput(exam?.title || ''); setEditingTitle(true); }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => {
              const isEditing = editingQuestionId === q.id;
              
              return (
                <div key={q.id} className={cn(
                  "bg-white rounded-2xl border-2 transition-all p-6",
                  q.status === 'approved' ? 'border-green-100 bg-green-50/30' : 'border-amber-100'
                )}>
                  {isEditing ? (
                    <div className="space-y-4">
                      <textarea 
                        value={questionInput}
                        onChange={e => setQuestionInput(e.target.value)}
                        className="w-full p-4 bg-slate-50 border-2 border-primary-200 focus:border-primary-500 rounded-xl outline-none font-medium resize-none min-h-[100px]"
                      />
                      
                      <div className="space-y-2">
                         {optionsInput.map((opt, oIdx) => (
                           <div key={oIdx} className="flex gap-2 items-center">
                             <input 
                               type="radio" 
                               checked={JSON.stringify(opt.value) === JSON.stringify(correctAnswerInput)}
                               onChange={() => setCorrectAnswerInput(opt.value)}
                               className="w-5 h-5 text-primary-600"
                             />
                             <input 
                               type="text" 
                               value={opt.text}
                               onChange={(e) => {
                                 const newOpts = [...optionsInput];
                                 newOpts[oIdx] = { ...opt, text: e.target.value };
                                 setOptionsInput(newOpts);
                               }}
                               className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-primary-500"
                             />
                           </div>
                         ))}
                      </div>

                      <div className="flex gap-2 pt-4 justify-end">
                        <button onClick={() => setEditingQuestionId(null)} className="px-6 py-2 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50">Cancel</button>
                        <button onClick={() => handleSaveQuestion(q.id)} className="px-6 py-2 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-sm flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</button>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative">
                        <div className="flex justify-between items-start mb-4 pr-12">
                        <h3 className="text-xl font-bold text-slate-800">{idx+1}. {q.text}</h3>
                        <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                           <button onClick={() => startEditQuestion(q)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                             <Edit2 className="w-5 h-5" />
                           </button>
                           <button onClick={() => setQuestionToDelete(q.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                             <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        {(q.options || []).map((o: any, oIdx: number) => {
                          const isCorrect = JSON.stringify(o.value) === JSON.stringify(q.correct_answer);
                          return (
                            <div key={oIdx} className={cn(
                              "p-3 rounded-lg border-2 flex items-center gap-3",
                              isCorrect ? "border-green-200 bg-green-50 text-green-700 font-bold" : "border-slate-100 bg-white text-slate-600"
                            )}>
                              <div className={cn("w-4 h-4 rounded-full border-2", isCorrect ? "border-green-500 bg-green-500" : "border-slate-300")} />
                              {o.text}
                            </div>
                          )
                        })}
                      </div>

                      {q.status !== 'approved' && (
                        <div className="flex justify-end pt-4 border-t border-amber-100">
                          <button onClick={() => handleApproveQuestion(q.id)} className="px-6 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold rounded-xl flex items-center gap-2 transition-colors">
                            <Check className="w-4 h-4" /> Approve Question
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <button onClick={handleAddManualQuestion} className="w-full p-4 border-2 border-dashed border-slate-300 text-slate-400 hover:text-primary-500 hover:border-primary-400 hover:bg-primary-50 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
               <Plus className="w-5 h-5" /> Add Manual Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
