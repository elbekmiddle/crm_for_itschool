import React, { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Menu, X, 
  LayoutDashboard, Users, UserCheck,
  BookOpen, Calendar, CreditCard, PieChart, 
  MessageSquare, Sliders, LogOut, Moon, Sun,
  FileText
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAdminStore } from '../../store/useAdminStore';
import { useConfirm } from '../../context/ConfirmContext';
import { useSocketEvents } from '../../hooks/useSocketEvents';
import { useNotifications } from '../../hooks/useNotifications';
import { resolveMediaUrl } from '../../lib/mediaUrl';

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  MANAGER: 'Menejer',
  TEACHER: "O'qituvchi",
  STUDENT: 'Talaba',
};

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark');
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAdminStore();
  const navigate = useNavigate();
  const confirm = useConfirm();
  useSocketEvents();
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const avatarSrc = resolveMediaUrl(user?.photo_url);

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

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!notifRef.current?.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className={cn("min-h-screen transition-colors duration-500", dark ? "dark" : "")}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-[var(--bg-card)]/98 backdrop-blur-md border-r border-[var(--border)] z-50 transition-all duration-500 shadow-2xl lg:shadow-none",
        sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0 lg:w-20"
      )}>
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--bg)] rounded-2xl flex items-center justify-center shadow-lg border border-[var(--border)]">
              <img src="/images/logo.png" alt="IT School" className="w-8 h-8 object-contain" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="font-black text-[var(--text-h)] text-xl leading-none uppercase tracking-tighter">IT School</p>
                <p className="text-[10px] text-[#aa3bff] dark:text-[#c084fc] font-black mt-1.5 uppercase tracking-widest opacity-80 decoration-2 underline decoration-[#aa3bff]/30">Admin</p>
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

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-[var(--border)] space-y-1.5 bg-[var(--bg-card)]">
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
        <AnimatePresence>
          {notifOpen && (
            <motion.div
              key="admin-notif-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[35] bg-[var(--bg)]/65 backdrop-blur-xl"
              onClick={() => setNotifOpen(false)}
              aria-hidden
            />
          )}
        </AnimatePresence>
        {/* Header — fixed, sidebar bilan bir xil fon */}
        <header
          className={cn(
            'fixed top-0 right-0 z-40 flex items-center justify-between overflow-visible border-b border-[var(--border)] bg-[var(--bg-card)]/95 px-4 py-3 shadow-sm backdrop-blur-md md:px-8',
            sidebarOpen ? 'lg:left-72' : 'lg:left-20',
            'left-0',
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-6">
            <button
              type="button"
              onClick={toggleSidebar}
              className="shrink-0 rounded-2xl bg-[#f4f3ec] p-2.5 shadow-inner transition-all duration-300 hover:text-[#08060d] focus:outline-none dark:bg-[#1f2028] dark:text-[#9ca3af] dark:hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden min-w-0 items-center gap-3 rounded-2xl border border-[#aa3bff]/10 bg-[#aa3bff]/5 px-3 py-2 sm:flex dark:border-[#c084fc]/20 dark:bg-[#c084fc]/10">
              <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#aa3bff] shadow-[0_0_8px_#aa3bff] dark:bg-[#c084fc]" />
              <span className="truncate text-[10px] font-black uppercase leading-none tracking-widest text-[#aa3bff] dark:text-[#c084fc]">
                Cloud Sync Active
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 md:gap-5">
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative rounded-2xl bg-[#f4f3ec] p-2.5 transition-all hover:scale-105 dark:bg-[#1f2028]"
                aria-expanded={notifOpen}
                aria-label="Bildirishnomalar"
              >
                <Bell className="h-5 w-5 text-[#6b6375] dark:text-[#9ca3af]" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full border-2 border-[var(--bg-card)] bg-red-500 px-0.5 text-[9px] font-black text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text)]">Xabarlar</span>
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={() => clearAll()}
                          className="text-[10px] font-bold text-[var(--accent)] hover:underline"
                        >
                          Tozalash
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-8 text-center text-xs text-[var(--text)]/70">Hozircha xabar yo‘q</p>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => markAsRead(n.id)}
                            className={cn(
                              'w-full border-b border-[var(--border)] px-4 py-3 text-left transition-colors hover:bg-[var(--hover-bg)]',
                              !n.read && 'bg-[var(--accent-bg)]/40',
                            )}
                          >
                            <p className="text-xs font-bold text-[var(--text-h)]">{n.title}</p>
                            <p className="mt-0.5 text-[11px] text-[var(--text)]">{n.message}</p>
                            <p className="mt-1 text-[9px] text-[var(--text)]/50">
                              {n.timestamp.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden h-8 w-px bg-[#e5e4e7] dark:bg-[#2e303a] sm:block" />

            <div className="flex items-center gap-3">
              <div className="hidden min-w-0 max-w-[200px] text-left sm:block">
                <p className="truncate text-sm font-black leading-none tracking-tight text-[#08060d] dark:text-[#f3f4f6]">
                  {user?.first_name} {user?.last_name || ''}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#aa3bff] opacity-90 dark:text-[#c084fc]">
                    {roleLabels[user?.role || ''] || user?.role || '—'}
                  </p>
                </div>
              </div>
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-xl dark:border-[#2e303a]">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#aa3bff] to-[#7d1fc7] text-lg font-black text-white">
                    {user?.first_name?.[0] || 'A'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 pt-20 md:p-8 md:pt-24">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
