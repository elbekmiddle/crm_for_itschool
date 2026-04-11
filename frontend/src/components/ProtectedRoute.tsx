import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminStore } from '../store/useAdminStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, fetchMe, isInitialized } = useAdminStore();
  const location = useLocation();

  useEffect(() => {
    if (!isInitialized) {
      fetchMe();
    }
  }, [isInitialized, fetchMe]);

  // While checking session, show a loader
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse mt-2">
          Sessiya tiklanmoqda...
        </span>
      </div>
    );
  }

  // If session checked and no user, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role === 'STUDENT') {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified, check if user has required role
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
