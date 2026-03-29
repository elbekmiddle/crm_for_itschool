import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StudentsPage from './pages/Students';
import ExamsPage from './pages/Exams';
import GroupsPage from './pages/Groups';
import LoginPage from './pages/LoginPage';
import CoursesPage from './pages/Courses';
import AttendancePage from './pages/Attendance';
import UsersPage from './pages/Users';
import QuestionsPage from './pages/Questions';
import { Loader2 } from 'lucide-react';

const AnalyticsPage = () => (
  <div className="p-14 space-y-4">
    <h1 className="text-7xl font-black text-indigo-600 tracking-tighter uppercase leading-none">AI Analytics</h1>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">V2.1 Platform Intelligence</p>
  </div>
);

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
    <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse leading-none">Platforma yuklanmoqda...</span>
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
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/exams" element={<ExamsPage />} />
              <Route path="/questions" element={<QuestionsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
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
