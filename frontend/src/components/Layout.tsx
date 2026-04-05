import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, Bell, Settings, Menu } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { useNotifications } from '../hooks/useNotifications';
import { useSocketEvents } from '../hooks/useSocketEvents';
import { cn } from '../lib/utils';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const { user } = useAdminStore();
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();

  React.useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useSocketEvents(user?.id);

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

          <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-xl hover:bg-slate-100 relative text-slate-400 transition-all"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-black">{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowNotifications(false)} />
                <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 bg-gradient-to-br from-primary-600 to-indigo-700 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Bell className="w-5 h-5 font-bold" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg">Bildirishnomalar</h3>
                        <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">{unreadCount} ta yangi xabar</p>
                      </div>
                    </div>
                    <button onClick={() => setShowNotifications(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors">
                      <X className="w-5 h-5 font-black" />
                    </button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto p-4 space-y-2 no-scrollbar bg-slate-50/50">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => markAsRead(n.id)}
                        className={cn(
                          "p-4 rounded-[1.5rem] bg-white border border-slate-100 cursor-pointer shadow-sm transition-all hover:border-primary-200",
                          !n.read ? "ring-1 ring-primary-500/10" : ""
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className={cn("text-sm font-black", !n.read ? "text-primary-700" : "text-slate-700")}>{n.title}</p>
                          {!n.read && <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />}
                        </div>
                        <p className="text-[12px] text-slate-500 leading-relaxed mb-2">{n.message}</p>
                        <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter">
                          {new Date(n.timestamp).toLocaleString('uz-UZ')}
                        </p>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="py-20 text-center">
                         <div className="w-16 h-16 bg-slate-100 rounded-3xl mx-auto mb-4 flex items-center justify-center">
                           <Bell className="w-8 h-8 text-slate-300" />
                         </div>
                         <p className="text-xs text-slate-400 font-bold italic tracking-wide">Xabarlar yo'q</p>
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-slate-100 bg-white">
                      <button onClick={clearAll} className="w-full py-2 text-[11px] font-black uppercase text-red-500 tracking-widest hover:bg-red-50 rounded-xl transition-colors">Hammasini tozalash</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
              <Settings className="w-[18px] h-[18px]" />
            </button>
            <div className="flex items-center gap-3 pl-3 ml-1 border-l border-slate-100">
              <div className="text-right">
                <p className="text-sm font-black text-slate-700 leading-none">
                  {user?.first_name || 'Admin'} {user?.last_name || ''}
                </p>
                <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-0.5">
                  {user?.role || 'Administrator'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main>
          <Outlet />
        </main>
        {/* App Loader */}
        {isAppLoading && (
          <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center">
            <div className="w-20 h-20 relative">
              <div className="absolute inset-0 border-4 border-primary-50 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin" />
              <GraduationCap className="absolute inset-0 m-auto w-8 h-8 text-primary-600" />
            </div>
            <p className="mt-6 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">IT School CRM yuklanmoqda...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;
