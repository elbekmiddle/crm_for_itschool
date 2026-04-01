import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Check, Edit2, Plus, Trash2, CheckCircle2, Save, X } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';

export default function TeacherExamReview() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetchExamData();
  }, [examId]);

  const fetchExamData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/exams/${examId}`);
      if (data.success) {
        setExam(data.data);
        setQuestions(data.data.questions || []);
      }
    } catch (e) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const markDirty = () => setIsDirty(true);

  const handleSaveAll = async () => {
    try {
      await api.patch(`/exams/${examId}`, { 
        title: exam.title,
        questions: questions 
      });
      toast.success("Muvaffaqiyatli saqlandi");
      setIsDirty(false);
    } catch (e) {
      toast.error("Saqlashda xatolik yuz berdi");
    }
  };

  const handleApproveAll = async () => {
    const ok = await confirm({
      title: 'Hamma savollarni tasdiqlash?',
      message: 'Barcha draft savollar approved holatiga o\'tib, imtihon o\'quvchilarga ko\'rina boshlaydi.',
      type: 'warning',
      confirmText: 'TASDIQLASH'
    });
    if (ok) {
      try {
        await api.post(`/exams/${examId}/approve-all`);
        toast.success("Muvaffaqiyatli tasdiqlandi");
        navigate('/exams');
      } catch (e) {
        toast.error("Tasdiqlashda xatolik");
      }
    }
  };

  const deleteQuestion = async (qId: string | number) => {
    const ok = await confirm({
      title: 'Savolni o\'chirish?',
      message: 'Ushbu savol tizimdan butunlay o\'chiriladi.',
      type: 'danger',
      confirmText: 'O\'CHIRISH'
    });
    if (ok) {
      try {
        await api.delete(`/exams/${examId}/questions/${qId}`);
        setQuestions(questions.filter(q => q.id !== qId));
        toast.success("O'chirildi");
      } catch (e) {
        toast.error("O'chirishda xatolik");
      }
    }
  };

  const updateQuestion = (idx: number, field: string, val: any) => {
    const newQs = [...questions];
    newQs[idx] = { ...newQs[idx], [field]: val };
    setQuestions(newQs);
    markDirty();
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Yuklanmoqda...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pt-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex-1 w-full">
            <input 
              value={exam?.title || ''}
              onChange={(e) => { setExam({ ...exam, title: e.target.value }); markDirty(); }}
              className="text-3xl font-black text-slate-800 dark:text-white bg-transparent border-none focus:ring-0 w-full p-0"
              placeholder="Imtihon nomi..."
            />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">
              Jami savollar: {questions.length} • Status: {exam?.status}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <button onClick={handleSaveAll} className="flex-1 md:flex-none px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
               <Save className="w-5 h-5" /> Saqlash
             </button>
             <button onClick={handleApproveAll} className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2">
               <CheckCircle2 className="w-5 h-5" /> Tasdiqlash
             </button>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-4">
          <AnimatePresence>
            {questions.map((q, qIdx) => (
              <motion.div 
                key={qIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 relative group"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400">
                    {qIdx + 1}
                  </span>
                  <button onClick={() => deleteQuestion(q.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <textarea 
                  value={q.text}
                  onChange={(e) => updateQuestion(qIdx, 'text', e.target.value)}
                  className="w-full text-xl font-bold bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 mb-6 text-slate-800 dark:text-white"
                  rows={2}
                  placeholder="Savol matni..."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(q.options || []).map((opt: string, oIdx: number) => (
                    <div key={oIdx} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                      q.correct_answer === oIdx ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30'
                    }`}>
                      <input 
                        type="radio" 
                        name={`q-${qIdx}`}
                        checked={q.correct_answer === oIdx}
                        onChange={() => updateQuestion(qIdx, 'correct_answer', oIdx)}
                        className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <input 
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...q.options];
                          newOpts[oIdx] = e.target.value;
                          updateQuestion(qIdx, 'options', newOpts);
                        }}
                        className="flex-1 bg-transparent border-none p-0 font-bold text-slate-700 dark:text-slate-300 focus:ring-0"
                        placeholder={`Variant ${String.fromCharCode(65 + oIdx)}...`}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button 
          onClick={() => setQuestions([...questions, { text: 'Yangi savol', options: ['', '', '', ''], correct_answer: 0, status: 'draft' }])}
          className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 font-bold hover:border-indigo-500 hover:text-indigo-500 transition-all uppercase tracking-widest text-xs"
        >
          + Yangi savol qo'shish
        </button>
      </div>
    </div>
  );
}
