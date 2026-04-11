import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import AppLayout from './components/AppLayout';
import ExamLayout from './components/ExamLayout';

// Pages
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/UserDashboard';
import ProfilePage from './pages/ProfilePage';
import CoursePage from './pages/CoursePage';
import AttendancePage from './pages/AttendancePage';
import PaymentsPage from './pages/PaymentsPage';
import ExamListPage from './pages/ExamListPage';
import ExamDetailPage from './pages/ExamDetailPage';
import ExamPage from './pages/ExamPage';
import ResultPage from './pages/ResultPage';
import ReviewPage from './pages/ReviewPage';

const StaffRedirect = () => {
  const crm = import.meta.env.VITE_CRM_ORIGIN || 'http://localhost:5173';
  const logout = useAuthStore((s) => s.logout);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#f4f3ec] p-8 text-center font-sans">
      <p className="text-xl font-black text-[#08060d] tracking-tight">Xodim / administrator</p>
      <p className="text-[#6b6375] max-w-md text-sm font-medium leading-relaxed">
        Talaba imtihon paneli o‘rniga asosiy CRM kabinetidan foydalaning (telefon bilan kirish endi u yerda ham ishlaydi).
      </p>
      <a
        href={crm}
        className="rounded-2xl bg-[#aa3bff] px-8 py-4 font-black text-white uppercase tracking-widest text-xs shadow-lg shadow-[#aa3bff]/25 hover:bg-[#9329e6] transition-colors"
      >
        CRM ga o‘tish
      </a>
      <button
        type="button"
        onClick={() => {
          logout();
          window.location.href = '/login';
        }}
        className="text-sm font-black text-red-500 hover:underline"
      >
        Chiqish
      </button>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, syncSession } = useAuthStore();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isAuthenticated) {
        setSessionReady(true);
        return;
      }
      await syncSession();
      if (!cancelled) setSessionReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, syncSession]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[var(--bg)]">
        <div className="h-10 w-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-[var(--text)] opacity-70">Sessiya tekshirilmoqda…</p>
      </div>
    );
  }

  if (user && !user.role) {
    const logout = useAuthStore.getState().logout;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-[var(--bg)] text-center">
        <p className="text-sm font-bold text-[var(--text)]">Rol aniqlanmadi. Qayta kiring.</p>
        <button
          type="button"
          className="rounded-2xl bg-[var(--accent)] px-6 py-3 text-white text-xs font-black uppercase"
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
        >
          Chiqish
        </button>
      </div>
    );
  }

  if (user && (user.role === 'TEACHER' || user.role === 'MANAGER' || user.role === 'ADMIN')) {
    return <StaffRedirect />;
  }

  if (user && user.role !== 'STUDENT') {
    return <div className="p-10 text-center font-bold text-red-500">Kirish taqiqlangan. Bu platforma faqat talabalar uchun.</div>;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected with AppLayout (sidebar/nav) */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/course" element={<CoursePage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/exams" element={<ExamListPage />} />
          <Route path="/exams/:id" element={<ExamDetailPage />} />
          <Route path="/exams/:id/result" element={<ResultPage />} />
          <Route path="/exams/:id/review" element={<ReviewPage />} />
        </Route>

        {/* Protected with ExamLayout (distraction-free) */}
        <Route
          element={
            <ProtectedRoute>
              <ExamLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/exam-session/:id" element={<ExamPage />} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
