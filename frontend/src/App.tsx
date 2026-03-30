import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
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
const QuestionsPage = lazy(() => import('./pages/Questions'));
const UsersPage = lazy(() => import('./pages/Users'));
const PaymentsPage = lazy(() => import('./pages/Payments'));
const AnalyticsPage = lazy(() => import('./pages/Analytics'));
const SettingsPage = lazy(() => import('./pages/Settings'));

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
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/:id" element={<StudentProfilePage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/exams" element={<ExamsPage />} />
              <Route path="/questions" element={<QuestionsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
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
