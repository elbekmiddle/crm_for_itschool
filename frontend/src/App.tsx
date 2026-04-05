import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfirmProvider } from './context/ConfirmContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { Loader2, GraduationCap } from 'lucide-react';

import './index.css';

// Lazy load all pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StudentsPage = lazy(() => import('./pages/Students'));
const StudentProfilePage = lazy(() => import('./pages/StudentProfile'));
const CoursesPage = lazy(() => import('./pages/Courses'));
const GroupsPage = lazy(() => import('./pages/Groups'));
const AttendancePage = lazy(() => import('./pages/Attendance'));
const ExamsPage = lazy(() => import('./pages/Exams'));
const UsersPage = lazy(() => import('./pages/Users'));
const PaymentsPage = lazy(() => import('./pages/Payments'));
const AnalyticsPage = lazy(() => import('./pages/Analytics'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const StudentExams = lazy(() => import('./pages/StudentExams'));
const ExamSession = lazy(() => import('./pages/ExamSession'));
const ExamResult = lazy(() => import('./pages/ExamResult'));
const TeacherExamReview = lazy(() => import('./pages/TeacherExamReview'));
const LeadsPage = lazy(() => import('./pages/Leads'));
const AdminLayout = lazy(() => import('./pages/admin/Layout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200/40">
      <Loader2 className="w-7 h-7 text-white animate-spin" />
    </div>
    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse leading-none">
      Scholar Flow yuklanmoqda...
    </span>
  </div>
);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <ToastProvider>
          <Router>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected Routes */}
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/settings" element={<SettingsPage />} />


                {/* MANAGER Panel */}
                <Route path="/manager" element={<ProtectedRoute roles={['MANAGER']} children={<Navigate to="/manager/dashboard" replace />} />} />
                <Route path="/manager/dashboard" element={<ProtectedRoute roles={['MANAGER']}><Dashboard /></ProtectedRoute>} />
                <Route path="/manager/students" element={<ProtectedRoute roles={['MANAGER']}><StudentsPage /></ProtectedRoute>} />
                <Route path="/manager/students/:id" element={<ProtectedRoute roles={['MANAGER']}><StudentProfilePage /></ProtectedRoute>} />
                <Route path="/manager/payments" element={<ProtectedRoute roles={['MANAGER']}><PaymentsPage /></ProtectedRoute>} />
                <Route path="/manager/courses" element={<ProtectedRoute roles={['MANAGER']}><CoursesPage /></ProtectedRoute>} />
                <Route path="/manager/leads" element={<ProtectedRoute roles={['MANAGER']}><LeadsPage /></ProtectedRoute>} />

                {/* TEACHER Panel */}
                <Route path="/teacher" element={<ProtectedRoute roles={['TEACHER']} children={<Navigate to="/teacher/dashboard" replace />} />} />
                <Route path="/teacher/dashboard" element={<ProtectedRoute roles={['TEACHER']}><Dashboard /></ProtectedRoute>} />
                <Route path="/teacher/groups" element={<ProtectedRoute roles={['TEACHER']}><GroupsPage /></ProtectedRoute>} />
                <Route path="/teacher/groups/:id" element={<ProtectedRoute roles={['TEACHER']}><GroupsPage /></ProtectedRoute>} />
                <Route path="/teacher/attendance" element={<ProtectedRoute roles={['TEACHER']}><AttendancePage /></ProtectedRoute>} />
                <Route path="/teacher/exams" element={<ProtectedRoute roles={['TEACHER']}><ExamsPage /></ProtectedRoute>} />
                <Route path="/teacher/exams/create" element={<ProtectedRoute roles={['TEACHER']}><ExamsPage /></ProtectedRoute>} />
                <Route path="/teacher/exams/:id" element={<ProtectedRoute roles={['TEACHER']}><ExamsPage /></ProtectedRoute>} />
                <Route path="/teacher/exams/:examId/review" element={<TeacherExamReview />} />

                {/* STUDENT Panel */}
                <Route path="/student" element={<ProtectedRoute roles={['STUDENT']} children={<Navigate to="/student/dashboard" replace />} />} />
                <Route path="/student/dashboard" element={<ProtectedRoute roles={['STUDENT']}><Dashboard /></ProtectedRoute>} />
                <Route path="/student/profile" element={<ProtectedRoute roles={['STUDENT']}><StudentProfilePage /></ProtectedRoute>} />
                <Route path="/student/exams" element={<ProtectedRoute roles={['STUDENT']}><StudentExams /></ProtectedRoute>} />
                <Route path="/student/exam-session/:id" element={<ProtectedRoute roles={['STUDENT']}><ExamSession /></ProtectedRoute>} />
                <Route path="/student/exams/:id/result" element={<ProtectedRoute roles={['STUDENT']}><ExamResult /></ProtectedRoute>} />
                <Route path="/student/exams/:id/review" element={<ProtectedRoute roles={['STUDENT']}><ExamResult /></ProtectedRoute>} />
              </Route>

              {/* ADMIN Panel (Dedicated Layout) */}
              <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="teachers" element={<UsersPage roleFilter="TEACHER" />} />
                <Route path="managers" element={<UsersPage roleFilter="MANAGER" />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="courses" element={<CoursesPage />} />
                <Route path="groups" element={<GroupsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </ToastProvider>
    </ConfirmProvider>
  </QueryClientProvider>
  );
};

export default App;
