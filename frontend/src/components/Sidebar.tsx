import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  HelpCircle,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', shortcut: '⌘D' },
  { to: '/courses', icon: BookOpen, label: 'Kurslar', shortcut: '⌘C' },
  { to: '/groups', icon: Users, label: 'Guruhlar', shortcut: '⌘G' },
  { to: '/students', icon: GraduationCap, label: 'Talabalar', shortcut: '⌘S' },
  { to: '/attendance', icon: Calendar, label: 'Davomat' },
  { to: '/exams', icon: ClipboardList, label: 'Imtihonlar' },
  { to: '/questions', icon: HelpCircle, label: 'Savollar' },
  { to: '/users', icon: Users, label: 'Foydalanuvchilar' },
  { to: '/payments', icon: Wallet, label: "To'lovlar", shortcut: '⌘P' },
  { to: '/analytics', icon: BarChart3, label: 'Analitika' },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { user, logout } = useAdminStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={onToggle} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-screen bg-white border-r border-slate-100 flex flex-col z-50 transition-all duration-300",
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:translate-x-0 md:w-20"
        )}
      >
        {/* Brand */}
        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
          <div className={cn("flex items-center gap-3 overflow-hidden", !isOpen && "md:justify-center")}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className={cn("transition-all", !isOpen && "md:hidden")}>
              <h1 className="text-base font-black text-primary-700 tracking-tight leading-none">Scholar Flow</h1>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">LMS + CRM Admin</p>
            </div>
          </div>
          <button className="md:hidden" onClick={onToggle}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => { if (window.innerWidth < 768) onToggle(); }}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                  !isOpen && "md:justify-center md:px-0"
                )
              }
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span className={cn("flex-1", !isOpen && "md:hidden")}>{item.label}</span>
              {item.shortcut && isOpen && (
                <span className="text-[9px] font-bold text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded">{item.shortcut}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-slate-50 space-y-0.5">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all",
                isActive ? "bg-primary-50 text-primary-700" : "text-slate-500 hover:bg-slate-50",
                !isOpen && "md:justify-center md:px-0"
              )
            }
          >
            <Settings className="w-[18px] h-[18px]" />
            <span className={cn(!isOpen && "md:hidden")}>Sozlamalar</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-all w-full",
              !isOpen && "md:justify-center md:px-0"
            )}
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span className={cn(!isOpen && "md:hidden")}>Chiqish</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
