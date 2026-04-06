import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Users, Clock, Target, Award,
  AlertCircle, CheckCircle2, XCircle, DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';

interface StudentResult {
  studentId: string;
  studentName: string;
  score: number;
  passed: boolean;
  timeSpent: number;
  attemptCount: number;
  questionsAnswered: number;
  lastAttempt: Date;
}

interface ExamAnalytics {
  examId: string;
  totalStudents: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  failRate: number;
  averageTimeSpent: number;
  highestScore: number;
  lowestScore: number;
  standardDeviation: number;
  questionStats: Array<{
    questionId: string;
    questionText: string;
    correctCount: number;
    incorrectCount: number;
    correctRate: number;
  }>;
  results: StudentResult[];
}

interface ExamAnalyticsDashboardProps {
  examId: string;
  data: ExamAnalytics;
}

const ExamAnalyticsDashboard: React.FC<ExamAnalyticsDashboardProps> = ({
  examId,
  data,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);

  useEffect(() => {
    // Generate timeline data
    const timeline = data.results
      .map((r) => ({
        name: r.studentName,
        score: r.score,
        timestamp: new Date(r.lastAttempt).getTime(),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
    setTimelineData(timeline);
  }, [data.results]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-amber-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 border border-primary-200"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-slate-600 uppercase">O'rtacha Ball</p>
            <Target className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-4xl font-black text-primary-700">
            {data.averageScore.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500 mt-2 font-bold">
            ±{data.standardDeviation.toFixed(1)} std dev
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-slate-600 uppercase">O'tdi (%)</p>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-4xl font-black text-green-700">{data.passRate}%</p>
          <p className="text-xs text-slate-500 mt-2 font-bold">
            {Math.round((data.passRate / 100) * data.totalStudents)} talaba
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-slate-600 uppercase">Yiqildi (%)</p>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-4xl font-black text-red-700">{data.failRate}%</p>
          <p className="text-xs text-slate-500 mt-2 font-bold">
            {Math.round((data.failRate / 100) * data.totalStudents)} talaba
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-slate-600 uppercase">O'rtacha Vaqt</p>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-4xl font-black text-blue-700">
            {Math.round(data.averageTimeSpent / 60)}m
          </p>
          <p className="text-xs text-slate-500 mt-2 font-bold">daqiqada</p>
        </motion.div>
      </div>

      {/* Score Distribution */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-black text-slate-800">Ball Taqsimoti</h3>
        </div>

        <div className="space-y-4">
          {[
            { range: '90-100', count: data.results.filter((r) => r.score >= 90).length },
            { range: '80-89', count: data.results.filter((r) => r.score >= 80 && r.score < 90).length },
            { range: '70-79', count: data.results.filter((r) => r.score >= 70 && r.score < 80).length },
            { range: '60-69', count: data.results.filter((r) => r.score >= 60 && r.score < 70).length },
            { range: '0-59', count: data.results.filter((r) => r.score < 60).length },
          ].map((item) => (
            <div key={item.range} className="flex items-center gap-4">
              <span className="w-16 font-bold text-slate-600 text-sm">{item.range}</span>
              <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                  style={{
                    width: `${(item.count / data.totalStudents) * 100}%`,
                  }}
                />
              </div>
              <span className="w-12 font-black text-slate-800 text-right">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Question Analysis */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <AlertCircle className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-black text-slate-800">Savol Tahlili</h3>
        </div>

        <div className="space-y-3">
          {data.questionStats.map((q) => (
            <div
              key={q.questionId}
              className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-primary-300 transition"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 line-clamp-2">{q.questionText}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-green-600 font-bold">
                    ✓ {q.correctCount} ({(q.correctRate * 100).toFixed(0)}%)
                  </span>
                  <span className="text-xs text-red-600 font-bold">
                    ✗ {q.incorrectCount}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 w-20">
                <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${q.correctRate * 100}%` }}
                  />
                </div>
                <p className="text-xs font-bold text-slate-600 text-right mt-1">
                  {(q.correctRate * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Results Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-black text-slate-800">
              Talabalar Natijalari ({data.results.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">
                  Talaba
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase">
                  Ball
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase">
                  Vaqt
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase">
                  Urinishlar
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase">
                  Javoblar
                </th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((result) => (
                <tr
                  key={result.studentId}
                  onClick={() => setSelectedStudent(result)}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                >
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {result.studentName}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-lg font-black text-sm ${getScoreColor(
                        result.score,
                      )}`}
                    >
                      {result.score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold ${
                        result.passed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {result.passed ? '✓ O\'tdi' : '✗ Yiqildi'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 font-bold">
                    {Math.round(result.timeSpent / 60)}m
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 font-bold">
                    {result.attemptCount}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600 font-bold">
                    {result.questionsAnswered}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Student Details */}
      {selectedStudent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl border-2 border-primary-300 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-black text-slate-800">
              {selectedStudent.studentName} - Tafsilotlar
            </h4>
            <button
              onClick={() => setSelectedStudent(null)}
              className="p-2 hover:bg-primary-200 rounded-xl transition"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Ball</p>
              <p className={`text-3xl font-black ${getScoreColor(selectedStudent.score)}`}>
                {selectedStudent.score}%
              </p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Status</p>
              <p className={`font-black ${selectedStudent.passed ? 'text-green-600' : 'text-red-600'}`}>
                {selectedStudent.passed ? 'O\'tdi' : 'Yiqildi'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Vaqt</p>
              <p className="text-2xl font-black text-slate-800">
                {Math.round(selectedStudent.timeSpent / 60)}m
              </p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Javoblar</p>
              <p className="text-2xl font-black text-slate-800">
                {selectedStudent.questionsAnswered}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ExamAnalyticsDashboard;
