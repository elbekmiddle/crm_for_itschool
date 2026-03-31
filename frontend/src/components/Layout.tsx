import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, Bell, Settings, Menu } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { useNotifications } from '../hooks/useNotifications';
import { cn } from '../lib/utils';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAdminStore();
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();

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
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 animate-in-slide-down">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800">Bildirishnomalar</h3>
                  <button onClick={clearAll} className="text-[10px] font-bold text-red-500 hover:underline">Tozalash</button>
                </div>
                <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        "p-3 rounded-xl cursor-pointer transition-all border border-transparent",
                        !n.read ? "bg-primary-50/50 border-primary-100" : "hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={cn("text-xs font-bold", !n.read ? "text-primary-700" : "text-slate-700")}>{n.title}</p>
                        <span className="text-[8px] text-slate-300 font-bold uppercase">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="py-12 text-center">
                       <Bell className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                       <p className="text-xs text-slate-400 font-medium italic">Sizda yangi xabarlar yo'q</p>
                    </div>
                  )}
                </div>
              </div>
            )}

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
