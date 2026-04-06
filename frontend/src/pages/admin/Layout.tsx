import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Bell, Menu, X, 
  LayoutDashboard, Users, UserCheck,
  BookOpen, Calendar, CreditCard, PieChart, 
  MessageSquare, Sliders, LogOut, Moon, Sun,
  FileText, Briefcase
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAdminStore } from '../../store/useAdminStore';
import { useConfirm } from '../../context/ConfirmContext';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark');
  const { user, logout } = useAdminStore();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleDark = () => {
    const newDark = !dark;
    setDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    if (newDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Foydalanuvchilar' },
    { to: '/admin/students', icon: UserCheck, label: 'Talabalar' },
    { to: '/admin/courses', icon: BookOpen, label: 'Kurslar' },
    { to: '/admin/groups', icon: Calendar, label: 'Guruhlar' },
    { to: '/admin/payments', icon: CreditCard, label: "To'lovlar" },
    { to: '/admin/analytics', icon: PieChart, label: 'Analitika' },
    { to: '/admin/leads', icon: MessageSquare, label: 'Lidlar' },
    { to: '/admin/blog', icon: FileText, label: 'Blog' },
    { to: '/admin/vacancies', icon: Briefcase, label: 'Vakansiyalar' },
    { to: '/admin/settings', icon: Sliders, label: 'Sozlamalar' },
  ];

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
    <div className={cn("min-h-screen transition-colors duration-500", dark ? "dark bg-[#16171d]" : "bg-white")}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-white dark:bg-[#16171d] border-r border-[#e5e4e7] dark:border-[#2e303a] z-50 transition-all duration-500 shadow-2xl lg:shadow-none",
        sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0 lg:w-20"
      )}>
        <div className="p-6 border-b border-[#e5e4e7] dark:border-[#2e303a] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-[#1f2028] rounded-2xl flex items-center justify-center shadow-lg border border-[#e5e4e7] dark:border-[#2e303a]">
              <img src="/images/logo.png" alt="Scholar Flow" className="w-8 h-8 object-contain" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="font-black text-[#08060d] dark:text-[#f3f4f6] text-xl leading-none uppercase tracking-tighter">CRM Admin</p>
                <p className="text-[10px] text-[#aa3bff] dark:text-[#c084fc] font-black mt-1.5 uppercase tracking-widest opacity-80 decoration-2 underline decoration-[#aa3bff]/30">Scholar Flow</p>
              </div>
            )}
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-160px)] no-scrollbar mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 relative group overflow-hidden",
                isActive 
                  ? "bg-[#aa3bff] dark:bg-[#c084fc] text-white shadow-xl shadow-[#aa3bff]/30 dark:shadow-[#c084fc]/20" 
                  : "text-[#6b6375] dark:text-[#9ca3af] hover:bg-[#f4f3ec] dark:hover:bg-[#1f2028] hover:text-[#08060d] dark:hover:text-white"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                  {(sidebarOpen || window.innerWidth < 1024) && <span className="tracking-tight">{item.label}</span>}
                  {!sidebarOpen && window.innerWidth >= 1024 && (
                    <div className="absolute left-full ml-6 px-4 py-2 bg-[#08060d] text-white text-[11px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none translate-x-[-10px] group-hover:translate-x-0 shadow-2xl">
                      {item.label}
                    </div>
                  )}
                  {isActive && sidebarOpen && (
                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-glow animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-[#e5e4e7] dark:border-[#2e303a] space-y-1.5 bg-white dark:bg-[#16171d]">
          <button 
            onClick={toggleDark}
            className="flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm w-full text-[#6b6375] dark:text-[#9ca3af] hover:bg-[#f4f3ec] dark:hover:bg-[#1f2028] transition-all duration-300"
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {sidebarOpen && <span>{dark ? 'Yorug\' rejim' : 'Tungi rejim'}</span>}
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-500 min-h-screen",
        sidebarOpen ? "pl-72" : "pl-0 lg:pl-20"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#16171d]/80 backdrop-blur-2xl border-b border-[#e5e4e7] dark:border-[#2e303a] px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleSidebar}
              className="p-2.5 rounded-2xl bg-[#f4f3ec] dark:bg-[#1f2028] text-[#6b6375] dark:text-[#9ca3af] hover:text-[#08060d] dark:hover:text-white transition-all duration-300 focus:outline-none shadow-inner"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-[#aa3bff]/5 dark:bg-[#c084fc]/10 border border-[#aa3bff]/10 dark:border-[#c084fc]/20 rounded-2xl">
              <div className="w-2 h-2 bg-[#aa3bff] dark:bg-[#c084fc] rounded-full animate-pulse shadow-[0_0_8px_#aa3bff]" />
              <span className="text-[10px] font-black text-[#aa3bff] dark:text-[#c084fc] uppercase tracking-widest leading-none">Cloud Sync Active</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group p-2.5 rounded-2xl bg-[#f4f3ec] dark:bg-[#1f2028] cursor-pointer transition-all duration-300 hover:scale-110">
              <Bell className="w-5 h-5 text-[#6b6375] dark:text-[#9ca3af] transition-colors group-hover:text-[#aa3bff]" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#16171d] shadow-sm animate-bounce" />
            </div>
            
            <div className="w-px h-8 bg-[#e5e4e7] dark:bg-[#2e303a]" />
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-[#08060d] dark:text-[#f3f4f6] leading-none mb-1.5 tracking-tight">
                  {user?.first_name} {user?.last_name || ''}
                </p>
                <div className="flex items-center justify-end gap-1.5">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                   <p className="text-[10px] font-black text-[#aa3bff] dark:text-[#c084fc] uppercase tracking-widest opacity-80">Super Admin</p>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#aa3bff] to-[#7d1fc7] rounded-2xl flex items-center justify-center text-white font-black text-xl border-2 border-white dark:border-[#2e303a] shadow-xl transform transition-transform duration-300 hover:rotate-6">
                {user?.first_name?.[0] || 'A'}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
