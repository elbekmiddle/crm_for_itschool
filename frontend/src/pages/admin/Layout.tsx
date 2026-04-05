import React, { useState } from 'react';
import { Outlet, useParams, NavLink, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, Settings, Menu, X, GraduationCap, 
  LayoutDashboard, Users, UserCheck, UserPlus, 
  BookOpen, Calendar, CreditCard, PieChart, 
  MessageSquare, Sliders, LogOut, Moon, Sun, Search as SearchIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAdminStore } from '../../store/useAdminStore';
import { useConfirm } from '../../context/ConfirmContext';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark');
  const { user, logout } = useAdminStore();
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleDark = () => {
    const newDark = !dark;
    setDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    if (newDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const navItems = [
    { to: `/admin/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
    { to: `/admin/users`, icon: Users, label: 'Foydalanuvchilar' },
    { to: `/admin/students`, icon: UserCheck, label: 'Talabalar' },
    { to: `/admin/courses`, icon: BookOpen, label: 'Kurslar' },
    { to: `/admin/groups`, icon: Calendar, label: 'Guruhlar' },
    { to: `/admin/payments`, icon: CreditCard, label: "To'lovlar" },
    { to: `/admin/analytics`, icon: PieChart, label: 'Analitika' },
    { to: `/admin/leads`, icon: MessageSquare, label: 'Lidlar' },
    { to: `/admin/settings`, icon: Sliders, label: 'Sozlamalar' },
  ];

  const { confirm } = useConfirm();

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Chiqish?",
      message: "Tizimdan chiqmoqchimisiz?",
      confirmText: "HA",
      type: 'warning'
    });
    if (ok) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-300", dark ? "dark bg-slate-950" : "bg-slate-50")}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-50 transition-all duration-300 shadow-xl lg:shadow-none",
        sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-20"
      )}>
        <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <img src="/images/logo.png" alt="Scholar Flow" className="w-full h-full object-contain" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="font-black text-slate-900 dark:text-white leading-none uppercase tracking-tighter">Admin Panel</p>
                <p className="text-[10px] text-primary-500 font-bold mt-1 uppercase tracking-widest opacity-60">System Root</p>
              </div>
            )}
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all relative group",
                isActive 
                  ? "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {(sidebarOpen || window.innerWidth < 1024) && <span>{item.label}</span>}
              {!sidebarOpen && window.innerWidth >= 1024 && (
                 <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {item.label}
                 </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-3 border-t border-slate-50 dark:border-slate-800 space-y-1 bg-white dark:bg-slate-900">
          <button 
            onClick={toggleDark}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm w-full text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {sidebarOpen && <span>{dark ? 'Yorug\' rejim' : 'Tungi rejim'}</span>}
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300 min-h-screen",
        sidebarOpen ? "pl-64" : "pl-0 lg:pl-20"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/40 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Server Onlayn</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Bell className="w-5 h-5 text-slate-400 group-hover:text-primary-500 cursor-pointer transition-colors" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div className="w-px h-6 bg-slate-100 dark:bg-slate-800" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 dark:text-white leading-none">
                  {user?.first_name} {user?.last_name || ''}
                </p>
                <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mt-1">IT School Admin</p>
              </div>
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-950 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold border-2 border-primary-50 dark:border-primary-900 shadow-sm">
                {user?.first_name?.[0] || 'A'}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
