import React, { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import {
  Users, Clock, CheckCircle, AlertCircle, Activity, TrendingUp,
  Zap, Eye, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import SparklineChart from './charts/SparklineChart';

interface ExamMonitorProps {
  examId: string;
  examTitle: string;
}

interface StudentSession {
  studentId: string;
  studentName: string;
  status: 'in_progress' | 'submitted' | 'time_up';
  progress: number; // 0-100
  startedAt: Date;
  lastActivity: Date;
  questionsAnswered: number;
  totalQuestions: number;
}

const ExamMonitoringDashboard: React.FC<ExamMonitorProps> = ({
  examId,
  examTitle,
}) => {
  const { joinExamRoom, leaveExamRoom, on, off, emit, isConnected } = useSocket();
  const [studentSessions, setStudentSessions] = useState<StudentSession[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionsGenerated, setQuestionsGenerated] = useState<any[]>([]);

  // Socket.IO setup
  useEffect(() => {
    if (!isConnected) return;

    joinExamRoom(examId, 'teacher-id', 'teacher');

    // Listen for student exam events
    on('student_exam_started', (data) => {
      console.log('Student started exam:', data);
      setStudentSessions((prev) => [
        ...prev,
        {
          studentId: data.studentId,
          studentName: `Student ${data.studentId.slice(0, 8)}`,
          status: 'in_progress',
          progress: 0,
          startedAt: new Date(),
          lastActivity: new Date(),
          questionsAnswered: 0,
          totalQuestions: 0,
        },
      ]);
      toast.success('Talaba imtihonni boshladi');
    });

    on('student_answered', (data) => {
      console.log('Student answered:', data);
      setStudentSessions((prev) =>
        prev.map((s) =>
          s.studentId === data.studentId
            ? {
                ...s,
                questionsAnswered: s.questionsAnswered + 1,
                progress: Math.round(
                  ((s.questionsAnswered + 1) / (s.totalQuestions || 10)) * 100,
                ),
                lastActivity: new Date(),
              }
            : s,
        ),
      );
    });

    on('student_submitted', (data) => {
      console.log('Student submitted:', data);
      setStudentSessions((prev) =>
        prev.map((s) =>
          s.studentId === data.studentId
            ? { ...s, status: 'submitted', progress: 100 }
            : s,
        ),
      );
      toast.success(`${data.studentId}: ${data.score}%`);
    });

    on('ai_generation_started', (data) => {
      console.log('AI generation started:', data);
      setIsGenerating(true);
      setGenerationProgress(0);
      setQuestionsGenerated([]);
      toast.loading('AI savollarni yaratmoqda...');
    });

    on('question_generated', (data) => {
      console.log('Question generated:', data);
      setQuestionsGenerated((prev) => [...prev, data.question]);
      setGenerationProgress(data.progress);
    });

    on('ai_generation_completed', (data) => {
      console.log('AI generation completed:', data);
      setQuestionsGenerated(data.questions);
      setGenerationProgress(100);
      setIsGenerating(false);
      toast.success(`${data.questions.length} ta savol yaratildi!`);
    });

    return () => {
      leaveExamRoom(examId, 'teacher-id');
      off('student_exam_started');
      off('student_answered');
      off('student_submitted');
      off('ai_generation_started');
      off('question_generated');
      off('ai_generation_completed');
    };
  }, [isConnected, examId, joinExamRoom, leaveExamRoom, on, off]);

  const activeStudents = studentSessions.filter(
    (s) => s.status === 'in_progress',
  ).length;
  const submittedStudents = studentSessions.filter(
    (s) => s.status === 'submitted',
  ).length;
  const avgProgress =
    studentSessions.length > 0
      ? Math.round(
          studentSessions.reduce((sum, s) => sum + s.progress, 0) /
          studentSessions.length,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800">{examTitle}</h2>
            <p className="text-sm text-slate-400 font-bold mt-1">
              Real-time Monitoring
            </p>
          </div>
          {!isConnected && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold">
              <AlertCircle className="w-4 h-4" />
              Disconnected
            </div>
          )}
          {isConnected && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-sm font-bold">
              <Activity className="w-4 h-4 animate-pulse" />
              Live
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                  Total Talabalar
                </p>
                <p className="text-3xl font-black text-primary-600">
                  {studentSessions.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-primary-300" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                  Faol Imtihon
                </p>
                <p className="text-3xl font-black text-blue-600">
                  {activeStudents}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-300" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                  Yuborilgan
                </p>
                <p className="text-3xl font-black text-green-600">
                  {submittedStudents}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-300" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                  O'rtacha Progress
                </p>
                <p className="text-3xl font-black text-amber-600">
                  {avgProgress}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-300" />
            </div>
          </div>
        </div>
      </div>

      {/* AI Generation Status */}
      {isGenerating && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-indigo-600 animate-pulse" />
              <h3 className="text-lg font-black text-slate-800">
                AI Savollar Yaratilmoqda
              </h3>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">
                  Progress
                </span>
                <span className="text-sm font-black text-indigo-600">
                  {Math.round(generationProgress)}%
                </span>
              </div>
              <SparklineChart
              className="w-full"
              height={36}
              color="#4f46e5"
              values={[0, Math.round(generationProgress * 0.5), Math.round(generationProgress)]}
            />
            </div>

            {/* Generated Questions Preview */}
            {questionsGenerated.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-bold text-slate-600 mb-2">
                  Yaratilgan savollar: {questionsGenerated.length}
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {questionsGenerated.slice(0, 3).map((q, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 bg-white rounded-lg"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {q.text}
                      </p>
                    </div>
                  ))}
                  {questionsGenerated.length > 3 && (
                    <p className="text-xs text-slate-400 text-center">
                      +{questionsGenerated.length - 3} ko'proq...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Sessions */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-800">
            Talabalar Sessiyalari
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">
                  Talaba
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase">
                  Progress
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase">
                  Javoblar
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase">
                  Oxirgi Faollik
                </th>
              </tr>
            </thead>
            <tbody>
              {studentSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-slate-400 font-bold">
                      Talabalar imtihon boshlashini kutmoqda...
                    </p>
                  </td>
                </tr>
              ) : (
                studentSessions.map((session) => (
                  <tr
                    key={session.studentId}
                    className="border-b border-slate-100 hover:bg-slate-50 transition"
                  >
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {session.studentName}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                          session.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : session.status === 'submitted'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            session.status === 'in_progress'
                              ? 'bg-blue-600 animate-pulse'
                              : session.status === 'submitted'
                                ? 'bg-green-600'
                                : 'bg-red-600'
                          }`}
                        />
                        {session.status === 'in_progress'
                          ? 'Davom etmoqda'
                          : session.status === 'submitted'
                            ? 'Yuborilgan'
                            : 'Vaqt tugadi'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <SparklineChart
                          className="flex-1 min-w-0"
                          height={28}
                          color="#4f46e5"
                          values={[0, Math.round(session.progress * 0.55), session.progress]}
                        />
                        <span className="text-xs font-bold text-slate-600 shrink-0 tabular-nums">
                          {session.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-slate-700">
                        {session.questionsAnswered}/{session.totalQuestions || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500">
                      {Math.round(
                        (new Date().getTime() -
                          new Date(session.lastActivity).getTime()) /
                        1000,
                      )}
                      s ago
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Questions Generated */}
      {questionsGenerated.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-black text-slate-800 mb-4">
            Yaratilgan Savollar ({questionsGenerated.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {questionsGenerated.map((q, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-primary-300 transition"
              >
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 mb-1">{q.text}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-600 font-mono font-bold">
                      {q.type === 'select'
                        ? 'SELECT'
                        : q.type === 'text'
                          ? 'TEXT'
                          : 'CODE'}
                    </span>
                    {q.points && (
                      <span className="text-xs text-slate-500 font-bold">
                        {q.points} ball
                      </span>
                    )}
                  </div>
                </div>
                <Eye className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamMonitoringDashboard;
