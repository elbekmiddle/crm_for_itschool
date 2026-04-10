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
      <p className="text-xl font-black text-[#08060d] tracking-tight">O‘qituvchi / xodim</p>
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
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user && (user.role === 'TEACHER' || user.role === 'MANAGER')) {
    return <StaffRedirect />;
  }

  if (user && user.role !== 'STUDENT' && user.role !== 'ADMIN') {
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
