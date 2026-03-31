import React, { useEffect, useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap, LayoutDashboard, User, BookOpen,
  CalendarCheck, CreditCard, ClipboardList, LogOut,
  Menu, X, Bell, Moon, Sun, ChevronLeft, ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useStudentStore } from '../store/useStudentStore';

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

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // refresh every minute
    return () => clearInterval(interval);
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
        <div className={`p-4 border-b border-slate-50 dark:border-slate-800 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} min-h-[65px] shrink-0`}>
          <div className={`flex items-center gap-3 overflow-hidden ${sidebarCollapsed ? 'hidden' : ''}`}>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow shadow-indigo-200 dark:shadow-indigo-900 shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="font-black text-slate-800 dark:text-white text-sm leading-none whitespace-nowrap">IT School</p>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">Exam Portal</p>
              </div>
            )}
          </div>

          {/* Icon only when collapsed */}
          {sidebarCollapsed && (
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow shadow-indigo-200 dark:shadow-indigo-900 shrink-0">
               <GraduationCap className="w-5 h-5 text-white" />
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(v => !v)}
            title="Alt+B — Yopish/ochish"
            className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors shrink-0"
          >
            {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* User card */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-3 shrink-0">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white text-sm font-black shadow shrink-0">
                {user?.image_url
                  ? <img src={user.image_url} className="w-full h-full rounded-xl object-cover" alt="" />
                  : initials}
              </div>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="px-3 pt-3 shrink-0">
            <div title={`${user?.first_name} ${user?.last_name}`}
              className="w-10 h-10 mx-auto bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white text-xs font-black shadow">
              {user?.image_url
                ? <img src={user.image_url} className="w-full h-full rounded-xl object-cover" alt="" />
                : initials}
            </div>
          </div>
        )}

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

            {showNotifications && !mobileOpen && (
              <div className={`absolute ${sidebarCollapsed ? 'left-full bottom-0 ml-2' : 'bottom-full left-0 mb-2'} w-72 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                <div className="p-3 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-sm">Xabarlar</span>
                  {unreadCount > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{unreadCount} ta yangi</span>}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs text-balance">Hozircha xabarlar yo'q</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => { markNotificationRead(n.id); }}
                        className={`p-3 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!n.is_read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                      >
                        <p className="font-bold text-xs text-slate-800 dark:text-white mb-0.5">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">{n.message}</p>
                        <p className="text-[9px] text-slate-300 dark:text-slate-600 mt-1">{new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString().slice(0,5)}</p>
                      </div>
                    ))
                  )}
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

      {/* ── Mobile Header ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-slate-800 dark:text-white text-sm">IT School</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Dark mode */}
          <button onClick={() => setDark(v => !v)}
            className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {/* Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-3 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-sm">Xabarlar</span>
                  {unreadCount > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{unreadCount} ta yangi</span>}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">Xabarlar yo'q</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => { markNotificationRead(n.id); }}
                        className={`p-3 border-b border-slate-50 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!n.is_read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                      >
                        <p className="font-bold text-xs text-slate-800 dark:text-white mb-1">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{n.message}</p>
                        <p className="text-[9px] text-slate-300 dark:text-slate-600 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Menu */}
          <button onClick={() => setMobileOpen(v => !v)}
            className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400">
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

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
      <main className={`flex-1 ${contentML} min-h-screen transition-all duration-300`}>
        <div className="pt-16 lg:pt-0 pb-20 lg:pb-0">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-30 px-2 py-1.5 flex items-center justify-around">
        {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-bold">{label}</span>
          </NavLink>
        ))}
        {/* Logout in mobile bottom nav */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[9px] font-bold">Chiqish</span>
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
