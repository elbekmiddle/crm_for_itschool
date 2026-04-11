import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import { Bell, Menu, X, GraduationCap, Moon, Sun, Search, CheckCheck } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { useNotifications } from '../hooks/useNotifications';
import { useSocketEvents } from '../hooks/useSocketEvents';
import { cn } from '../lib/utils';
import { formatPersonName, formatInitials } from '../lib/displayName';
import { resolveMediaUrl } from '../lib/mediaUrl';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [dark, setDark] = useState(() => {
    const t = localStorage.getItem('theme');
    if (t === 'light') return false;
    return true;
  });
  const { user } = useAdminStore();
  const navigate = useNavigate();

  if (user?.role === 'STUDENT') {
    return <Navigate to="/login" replace />;
  }
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const notifWrapRef = useRef<HTMLDivElement>(null);
  const [notifQuery, setNotifQuery] = useState('');
  const filteredNotifications = useMemo(() => {
    const q = notifQuery.trim().toLowerCase();
    if (!q) return notifications;
    return notifications.filter(
      (n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q),
    );
  }, [notifications, notifQuery]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!notifWrapRef.current?.contains(e.target as Node)) setShowNotifications(false);
    };
    if (showNotifications) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showNotifications]);

  useEffect(() => {
    if (!showNotifications) setNotifQuery('');
  }, [showNotifications]);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  useSocketEvents();

  const displayName = formatPersonName(user?.first_name, user?.last_name, user?.email);
  const avatarSrc = resolveMediaUrl(user?.photo_url);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        {/* Header — fixed (sticky ba’zi scroll kontekstlarda ishlamasligi mumkin) */}
        <header
          className={cn(
            'fixed right-0 top-0 z-40 flex min-h-[73px] items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--bg-card)]/92 px-6 py-3 backdrop-blur-[6px] transition-all duration-200',
            sidebarOpen ? 'md:left-64' : 'md:left-20',
            'left-0',
          )}
        >
          <div className="flex items-center gap-4 flex-1">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl hover:bg-[var(--hover-bg)] text-[var(--text)]/60 transition-all cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              type="button"
              onClick={() => setDark(!dark)}
              className="cursor-pointer rounded-xl p-2.5 text-[var(--text)]/60 transition-all duration-200 hover:bg-[var(--hover-bg)] hover:text-[var(--text-h)]"
              title={dark ? 'Yorug\' rejim' : 'Tungi rejim'}
            >
              {dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
            <div className="relative" ref={notifWrapRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative cursor-pointer rounded-xl p-2.5 text-[var(--text)]/60 transition-all duration-200 hover:bg-[var(--hover-bg)] hover:text-[var(--text-h)]"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-black text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <motion.button
                      type="button"
                      aria-label="Yopish"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="fixed inset-0 z-[90] cursor-default bg-[var(--bg)]/70 backdrop-blur-xl"
                      onClick={() => setShowNotifications(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -12, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                      className="fixed left-1/2 top-[5.75rem] z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl sm:top-[5.25rem]"
                    >
                      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-card)] p-4 text-[var(--text-h)] dark:border-transparent dark:bg-gradient-to-br dark:from-[#9329e6] dark:to-indigo-900 dark:text-white">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-bg)] dark:bg-white/20">
                            <Bell className="h-5 w-5 text-[var(--accent)] dark:text-white" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-black truncate">Bildirishnomalar</h3>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text)] dark:text-white/80">
                              {unreadCount} ta o‘qilmagan
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowNotifications(false)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--hover-bg)] transition-colors duration-200 hover:bg-[var(--border)] dark:bg-white/10 dark:hover:bg-white/20"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-muted)]/40 px-3 py-2.5">
                        <div className="relative min-w-0 flex-1">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text)]/40" />
                          <input
                            type="search"
                            value={notifQuery}
                            onChange={(e) => setNotifQuery(e.target.value)}
                            placeholder="Qidirish..."
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-2 pl-9 pr-3 text-xs font-medium text-[var(--text-h)] placeholder:text-[var(--text)]/45 focus:border-[var(--accent-border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30"
                          />
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markAllAsRead()}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-[var(--text-h)] transition-colors hover:bg-[var(--hover-bg)]"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Hammasini o‘qilgan
                          </button>
                        )}
                      </div>
                      <div className="max-h-[min(400px,60vh)] space-y-2 overflow-y-auto bg-[var(--bg-muted)]/50 p-4 no-scrollbar">
                        {filteredNotifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => markAsRead(n.id)}
                            className={cn(
                              'w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-left shadow-sm transition-all duration-200 hover:border-[var(--accent-border)]',
                              !n.read && 'ring-1 ring-[var(--accent)]/20',
                            )}
                          >
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <p className={cn('text-sm font-black', !n.read ? 'text-[var(--accent)]' : 'text-[var(--text-h)]')}>{n.title}</p>
                              {!n.read && <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />}
                            </div>
                            <p className="mb-2 text-[12px] leading-relaxed text-[var(--text)]">{n.message}</p>
                            <p className="text-[9px] font-bold uppercase tracking-tighter text-[var(--text)]/40">
                              {new Date(n.timestamp).toLocaleString('uz-UZ')}
                            </p>
                          </button>
                        ))}
                        {filteredNotifications.length === 0 && (
                          <div className="py-16 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--hover-bg)]">
                              <Bell className="h-8 w-8 text-[var(--text)]/25" />
                            </div>
                            <p className="text-xs font-bold italic tracking-wide text-[var(--text)]/50">
                              {notifQuery.trim() ? 'Natija yo‘q' : 'Xabarlar yo‘q'}
                            </p>
                          </div>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="border-t border-[var(--border)] bg-[var(--bg-card)] p-3">
                          <button
                            type="button"
                            onClick={clearAll}
                            className="w-full rounded-xl py-2 text-[11px] font-black uppercase tracking-widest text-red-500 transition-colors duration-200 hover:bg-red-500/10"
                          >
                            Hammasini tozalash
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 pl-3 ml-1 border-l border-[var(--border)]">
              <div className="min-w-0 text-left">
                <p className="max-w-[180px] truncate text-sm font-black leading-none text-[var(--text-h)]">
                  {displayName}
                </p>
                <p className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">
                  {user?.role || '—'}
                </p>
              </div>
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] text-[11px] font-black text-[var(--accent)]"
                title={displayName}
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{formatInitials(user?.first_name, user?.last_name, user?.email)}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content — navbar balandligi qo‘shimchasi */}
        <main className="min-h-[calc(100vh-73px)] pt-[73px]">
          <Outlet />
        </main>
        {/* App Loader */}
        {isAppLoading && (
          <div className="fixed inset-0 z-[200] bg-[var(--bg)] flex flex-col items-center justify-center">
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
