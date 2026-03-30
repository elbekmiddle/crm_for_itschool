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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
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
