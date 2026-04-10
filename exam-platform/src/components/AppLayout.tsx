import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, User, BookOpen,
  CalendarCheck, CreditCard, ClipboardList, LogOut,
  Menu, X, Bell, Moon, Sun, ChevronLeft, ChevronRight,
  AlertTriangle, GraduationCap
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useStudentStore } from '../store/useStudentStore';
import { useExamStore } from '../store/useExamStore';
import { getRealtimeSocket } from '../lib/realtimeSocket';
import { cn } from '../lib/utils';
import { useModalOverlayEffects } from '../hooks/useModalOverlayEffects';
const Logo = "/Images/Logo.png";

// ─── Nav items ───────────────────────────────────────────────────────────────
const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Bosh sahifa',   shortcut: '1' },
  { to: '/profile',    icon: User,             label: 'Profilim',     shortcut: '2' },
  { to: '/course',     icon: BookOpen,         label: 'Kursim',       shortcut: '3' },
  { to: '/attendance', icon: CalendarCheck,    label: 'Davomat',      shortcut: '4' },
  { to: '/payments',   icon: CreditCard,       label: "To'lovlar",    shortcut: '5' },
  { to: '/exams',      icon: ClipboardList,    label: 'Imtihonlar',   shortcut: '6' },
];

// ─── Dark mode hook (system preference + manual toggle) ──────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) setDark(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return [dark, setDark] as const;
}

// ─── Logout Confirm Modal ─────────────────────────────────────────────────────
const LogoutModal: React.FC<{ isOpen: boolean; onConfirm: () => void; onCancel: () => void }> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  useModalOverlayEffects(isOpen, { onEscape: onCancel });
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#08060d]/40 backdrop-blur-md" onClick={onCancel} aria-hidden />
      <div className="relative bg-white dark:bg-[#1f2028] rounded-[2.5rem] shadow-2xl border border-[#e5e4e7] dark:border-[#2e303a] w-full max-w-sm p-8 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-center w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-2xl mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-2xl font-black text-[#08060d] dark:text-white text-center mb-2 tracking-tight">
          Chiqmoqchimisiz?
        </h3>
        <p className="text-sm text-[#6b6375] dark:text-[#9ca3af] text-center mb-8 font-medium">
          Siz tizimdan chiqib ketasiz. Barcha faol sessiyalaringiz yakunlanadi.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-sm transition-all shadow-lg shadow-red-500/20 active:scale-95 uppercase tracking-widest"
          >
            Ha, chiqish
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-4 rounded-2xl border-2 border-[#e5e4e7] dark:border-[#2e303a] text-[#6b6375] dark:text-[#9ca3af] font-black text-sm hover:bg-[#f4f3ec] dark:hover:bg-[#16171d] transition-all active:scale-95 uppercase tracking-widest"
          >
            Bekor qilish
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
const AppLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { notifications, fetchNotifications, markNotificationRead, fetchCourse } = useStudentStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useDarkMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useModalOverlayEffects(showNotifications, { onEscape: () => setShowNotifications(false) });

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 120000);
    return () => { clearInterval(interval); };
  }, [fetchNotifications, isAuthenticated]);

  useEffect(() => {
    if (!user?.id) return;
    const s = getRealtimeSocket();
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        debounce = null;
        void fetchNotifications();
        void fetchCourse();
        void useStudentStore.getState().fetchStats();
        void useExamStore.getState().fetchExams();
      }, 400);
    };
    const join = () => {
      s.emit('join_app', { userId: user.id, role: user.role || 'STUDENT' });
    };
    s.on('connect', join);
    if (s.connected) join();
    s.on('dashboard_refresh', scheduleRefresh);
    s.on('exam_updated', scheduleRefresh);
    s.on('exam_approved', scheduleRefresh);
    s.on('exam_published', scheduleRefresh);
    return () => {
      if (debounce) clearTimeout(debounce);
      s.off('connect', join);
      s.off('dashboard_refresh', scheduleRefresh);
      s.off('exam_updated', scheduleRefresh);
      s.off('exam_approved', scheduleRefresh);
      s.off('exam_published', scheduleRefresh);
    };
  }, [user?.id, user?.role, fetchNotifications, fetchCourse]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'S'
    : 'S';

  const confirmLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.altKey) {
        const item = navItems.find(n => n.shortcut === e.key);
        if (item) { e.preventDefault(); navigate(item.to); }
        if (e.key === 'd') { e.preventDefault(); setDark(v => !v); }
        if (e.key === 'b') { e.preventDefault(); setSidebarCollapsed(v => !v); }
        if (e.key === 'q') { e.preventDefault(); setShowLogoutModal(true); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, setDark]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const sidebarW = sidebarCollapsed ? 'w-24' : 'w-72';
  const contentML = sidebarCollapsed ? 'lg:ml-24' : 'lg:ml-72';

  return (
    <div className="min-h-screen bg-[#f4f3ec]/30 dark:bg-[#08060d] flex transition-colors duration-500 font-sans">

      {/* ── Desktop Sidebar ── */}
      <aside className={cn(
        "hidden lg:flex flex-col border-r border-[#e5e4e7] dark:border-[#2e303a] fixed top-0 left-0 h-full z-30 transition-all duration-200 ease-in-out overflow-hidden shadow-2xl shadow-black/5",
        sidebarW
      )}>
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.2] dark:opacity-[0.16]"
            style={{ backgroundImage: "url('/images/uzbek-hero.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-[#f4f3ec]/92 to-white/97 dark:from-[#16171d]/96 dark:via-[#16171d]/90 dark:to-[#16171d]/97" />
        </div>
        <div className="relative z-10 flex h-full min-h-0 flex-col">
        {/* Brand */}
        <div className="p-6 border-b border-[#f4f3ec]/80 dark:border-[#2e303a] flex items-center justify-between min-h-[90px] shrink-0">
          <div className={cn("flex items-center gap-4 transition-all duration-200 overflow-hidden", sidebarCollapsed && "opacity-0 invisible w-0")}>
            <div className="w-14 h-14 bg-white/90 dark:bg-[#1f2028]/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl p-3 shrink-0 transform transition-transform duration-200 hover:rotate-12">
              <img src={Logo} alt="IT Park" className="w-full h-full object-contain" />
            </div>
            <div className="overflow-hidden">
               <p className="font-black text-[#08060d] dark:text-white text-base leading-none tracking-tighter uppercase">IT Academy</p>
               <p className="text-[10px] text-[#aa3bff] font-black mt-1.5 uppercase tracking-[0.3em]">Student Hub</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarCollapsed(v => !v)}
            className="w-10 h-10 rounded-xl bg-[#f4f3ec]/90 dark:bg-[#1f2028]/90 backdrop-blur-sm flex items-center justify-center text-[#6b6375] hover:text-[#aa3bff] hover:bg-[#aa3bff]/10 transition-all duration-200 shrink-0 shadow-inner"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-2 mt-2 overflow-y-auto no-scrollbar">
          {navItems.map(({ to, icon: Icon, label, shortcut }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-black text-sm transition-all duration-200 group relative",
                isActive
                  ? "bg-[#aa3bff] text-white shadow-xl shadow-[#aa3bff]/20 translate-x-1"
                  : "text-[#6b6375] dark:text-[#9ca3af] hover:bg-[#f4f3ec]/80 dark:hover:bg-[#1f2028]/80 hover:text-[#08060d] dark:hover:text-white",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", sidebarCollapsed ? "w-6 h-6" : "")} />
              {!sidebarCollapsed && <span className="flex-1 tracking-tight">{label}</span>}
              {!sidebarCollapsed && (
                <span className="text-[10px] font-black opacity-30 group-hover:opacity-60">Alt+{shortcut}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#f4f3ec] dark:border-[#2e303a] space-y-2 shrink-0">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-black text-sm transition-all duration-200 w-full text-[#6b6375] dark:text-[#9ca3af] hover:bg-[#f4f3ec]/80 dark:hover:bg-[#1f2028]/80 relative group",
              sidebarCollapsed && "justify-center px-0"
            )}
          >
            <Bell className={cn("w-5 h-5 shrink-0 group-hover:rotate-12", sidebarCollapsed ? "w-6 h-6" : "")} />
            {!sidebarCollapsed && <span className="flex-1 tracking-tight">Xabarlar</span>}
            {unreadCount > 0 && (
              <span className={cn(
                "absolute bg-red-500 rounded-full border-2 border-white dark:border-[#16171d] shadow-lg animate-pulse",
                sidebarCollapsed ? "top-3 right-5 w-3 h-3" : "right-4 w-2.5 h-2.5"
              )} />
            )}
          </button>

          <button
            onClick={() => setDark(v => !v)}
            className={cn(
              "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-black text-sm transition-all duration-200 w-full text-[#6b6375] dark:text-[#9ca3af] hover:bg-[#f4f3ec]/80 dark:hover:bg-[#1f2028]/80 group",
              sidebarCollapsed && "justify-center px-0"
            )}
          >
            {dark ? <Sun className="w-5 h-5 text-amber-500 shrink-0 group-hover:rotate-90 transition-transform duration-200" /> : <Moon className="w-5 h-5 text-[#aa3bff] shrink-0 group-hover:-rotate-12 transition-transform duration-200" />}
            {!sidebarCollapsed && <span className="flex-1 tracking-tight">{dark ? "Yorug' rejim" : 'Tungi rejim'}</span>}
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className={cn(
              "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-black text-sm transition-all duration-200 w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 group",
              sidebarCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className={cn("w-5 h-5 shrink-0 group-hover:-translate-x-1", sidebarCollapsed ? "w-6 h-6" : "")} />
            {!sidebarCollapsed && <span className="flex-1 tracking-tight uppercase tracking-widest text-[10px]">Chiqish</span>}
          </button>
        </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-500 flex flex-col relative",
        contentML
      )}>
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-20 bg-white/70 dark:bg-[#08060d]/70 backdrop-blur-xl border-b border-[#e5e4e7] dark:border-[#2e303a] px-8 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button
                 onClick={() => setMobileOpen(true)}
                 className="lg:hidden w-12 h-12 flex items-center justify-center rounded-2xl bg-[#f4f3ec] dark:bg-[#1f2028] text-[#6b6375] shadow-sm transform active:scale-90 transition-transform"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden lg:flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                 <h2 className="text-[10px] font-black text-[#6b6375] uppercase tracking-[0.4em] opacity-60">Nexus Engine Onlayn</h2>
              </div>
           </div>

           <div className="flex items-center gap-6">
              <button 
                onClick={() => navigate('/profile')}
                className="group flex items-center gap-4 p-1.5 rounded-[1.5rem] hover:bg-[#f4f3ec] dark:hover:bg-[#1f2028] transition-all"
              >
                 <div className="text-right hidden md:block">
                    <p className="text-sm font-black text-[#08060d] dark:text-white leading-none mb-1">{user?.first_name}</p>
                    <p className="text-[9px] font-black text-[#aa3bff] uppercase tracking-widest opacity-60">Student Rank</p>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#aa3bff] to-[#c084fc] flex items-center justify-center text-white text-sm font-black shadow-xl shadow-[#aa3bff]/20 transform transition-transform group-hover:scale-105">
                   {user?.image_url ? <img src={user.image_url} className="w-full h-full rounded-2xl object-cover" alt="" /> : initials}
                 </div>
              </button>
           </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-6 lg:p-10 pb-32 lg:pb-12 overflow-y-auto no-scrollbar">
           <Outlet />
        </div>
      </main>

      {/* ── Mobile Sidebar Drawer ── */}
      <AnimatePresence>
         {mobileOpen && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="lg:hidden fixed inset-0 z-[60] flex"
            >
               <div className="absolute inset-0 bg-[#08060d]/60 backdrop-blur-md" onClick={() => setMobileOpen(false)} />
               <motion.div 
                  initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
                  className="relative w-80 h-full flex flex-col overflow-hidden shadow-2xl"
               >
                  <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-[0.18] dark:opacity-[0.14]"
                      style={{ backgroundImage: "url('/images/uzbek-hero.png')" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/96 via-[#f4f3ec]/93 to-white/98 dark:from-[#16171d]/97 dark:via-[#16171d]/92 dark:to-[#16171d]/98" />
                  </div>
                  <div className="relative z-10 flex h-full min-h-0 flex-col bg-transparent">
                  <div className="p-6 border-b border-[#f4f3ec] dark:border-[#2e303a] flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#aa3bff]/10 rounded-xl flex items-center justify-center">
                           <GraduationCap className="w-6 h-6 text-[#aa3bff]" />
                        </div>
                        <div>
                           <p className="font-black text-[#08060d] dark:text-white text-sm uppercase">Scholar Flow</p>
                           <p className="text-[9px] text-[#6b6375] font-black uppercase tracking-widest">Student Portal</p>
                        </div>
                     </div>
                     <button onClick={() => setMobileOpen(false)} className="w-10 h-10 bg-[#f4f3ec] dark:bg-[#1f2028] rounded-xl flex items-center justify-center">
                        <X className="w-5 h-5 text-[#6b6375]" />
                     </button>
                  </div>

                  <nav className="flex-1 p-4 space-y-2 mt-4">
                     {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to}
                           className={({ isActive }) => cn(
                              "flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-sm transition-all",
                              isActive
                                 ? "bg-[#aa3bff] text-white shadow-xl shadow-[#aa3bff]/20"
                                 : "text-[#6b6375] dark:text-[#9ca3af] hover:bg-[#f4f3ec] dark:hover:bg-[#1f2028]"
                           )}
                        >
                           <Icon className="w-6 h-6" /> {label}
                        </NavLink>
                     ))}
                  </nav>

                  <div className="p-4 border-t border-[#f4f3ec] dark:border-[#2e303a] space-y-3 pb-8">
                     <button onClick={() => { setDark(v => !v); }} className="flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-sm w-full text-[#6b6375] dark:text-[#9ca3af] hover:bg-[#f4f3ec] dark:hover:bg-[#1f2028]">
                        {dark ? <Sun className="w-6 h-6 text-amber-500" /> : <Moon className="w-6 h-6 text-[#aa3bff]" />}
                        {dark ? "Yorug' rejim" : 'Tungi rejim'}
                     </button>
                     <button onClick={() => { setMobileOpen(false); setShowLogoutModal(true); }} className="flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-sm w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
                        <LogOut className="w-6 h-6" /> Chiqish Tizimidan
                     </button>
                  </div>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#08060d]/80 backdrop-blur-2xl border-t border-[#e5e4e7] dark:border-[#2e303a] z-50 flex items-center justify-around px-2 py-3 shadow-2xl safe-area-bottom">
        {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1.5 transition-all duration-300",
              isActive ? "text-[#aa3bff] scale-110" : "text-[#6b6375] dark:text-[#9ca3af] opacity-60"
            )}
          >
            <div className={cn(
               "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
               location.pathname === to ? "bg-[#aa3bff]/10 shadow-inner" : ""
            )}>
              <Icon className={cn(location.pathname === to ? "w-6 h-6" : "w-5 h-5")} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Notifications Modal */}
      {showNotifications &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-[#08060d]/60 backdrop-blur-md"
              onClick={() => setShowNotifications(false)}
              aria-hidden
            />
          <div className="relative w-full max-w-xl bg-white dark:bg-[#1f2028] border border-[#e5e4e7] dark:border-[#2e303a] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-gradient-to-br from-[#aa3bff] to-[#9329e6] flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                  <Bell className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-2xl tracking-tight">Bildirishnomalar</h3>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{unreadCount} ta yangi xabar</p>
                </div>
              </div>
              <button onClick={() => setShowNotifications(false)} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-3 max-h-[60vh] overflow-y-auto no-scrollbar bg-[#f4f3ec]/30 dark:bg-[#16171d]/30">
              {notifications.length === 0 ? (
                <div className="py-24 text-center">
                  <div className="w-20 h-20 bg-[#f4f3ec] dark:bg-[#1f2028] rounded-[2rem] mx-auto mb-6 flex items-center justify-center">
                    <Bell className="w-10 h-10 text-[#6b6375] opacity-20" />
                  </div>
                  <p className="text-[#6b6375] font-black text-sm uppercase tracking-widest opacity-40">Hozircha xabarlar yo'q</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => { markNotificationRead(n.id); }}
                      className={cn(
                         "p-6 rounded-[2rem] border transition-all duration-300 cursor-pointer group",
                         !n.is_read 
                           ? "bg-white dark:bg-[#1f2028] border-[#aa3bff]/30 shadow-xl shadow-[#aa3bff]/5" 
                           : "bg-[#f4f3ec]/50 dark:bg-[#1f2028]/30 border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className={cn("font-black text-base tracking-tight", !n.is_read ? "text-[#aa3bff]" : "text-[#08060d] dark:text-white")}>{n.title}</p>
                        {!n.is_read && <div className="w-3 h-3 bg-[#aa3bff] rounded-full mt-1.5 shrink-0 animate-pulse shadow-[0_0_8px_#aa3bff]" />}
                      </div>
                      <p className="text-sm font-medium text-[#6b6375] dark:text-[#9ca3af] leading-relaxed mb-4">{n.message}</p>
                      <div className="flex items-center justify-between border-t border-[#f4f3ec] dark:border-[#2e303a] pt-4">
                         <span className="text-[10px] font-black text-[#6b6375] dark:text-[#9ca3af] uppercase tracking-widest opacity-40">
                            {new Date(n.created_at).toLocaleDateString('uz-UZ')} &bull; {new Date(n.created_at).toLocaleTimeString('uz-UZ').slice(0,5)}
                         </span>
                         {!n.is_read && <span className="text-[9px] font-black text-[#aa3bff] uppercase tracking-widest">Yangi</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
          document.body
        )}

      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

    </div>
  );
};

export default AppLayout;

