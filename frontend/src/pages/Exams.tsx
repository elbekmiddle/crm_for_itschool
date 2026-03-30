import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { 
  Plus, ClipboardList, Trash2, Loader2, Send, Sparkles, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { cn } from '../lib/utils';

const ExamsPage = () => {
  const { 
    exams, fetchExams, createExam, deleteExam, publishExam, generateAiExam,
    examResults, fetchExamResults,
    courses, fetchCourses, lessons, fetchLessons,
    isLoading 
  } = useAdminStore();
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { 
    fetchCourses(); 
  }, []);

  useEffect(() => {
    if (selectedCourse) fetchExams(selectedCourse);
  }, [selectedCourse]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createExam({
      title: formData.get('title'),
      course_id: selectedCourse || formData.get('course_id'),
      duration_minutes: Number(formData.get('duration_minutes')),
      max_attempts: Number(formData.get('max_attempts') || 1),
    });
    setIsCreateModalOpen(false);
  };

  const handleAiGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedExamId) return;
    setAiLoading(true);
    const formData = new FormData(e.currentTarget);
    await generateAiExam(selectedExamId, {
      lesson_id: formData.get('lesson_id'),
      topic: formData.get('topic'),
      level: formData.get('level'),
      count: Number(formData.get('count')),
    });
    setAiLoading(false);
    setIsAiModalOpen(false);
  };

  const showResults = async (examId: string) => {
    await fetchExamResults(examId);
    setIsResultsModalOpen(true);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-600';
      case 'published': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="p-8 lg:p-14 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Imtihonlar</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Jami: {exams.length} imtihon</p>
        </motion.div>
        <div className="flex gap-4 items-center">
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="p-4 bg-white border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 shadow-lg">
            <option value="">Barcha kurslar</option>
            {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-6 h-6" /> YARATISH
          </Button>
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence>
          {exams.map((exam: any, idx: number) => (
            <motion.div 
              key={exam.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex flex-col gap-6 group"
            >
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                  <ClipboardList className="w-7 h-7" />
                </div>
                <span className={cn("px-3 py-1 rounded-full text-xs font-black uppercase", statusColor(exam.status))}>
                  {exam.status === 'draft' ? 'Qoralama' : exam.status === 'published' ? 'Nashr' : exam.status}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-tight">{exam.title}</h3>
                <p className="text-xs font-bold text-slate-400 mt-1">{exam.course_name || 'Kurs'} • {exam.duration_minutes || 60} daqiqa</p>
              </div>

              <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-50">
                {exam.status === 'draft' && (
                  <button onClick={() => publishExam(exam.id)} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-black uppercase hover:bg-green-100 transition-colors">
                    <Send className="w-3.5 h-3.5" /> Nashr
                  </button>
                )}
                <button onClick={() => { setSelectedExamId(exam.id); fetchLessons(exam.course_id || selectedCourse); setIsAiModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-black uppercase hover:bg-purple-100 transition-colors">
                  <Sparkles className="w-3.5 h-3.5" /> AI
                </button>
                <button onClick={() => showResults(exam.id)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase hover:bg-blue-100 transition-colors">
                  <Eye className="w-3.5 h-3.5" /> Natijalar
                </button>
                <button onClick={() => { setDeletingId(exam.id); setIsConfirmOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase hover:bg-red-100 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isLoading && exams.length === 0 && (
        <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>
      )}
      {!isLoading && exams.length === 0 && (
        <div className="py-20 text-center text-slate-300">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="font-black uppercase tracking-widest">{selectedCourse ? 'Bu kursda imtihon yo\'q' : 'Kurs tanlang'}</p>
        </div>
      )}

      {/* Create Exam Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Yangi Imtihon">
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nomi</label>
            <input required name="title" placeholder="Masalan: Python Final Exam" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800" />
          </div>
          {!selectedCourse && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kurs</label>
              <select required name="course_id" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800">
                <option value="">Tanlang...</option>
                {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Davomiyligi (daq)</label>
              <input required name="duration_minutes" type="number" defaultValue={60} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Max Urinishlar</label>
              <input name="max_attempts" type="number" defaultValue={1} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800" />
            </div>
          </div>
          <Button type="submit" className="w-full py-6">YARATISH</Button>
        </form>
      </Modal>

      {/* AI Generate Modal */}
      <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="AI Savol Generatsiya">
        <form onSubmit={handleAiGenerate} className="space-y-6">
          <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex items-center gap-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <p className="text-sm font-bold text-purple-700">AI avtomatik savollar yaratadi va imtihonga biriktiradi</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Dars</label>
            <select required name="lesson_id" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800">
              <option value="">Tanlang...</option>
              {(lessons || []).map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mavzu</label>
            <input required name="topic" placeholder="Masalan: Variables va Data Types" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Daraja</label>
              <select required name="level" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800">
                <option value="easy">Oson</option>
                <option value="medium">O'rtacha</option>
                <option value="hard">Qiyin</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Soni</label>
              <input required name="count" type="number" defaultValue={10} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800" />
            </div>
          </div>
          <Button type="submit" isLoading={aiLoading} className="w-full py-6 bg-purple-600 shadow-purple-200">
            <Sparkles className="w-5 h-5" /> GENERATSIYA QILISH
          </Button>
        </form>
      </Modal>

      {/* Results Modal */}
      <Modal isOpen={isResultsModalOpen} onClose={() => setIsResultsModalOpen(false)} title="Imtihon Natijalari" className="max-w-2xl">
        <div className="space-y-4">
          {(examResults || []).length === 0 ? (
            <p className="text-center text-slate-400 font-bold py-8">Hali natijalar yo'q</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Talaba</th>
                  <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Ball</th>
                  <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {examResults.map((r: any) => (
                  <tr key={r.id || r.attempt_id}>
                    <td className="py-3 px-4 font-bold text-slate-700">{r.student_first_name || 'Talaba'} {r.student_last_name || ''}</td>
                    <td className="py-3 px-4 font-black text-primary-600">{r.score || 0} / {r.total || '?'}</td>
                    <td className="py-3 px-4">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-black uppercase", r.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
                        {r.status || 'Kutilmoqda'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => { if (deletingId) { deleteExam(deletingId); setDeletingId(null); } }}
        title="Imtihonni o'chirish"
        message="Rostdan ham bu imtihonni o'chirasizmi?"
        confirmText="O'CHIRISH"
      />
    </div>
  );
};

export default ExamsPage;
