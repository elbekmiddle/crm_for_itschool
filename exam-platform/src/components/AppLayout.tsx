import React, { useEffect, useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, User, BookOpen,
  CalendarCheck, CreditCard, ClipboardList, LogOut,
  Menu, X, Bell, Moon, Sun, ChevronLeft, ChevronRight,
  AlertTriangle, GraduationCap
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useStudentStore } from '../store/useStudentStore';
const Logo = "/Images/Logo.png";
// ─── Nav items ───────────────────────────────────────────────────────────────
const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',    shortcut: '1' },
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

  // Listen to system changes
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
const LogoutModal: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-black/20 border border-slate-100 dark:border-slate-800 w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-center w-14 h-14 bg-red-50 dark:bg-red-950/40 rounded-2xl mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white text-center mb-1">
          Chiqmoqchimisiz?
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
          Siz tizimdan chiqib ketasiz. Barcha saqlangan ma'lumotlar saqlanib qoladi.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors shadow-lg shadow-red-500/25"
          >
            Ha, chiqish
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-3">ESC — bekor qilish</p>
      </div>
    </div>
  );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
const AppLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { notifications, fetchNotifications, markNotificationRead } = useStudentStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useDarkMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 1500);
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'S'
    : 'S';

  const confirmLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only trigger when not in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      // Alt + 1–6 → navigate to page
      if (e.altKey) {
        const item = navItems.find(n => n.shortcut === e.key);
        if (item) { e.preventDefault(); navigate(item.to); }
        // Alt + D → toggle dark mode
        if (e.key === 'd') { e.preventDefault(); setDark(v => !v); }
        // Alt + B → toggle sidebar collapse
        if (e.key === 'b') { e.preventDefault(); setSidebarCollapsed(v => !v); }
        // Alt + Q → show logout modal
        if (e.key === 'q') { e.preventDefault(); setShowLogoutModal(true); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, setDark]);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const sidebarW = sidebarCollapsed ? 'w-[72px]' : 'w-64';
  const contentML = sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">

      {/* ── Desktop Sidebar ── */}
      <aside className={`hidden lg:flex ${sidebarW} flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 fixed top-0 left-0 h-full z-30 transition-all duration-300 ease-in-out overflow-hidden`}>

        {/* Brand */}
        <div className={`p-4 border-b border-slate-50 dark:border-slate-800 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} min-h-[70px] shrink-0`}>
          <div className={`flex items-center gap-3 overflow-hidden ${sidebarCollapsed ? 'hidden' : ''}`}>
            <div className="w-15 h-15 rounded-xl flex items-center justify-center shadow-sm p-2.5 shrink-0">
              <img 
                src={Logo}
                alt="IT Park" 
                className="w-full h-full object-contain"
              />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="font-black text-slate-800 dark:text-white text-sm leading-none whitespace-nowrap uppercase tracking-tighter">IT Academy</p>
                <p className="text-[10px] text-indigo-500 font-bold mt-0.5 uppercase tracking-[0.2em] opacity-80">Exam Portal</p>
              </div>
            )}
          </div>

          {/* Icon only when collapsed */}
          {sidebarCollapsed && (
            // <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm p-1.5 shrink-0">
            //    <img 
            //      src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Logo_IT_Park_Uzbekistan.svg/3840px-Logo_IT_Park_Uzbekistan.svg.png" 
            //      alt="IT Park" 
            //      className="w-full h-full object-contain"
            //    />
            // </div>
            <div></div>
          )}

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(v => !v)}
            title="Alt+B — Yopish/ochish"
            className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all duration-300 shrink-0 shadow-sm"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>


        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 mt-2 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, shortcut }) => (
            <NavLink
              key={to} to={to}
              title={sidebarCollapsed ? `${label} (Alt+${shortcut})` : `Alt+${shortcut}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                } ${sidebarCollapsed ? 'justify-center' : ''}`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && (
                <span className="flex-1">{label}</span>
              )}
              {!sidebarCollapsed && (
                <span className="text-[9px] font-mono text-slate-300 dark:text-slate-600">Alt+{shortcut}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-slate-50 dark:border-slate-800 space-y-1 shrink-0">
          
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              title="Xabarlar"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all w-full text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 relative ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span className="flex-1">Xabarlar</span>}
              {unreadCount > 0 && (
                <span className={`absolute ${sidebarCollapsed ? 'top-1 right-1' : 'right-3'} w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm`} />
              )}
            </button>

            {showNotifications && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowNotifications(false)} />
                <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Bell className="w-5 h-5 font-bold" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg">Bildirishnomalar</h3>
                        <p className="text-indigo-100 text-[11px] font-medium tracking-wide uppercase opacity-80">{unreadCount} ta yangi xabar</p>
                      </div>
                    </div>
                    <button onClick={() => setShowNotifications(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-2 max-h-[60vh] overflow-y-auto no-scrollbar bg-slate-50 dark:bg-slate-950/20">
                    {notifications.length === 0 ? (
                      <div className="py-16 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl mx-auto mb-4 flex items-center justify-center">
                          <Bell className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-slate-400 text-sm font-semibold">Hozircha xabarlar yo'q</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => { markNotificationRead(n.id); }}
                            className={`p-4 rounded-[1.5rem] bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800/40 transition-all duration-200 ${!n.is_read ? 'shadow-sm ring-1 ring-indigo-500/10' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <p className={`font-black text-sm ${!n.is_read ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{n.title}</p>
                              {!n.is_read && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0 animate-pulse" />}
                            </div>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2 break-words">{n.message}</p>
                            <p className="text-[10px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-wider tabular-nums">
                              {new Date(n.created_at).toLocaleDateString('uz-UZ')} &bull; {new Date(n.created_at).toLocaleTimeString('uz-UZ').slice(0,5)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(v => !v)}
            title="Alt+D — Qorang'i/Yorug' rejim"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all w-full text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            {dark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            {!sidebarCollapsed && <span className="flex-1">{dark ? 'Yorug\' rejim' : 'Tungi rejim'}</span>}
            {!sidebarCollapsed && <span className="text-[9px] font-mono text-slate-300 dark:text-slate-600">Alt+D</span>}
          </button>

          {/* Logout */}
          <button
            onClick={() => setShowLogoutModal(true)}
            title="Alt+Q — Chiqish"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span className="flex-1">Chiqish</span>}
            {!sidebarCollapsed && <span className="text-[9px] font-mono text-red-300 dark:text-red-800">Alt+Q</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header - Removed as requested, using bottom nav */}

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="font-black text-slate-800 dark:text-white text-sm">IT School</span>
              </div>
              <button onClick={() => setMobileOpen(false)}
                className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* User card mobile */}
            <div className="p-3 mx-3 mt-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white text-sm font-black shadow">
                {user?.image_url
                  ? <img src={user.image_url} className="w-full h-full rounded-xl object-cover" alt="" />
                  : initials}
              </div>
            </div>

            <nav className="flex-1 p-3 space-y-1 mt-2 overflow-y-auto">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" /> {label}
                </NavLink>
              ))}
            </nav>

            <div className="p-3 border-t border-slate-50 dark:border-slate-800 space-y-1">
              <button onClick={() => { setDark(v => !v); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm w-full text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {dark ? "Yorug' rejim" : 'Tungi rejim'}
              </button>
              <button onClick={() => { setMobileOpen(false); setShowLogoutModal(true); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                <LogOut className="w-4 h-4" /> Chiqish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className={`flex-1 ${contentML} min-h-screen bg-slate-50/50 dark:bg-slate-950/20 transition-colors duration-300 flex flex-col`}>
        
        {/* ── Premium Top Bar ── */}
        <header className="sticky top-0 z-40 h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/60 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
               onClick={() => setMobileOpen(true)}
               className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:block">
               <h1 className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase opacity-80">Mission Control</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Real-time indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-800/40 text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mr-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Tizim Onlayn
            </div>

            {/* Quick Dark Toggle (Premium shadcn style) */}
            <button
              type="button"
              onClick={() => setDark(v => !v)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:ring-2 hover:ring-primary-500/20 dark:hover:ring-primary-400/20 transition-all duration-300 group shadow-sm"
            >
              {dark ? (
                <Sun className="w-5 h-5 group-hover:rotate-180 transition-all duration-500 text-amber-500" />
              ) : (
                <Moon className="w-5 h-5 group-hover:-rotate-12 transition-all duration-500 text-indigo-400" />
              )}
            </button>

            {/* User Avatar Shortcut */}
            <button 
              onClick={() => navigate('/profile')}
              className="ml-2 flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-primary-500/20">
                {user?.image_url ? <img src={user.image_url} className="w-full h-full rounded-lg object-cover" alt="" /> : initials}
              </div>
            </button>
          </div>
        </header>

        {/* Content body */}
        <div className="flex-1 p-4 lg:p-8 pb-32 lg:pb-8 overflow-y-auto overflow-x-hidden no-scrollbar">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-30 flex items-center justify-around px-1 py-1 shadow-2xl safe-area-bottom">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-1 relative transition-all duration-300 ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 scale-105' : 'text-slate-400 dark:text-slate-500'
              }`
            }
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${location.pathname === to ? 'bg-indigo-50 dark:bg-indigo-900/40 shadow-sm' : ''}`}>
              <Icon className={`${location.pathname === to ? 'w-6 h-6' : 'w-5 h-5'}`} />
            </div>
            <span className={`text-[8px] font-black uppercase tracking-tighter text-center whitespace-nowrap ${location.pathname === to ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
            {location.pathname === to && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-indigo-600 rounded-b-full shadow-lg shadow-indigo-500/50" />
            )}
          </NavLink>
        ))}
        {/* Logout in mobile bottom nav */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-red-500 hover:text-red-600 transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-tighter text-center">Chiqish</span>
        </button>
      </nav>

      {/* ── Logout confirm modal ── */}
      {showLogoutModal && (
        <LogoutModal
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

    </div>
  );
};

export default AppLayout;
