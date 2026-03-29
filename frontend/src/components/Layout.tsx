import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAdminStore } from '../store/useAdminStore';

const Layout: React.FC = () => {
  const { user } = useAdminStore();

  // If no user in state/localStorage, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50 selection:bg-primary-100 selection:text-primary-700">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden relative">
        {/* Top Glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full blur-[120px] -mr-48 -mt-48 opacity-40 pointer-events-none" />
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
