import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Calendar,
  ClipboardList,
  Wallet,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import { useConfirm } from '../context/ConfirmContext';

/**
 * Role-based navigation:
 * ADMIN  → Dedicated layout (pages/admin/Layout.tsx), not rendered here
 * MANAGER → Dashboard, Students (create/manage), Payments
 * TEACHER → Dashboard, Groups (create/manage students), Attendance, Exams
 */
const getNavItems = (role: string) => {
  if (role === 'STUDENT') return [];
  if (role === 'MANAGER') return [
    { to: '/manager/dashboard', icon: LayoutDashboard, label: 'Bosh sahifa' },
    { to: '/manager/students', icon: GraduationCap, label: "O'quvchilar" },
    { to: '/manager/payments', icon: Wallet, label: "To'lovlar" },
  ];

  if (role === 'TEACHER') return [
    { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Bosh sahifa' },
    { to: '/teacher/students', icon: GraduationCap, label: "O'quvchilarim" },
    { to: '/teacher/groups', icon: Users, label: 'Guruhlar' },
    { to: '/teacher/attendance', icon: Calendar, label: 'Davomat' },
    { to: '/teacher/exams', icon: ClipboardList, label: 'Imtihonlar' },
  ];

  // ADMIN should never reach this sidebar (uses own layout), but fallback:
  return [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ];
};

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { user, logout } = useAdminStore();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: "Chiqish",
      message: "Tizimdan chiqishni xohlaysizmi?",
      confirmText: "Ha, chiqish",
      type: "danger"
    });
    
    if (isConfirmed) {
      logout();
      navigate('/login');
    }
  };

  const navItems = getNavItems(user?.role || '');

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={onToggle} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-screen border-r border-[var(--border)] flex flex-col z-50 transition-all duration-300 overflow-hidden',
          isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0 md:w-20',
        )}
      >
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.22] dark:opacity-[0.18]"
            style={{ backgroundImage: "url('/images/uzbek-hero.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-card)]/96 via-[var(--bg-card)]/92 to-[var(--bg-card)]/98" />
        </div>
        <div className="relative z-10 flex h-full min-h-0 flex-col overflow-hidden">
        {/* Brand */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between min-h-[73px]">
          <div className={cn('flex items-center gap-3 overflow-hidden', !isOpen && 'md:justify-center w-full')}>
            <div className="w-10 h-10 bg-[var(--bg-muted)] rounded-xl flex items-center justify-center shadow-sm p-1.5 shrink-0 border border-[var(--border)]">
              <img src="/images/logo.png" alt="IT School" className="w-full h-full object-contain" />
            </div>
            <div className={cn('transition-all duration-300', !isOpen && 'md:hidden opacity-0')}>
              <h1 className="text-sm font-black text-[var(--text-h)] tracking-tighter uppercase leading-none">IT School</h1>
              <p className="text-[9px] font-black text-[var(--accent)] uppercase tracking-widest mt-0.5 opacity-80">Platform</p>
            </div>
          </div>
          <button type="button" className="md:hidden p-2 rounded-lg hover:bg-[var(--hover-bg)] cursor-pointer" onClick={onToggle}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Role Badge */}
        {isOpen && (
          <div className="px-4 pt-4 pb-2">
            <div className={cn(
              "px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-center transition-all",
              user?.role === 'MANAGER' ? "bg-purple-50 text-purple-600 border border-purple-100" :
              user?.role === 'TEACHER' ? "bg-blue-50 text-blue-600 border border-blue-100" :
              user?.role === 'STUDENT' ? "bg-green-50 text-green-600 border border-green-100" :
              "bg-primary-50 text-primary-600 border border-primary-100"
            )}>
              {user?.role || 'GUEST'} Panel
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 space-y-0.5 no-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => { if (window.innerWidth < 768) onToggle(); }}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)]'
                    : 'text-[var(--text)]/80 hover:bg-[var(--hover-bg)] hover:text-[var(--text-h)]',
                  !isOpen && 'md:justify-center md:px-0',
                )
              }
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span className={cn("flex-1", !isOpen && "md:hidden")}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-[var(--border)] space-y-0.5">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer',
                isActive ? 'bg-[var(--accent-bg)] text-[var(--accent)]' : 'text-[var(--text)]/80 hover:bg-[var(--hover-bg)]',
                !isOpen && 'md:justify-center md:px-0',
              )
            }
          >
            <Settings className="w-[18px] h-[18px]" />
            <span className={cn(!isOpen && "md:hidden")}>Sozlamalar</span>
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full cursor-pointer',
              !isOpen && 'md:justify-center md:px-0',
            )}
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span className={cn(!isOpen && "md:hidden")}>Chiqish</span>
          </button>
        </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
