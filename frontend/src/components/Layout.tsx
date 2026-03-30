import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, Bell, Settings, Menu } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAdminStore();

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'AD';

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="text"
                placeholder="Qidirish... (⌘K)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600 outline-none focus:bg-white focus:border-primary-300 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-xl hover:bg-slate-100 relative text-slate-400 transition-all">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
              <Settings className="w-[18px] h-[18px]" />
            </button>
            <div className="flex items-center gap-3 pl-3 ml-1 border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-700 leading-none">
                  {user?.first_name || 'Admin'} {user?.last_name || ''}
                </p>
                <p className="text-[10px] font-bold text-slate-400 capitalize mt-0.5">
                  {user?.role || 'Administrator'}
                </p>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white text-xs font-black">
                {user?.image_url ? (
                  <img src={user.image_url} alt="" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  initials
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
