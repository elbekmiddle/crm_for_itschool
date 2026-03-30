import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { 
  Plus, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { cn } from '../lib/utils';

const LEVELS = [
  { value: 'easy', label: 'Oson', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: "O'rtacha", color: 'bg-amber-100 text-amber-700' },
  { value: 'hard', label: 'Qiyin', color: 'bg-red-100 text-red-700' },
];

const QuestionsPage = () => {
  const { courses, fetchCourses, lessons, fetchLessons, questions, fetchQuestions, createQuestion, createLesson } = useAdminStore();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

  useEffect(() => { fetchCourses(); }, []);

  const handleCourseSelect = async (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedLesson('');
    if (courseId) await fetchLessons(courseId);
  };

  const handleLessonSelect = async (lessonId: string) => {
    setSelectedLesson(lessonId);
    if (lessonId) await fetchQuestions(lessonId);
  };

  const handleCreateQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createQuestion({
      lesson_id: selectedLesson,
      text: formData.get('text'),
      level: formData.get('level'),
    });
    await fetchQuestions(selectedLesson);
    setIsQuestionModalOpen(false);
  };

  const handleCreateLesson = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createLesson({
      course_id: selectedCourse,
      title: formData.get('title'),
      order_num: Number(formData.get('order_num') || 1),
    });
    await fetchLessons(selectedCourse);
    setIsLessonModalOpen(false);
  };

  return (
    <div className="p-8 lg:p-14 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-1">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Savollar Bazasi</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Kurs → Dars → Savollar</p>
        </div>
      </header>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-3 block">Kurs</label>
          <select value={selectedCourse} onChange={(e) => handleCourseSelect(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800">
            <option value="">— Kurs tanlang —</option>
            {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50">
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Dars</label>
            {selectedCourse && (
              <button onClick={() => setIsLessonModalOpen(true)} className="text-xs font-black text-primary-600 uppercase hover:underline">+ Dars qo'shish</button>
            )}
          </div>
          <select value={selectedLesson} onChange={(e) => handleLessonSelect(e.target.value)} disabled={!selectedCourse} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800 disabled:opacity-50">
            <option value="">— Dars tanlang —</option>
            {(lessons || []).map((l: any) => <option key={l.id} value={l.id}>{l.order_num}. {l.title}</option>)}
          </select>
        </div>
      </div>

      {/* Questions List */}
      {selectedLesson && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Savollar ({questions.length})</h3>
            <Button onClick={() => setIsQuestionModalOpen(true)}>
              <Plus className="w-5 h-5" /> SAVOL QO'SHISH
            </Button>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {questions.map((q: any, idx: number) => (
                <motion.div 
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-50 flex items-start gap-6"
                >
                  <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 font-black flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 leading-relaxed">{q.text}</p>
                    <div className="mt-3">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-black uppercase", 
                        LEVELS.find(l => l.value === q.level)?.color || 'bg-slate-100 text-slate-700'
                      )}>
                        {LEVELS.find(l => l.value === q.level)?.label || q.level}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {questions.length === 0 && (
              <div className="py-16 text-center text-slate-300">
                <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="font-black uppercase tracking-widest text-sm">Bu dars uchun savollar yo'q</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* New Question Modal */}
      <Modal isOpen={isQuestionModalOpen} onClose={() => setIsQuestionModalOpen(false)} title="Yangi Savol">
        <form onSubmit={handleCreateQuestion} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Savol Matni</label>
            <textarea required name="text" rows={4} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Daraja</label>
            <select required name="level" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800">
              {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <Button type="submit" className="w-full py-6">SAQLASH</Button>
        </form>
      </Modal>

      {/* New Lesson Modal */}
      <Modal isOpen={isLessonModalOpen} onClose={() => setIsLessonModalOpen(false)} title="Yangi Dars">
        <form onSubmit={handleCreateLesson} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Dars Nomi</label>
            <input required name="title" placeholder="Masalan: HTML Asoslari" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tartib Raqami</label>
            <input name="order_num" type="number" defaultValue={1} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none font-bold text-slate-800" />
          </div>
          <Button type="submit" className="w-full py-6">SAQLASH</Button>
        </form>
      </Modal>
    </div>
  );
};

export default QuestionsPage;
