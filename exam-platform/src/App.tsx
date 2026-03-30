import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/UserDashboard';
import ExamPage from './pages/ExamPage';
import ResultPage from './pages/ResultPage';
import ReviewPage from './pages/ReviewPage';
import HistoryPage from './pages/HistoryPage';
import { useAuthStore } from './store/useAuthStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Student Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/exam/:id" element={<ProtectedRoute><ExamPage /></ProtectedRoute>} />
        <Route path="/result/:id" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
        <Route path="/review/:id" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        
        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
