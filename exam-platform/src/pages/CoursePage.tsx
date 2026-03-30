import React, { useEffect } from 'react';
import { useStudentStore } from '../store/useStudentStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  BookOpen, Users, User, Loader2, TrendingUp,
  Layers, CheckCircle2
} from 'lucide-react';

const LEVELS = ['Boshlang\'ich', 'O\'rta', 'Yuqori'];

const CoursePage: React.FC = () => {
  const { course, fetchCourse, attendance, attendanceStats, fetchAttendance, isLoading } = useStudentStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchCourse();
    if (user?.id) fetchAttendance(user.id);
  }, [user?.id]);

  const levelIdx = LEVELS.indexOf(course?.level || '') >= 0 ? LEVELS.indexOf(course?.level || '') : 0;
  const progress = Math.round(((levelIdx + 1) / LEVELS.length) * 100);

  return (
    <div className="page-container space-y-6 pb-20 lg:pb-6 animate-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Kursim</h1>
        <p className="text-slate-400 text-sm mt-1">Joriy kurs va guruh ma'lumotlari</p>
      </div>

      {isLoading ? (
        <div className="card p-12 flex justify-center"><Loader2 className="w-7 h-7 text-primary-400 animate-spin" /></div>
      ) : course ? (
        <>
          {/* Course hero */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-black">{course.course_name || course.name || 'Kurs'}</h2>
              <p className="text-primary-200 text-sm mt-1">{course.level || 'Daraja belgilanmagan'}</p>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <p className="label-subtle">Guruh</p>
                  <p className="font-bold text-slate-800">{course.group_name || 'Guruhsiz'}</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <p className="label-subtle">O'qituvchi</p>
                  <p className="font-bold text-slate-800">{course.teacher_name || 'Belgilanmagan'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-500" />
              <p className="font-bold text-slate-800 text-sm">Daraja Progressi</p>
            </div>
            <div className="flex gap-2">
              {LEVELS.map((l, i) => (
                <div key={l} className={`flex-1 rounded-lg p-3 text-center text-xs font-bold border-2 transition-all ${i <= levelIdx ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                  {i <= levelIdx && <CheckCircle2 className="w-3.5 h-3.5 mx-auto mb-1 text-primary-500" />}
                  {l}
                </div>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                <span>Progress</span><span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {/* Attendance in course */}
          {attendanceStats && (
            <div className="card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <p className="font-bold text-slate-800 text-sm">Davomat statistikasi</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-green-600">{attendanceStats.present_count}</p>
                  <p className="text-[10px] text-green-500 font-bold mt-0.5">KELDI</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-red-500">{attendanceStats.absent_count}</p>
                  <p className="text-[10px] text-red-400 font-bold mt-0.5">QOLDI</p>
                </div>
                <div className="bg-primary-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-primary-600">{attendanceStats.attendance_percentage}%</p>
                  <p className="text-[10px] text-primary-500 font-bold mt-0.5">FOIZ</p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">Kurs topilmadi</p>
        </div>
      )}
    </div>
  );
};

export default CoursePage;
