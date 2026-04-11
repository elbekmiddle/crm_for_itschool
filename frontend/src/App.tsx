import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfirmProvider } from './context/ConfirmContext';
import { ToastProvider } from './context/ToastContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

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
const TeacherStudentsPage = lazy(() => import('./pages/TeacherStudents'));
const UsersPage = lazy(() => import('./pages/Users'));
const PaymentsPage = lazy(() => import('./pages/Payments'));
const AnalyticsPage = lazy(() => import('./pages/Analytics'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const StudentExams = lazy(() => import('./pages/StudentExams'));
const ExamSession = lazy(() => import('./pages/ExamSession'));
const ExamResult = lazy(() => import('./pages/ExamResult'));
const TeacherExamReview = lazy(() => import('./pages/TeacherExamReview'));
// Admin dedicated layout & pages
const AdminLayout = lazy(() => import('./pages/admin/Layout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const BlogAdminPage = lazy(() => import('./pages/admin/BlogAdmin'));

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200/40">
      <Loader2 className="w-7 h-7 text-white animate-spin" />
    </div>
    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse leading-none">
      IT School yuklanmoqda...
    </span>
  </div>
);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <ToastProvider>
          <Toaster
            position="bottom-right"
            containerStyle={{ zIndex: 11000 }}
            toastOptions={{ duration: 4000, style: { zIndex: 11000 } }}
          />
          <Router>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected Routes (shared Layout for Manager, Teacher, Student) */}
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/settings" element={<SettingsPage />} />

                  {/* MANAGER Panel */}
                  <Route path="/manager" element={<ProtectedRoute roles={['MANAGER']}><Navigate to="/manager/dashboard" replace /></ProtectedRoute>} />
                  <Route path="/manager/dashboard" element={<ProtectedRoute roles={['MANAGER']}><Dashboard /></ProtectedRoute>} />
                  <Route path="/manager/students" element={<ProtectedRoute roles={['MANAGER']}><StudentsPage /></ProtectedRoute>} />
                  <Route path="/manager/students/:id" element={<ProtectedRoute roles={['MANAGER']}><StudentProfilePage /></ProtectedRoute>} />
                  <Route path="/manager/payments" element={<ProtectedRoute roles={['MANAGER']}><PaymentsPage /></ProtectedRoute>} />
                  <Route path="/manager/courses" element={<ProtectedRoute roles={['MANAGER']}><Navigate to="/manager/dashboard" replace /></ProtectedRoute>} />
                  <Route path="/manager/groups" element={<ProtectedRoute roles={['MANAGER']}><Navigate to="/manager/dashboard" replace /></ProtectedRoute>} />

                  {/* TEACHER Panel */}
                  <Route path="/teacher" element={<ProtectedRoute roles={['TEACHER']}><Navigate to="/teacher/dashboard" replace /></ProtectedRoute>} />
                  <Route path="/teacher/dashboard" element={<ProtectedRoute roles={['TEACHER']}><Dashboard /></ProtectedRoute>} />
                  <Route path="/teacher/students" element={<ProtectedRoute roles={['TEACHER']}><TeacherStudentsPage /></ProtectedRoute>} />
                  <Route path="/teacher/students/:id" element={<ProtectedRoute roles={['TEACHER']}><StudentProfilePage /></ProtectedRoute>} />
                  <Route path="/teacher/groups" element={<ProtectedRoute roles={['TEACHER']}><GroupsPage /></ProtectedRoute>} />
                  <Route path="/teacher/groups/:id" element={<ProtectedRoute roles={['TEACHER']}><GroupsPage /></ProtectedRoute>} />
                  <Route path="/teacher/attendance" element={<ProtectedRoute roles={['TEACHER']}><AttendancePage /></ProtectedRoute>} />
                  <Route path="/teacher/exams" element={<ProtectedRoute roles={['TEACHER']}><ExamsPage /></ProtectedRoute>} />
                  <Route path="/teacher/exams/create" element={<ProtectedRoute roles={['TEACHER']}><ExamsPage /></ProtectedRoute>} />
                  <Route path="/teacher/exams/:id" element={<ProtectedRoute roles={['TEACHER']}><ExamsPage /></ProtectedRoute>} />
                  <Route path="/teacher/exams/:examId/review" element={<TeacherExamReview />} />

                  {/* STUDENT Panel */}
                  <Route path="/student" element={<ProtectedRoute roles={['STUDENT']}><Navigate to="/student/dashboard" replace /></ProtectedRoute>} />
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
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="blog" element={<BlogAdminPage />} />
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
