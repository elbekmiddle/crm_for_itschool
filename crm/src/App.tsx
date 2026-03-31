import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';
import './index.css';

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
const TeacherExamReview = lazy(() => import('./pages/TeacherExamReview'));
const LeadsPage = lazy(() => import('./pages/LeadsPage'));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'));

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
  </div>
);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* ADMIN */}
              <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><Dashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><UsersPage /></ProtectedRoute>} />
              <Route path="/admin/students" element={<ProtectedRoute roles={['ADMIN']}><StudentsPage /></ProtectedRoute>} />
              <Route path="/admin/courses" element={<ProtectedRoute roles={['ADMIN']}><CoursesPage /></ProtectedRoute>} />
              <Route path="/admin/groups" element={<ProtectedRoute roles={['ADMIN']}><GroupsPage /></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute roles={['ADMIN']}><AnalyticsPage /></ProtectedRoute>} />

              {/* MANAGER */}
              <Route path="/manager/dashboard" element={<ProtectedRoute roles={['MANAGER']}><Dashboard /></ProtectedRoute>} />
              <Route path="/manager/students" element={<ProtectedRoute roles={['MANAGER']}><StudentsPage /></ProtectedRoute>} />
              <Route path="/manager/students/:id" element={<ProtectedRoute roles={['MANAGER']}><StudentProfilePage /></ProtectedRoute>} />
              <Route path="/manager/payments" element={<ProtectedRoute roles={['MANAGER']}><PaymentsPage /></ProtectedRoute>} />
              <Route path="/manager/courses" element={<ProtectedRoute roles={['MANAGER']}><CoursesPage /></ProtectedRoute>} />
              <Route path="/manager/leads" element={<ProtectedRoute roles={['MANAGER']}><LeadsPage /></ProtectedRoute>} />
              <Route path="/manager/applications" element={<ProtectedRoute roles={['MANAGER']}><ApplicationsPage /></ProtectedRoute>} />

              {/* TEACHER */}
              <Route path="/teacher/dashboard" element={<ProtectedRoute roles={['TEACHER']}><Dashboard /></ProtectedRoute>} />
              <Route path="/teacher/groups" element={<ProtectedRoute roles={['TEACHER']}><GroupsPage /></ProtectedRoute>} />
              <Route path="/teacher/attendance" element={<ProtectedRoute roles={['TEACHER']}><AttendancePage /></ProtectedRoute>} />
              <Route path="/teacher/exams" element={<ProtectedRoute roles={['TEACHER']}><ExamsPage /></ProtectedRoute>} />
              <Route path="/teacher/exams/:id" element={<ProtectedRoute roles={['TEACHER']}><ExamsPage /></ProtectedRoute>} />
              <Route path="/teacher/:id/exams/review/:examId" element={<ProtectedRoute roles={['TEACHER']}><TeacherExamReview /></ProtectedRoute>} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
