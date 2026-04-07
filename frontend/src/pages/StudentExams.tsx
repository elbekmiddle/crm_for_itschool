import React, { useEffect, useState } from 'react';
import { useStudentStore } from '../store/useStudentStore';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  Play, 
  Loader2, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import StartExamModal from '../components/StartExamModal';

const StudentExams: React.FC = () => {
  const { exams, fetchExams, isLoading } = useStudentStore();
  const navigate = useNavigate();
  const [selectedExam, setSelectedExam] = useState<{id: string, title: string} | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  if (isLoading && exams.length === 0) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Mening Imtihonlarim</h1>
        <p className="text-sm text-slate-400 mt-1">Sizga biriktirilgan barcha imtihonlar va ularning holati.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam: any) => {
          const isDone = exam.status === 'completed' || exam.attemptCount > 0;
          return (
            <div 
              key={exam.id} 
              className={cn(
                "card p-6 flex flex-col justify-between transition-all group",
                isDone ? "bg-slate-50/50 border-slate-100" : "hover:border-primary-200 cursor-pointer"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                    isDone ? "bg-slate-100 text-slate-400" : "bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white"
                  )}>
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  {isDone ? (
                    <span className="status-pill pill-completed flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3" /> Yakunlangan
                    </span>
                  ) : (
                    <span className="status-pill pill-active">Kutilmoqda</span>
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 group-hover:text-primary-700 transition-colors">
                  {exam.title}
                </h3>
                <p className="text-xs text-slate-400 font-medium line-clamp-2 mb-4">
                  Ushbu imtihon {exam.course_name} kursi doirasida bilimingizni sinash uchun mo'ljallangan.
                </p>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    {exam.duration_minutes} daqiqa
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {exam.passing_score}% ball
                  </div>
                </div>
                
                <button 
                  onClick={() => isDone ? navigate(`/student/exams/${exam.id}/result`) : setSelectedExam({ id: exam.id, title: exam.title })}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isDone 
                      ? "bg-slate-100 text-slate-400 hover:bg-slate-200" 
                      : "bg-primary-600 text-white hover:scale-110 shadow-lg shadow-primary-200"
                  )}
                >
                  {isDone ? <ChevronRight className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
              </div>
            </div>
          );
        })}

        {exams.length === 0 && (
          <div className="col-span-full card p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-800">Imtihonlar yo'q</h3>
            <p className="text-sm text-slate-400 mt-1">Hozircha sizga biriktirilgan imtihonlar mavjud emas.</p>
          </div>
        )}
      </div>

      <StartExamModal 
        isOpen={selectedExam !== null}
        onClose={() => setSelectedExam(null)}
        examId={selectedExam?.id || ''}
        examTitle={selectedExam?.title || ''}
      />
    </div>
  );
};

export default StudentExams;
