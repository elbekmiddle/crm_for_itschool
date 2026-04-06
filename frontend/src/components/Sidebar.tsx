import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  X,
  UserPlus,
  FileText,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import { useConfirm } from '../context/ConfirmContext';

/**
 * Role-based navigation:
 * ADMIN  → Dedicated layout (pages/admin/Layout.tsx), not rendered here
 * MANAGER → Dashboard, Students (create/manage), Payments, Courses, Groups (view), Leads
 * TEACHER → Dashboard, Groups (create/manage students), Attendance, Exams
 * STUDENT → Dashboard, Profile, Exams
 */
const getNavItems = (role: string) => {
  if (role === 'MANAGER') return [
    { to: '/manager/dashboard', icon: LayoutDashboard, label: 'Bosh sahifa' },
    { to: '/manager/students', icon: GraduationCap, label: "O'quvchilar" },
    { to: '/manager/payments', icon: Wallet, label: "To'lovlar" },
    { to: '/manager/courses', icon: BookOpen, label: 'Kurslar' },
    { to: '/manager/groups', icon: Users, label: 'Guruhlar' },
    { to: '/manager/leads', icon: UserPlus, label: 'Lidlar' },
  ];

  if (role === 'TEACHER') return [
    { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Bosh sahifa' },
    { to: '/teacher/groups', icon: Users, label: 'Guruhlar' },
    { to: '/teacher/attendance', icon: Calendar, label: 'Davomat' },
    { to: '/teacher/exams', icon: ClipboardList, label: 'Imtihonlar' },
  ];

  if (role === 'STUDENT') return [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Bosh sahifa' },
    { to: '/student/profile', icon: Users, label: 'Profil' },
    { to: '/student/exams', icon: ClipboardList, label: 'Imtihonlar' },
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
          "fixed top-0 left-0 h-screen bg-white border-r border-slate-100 flex flex-col z-50 transition-all duration-300",
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:translate-x-0 md:w-20"
        )}
      >
        {/* Brand */}
        <div className="p-5 border-b border-slate-50 flex items-center justify-between min-h-[73px]">
          <div className={cn("flex items-center gap-3 overflow-hidden", !isOpen && "md:justify-center w-full")}>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm p-1.5 shrink-0">
               <img 
                 src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Logo_IT_Park_Uzbekistan.svg/3840px-Logo_IT_Park_Uzbekistan.svg.png" 
                 alt="IT Park" 
                 className="w-full h-full object-contain"
               />
            </div>
            <div className={cn("transition-all duration-300", !isOpen && "md:hidden opacity-0")}>
              <h1 className="text-sm font-black text-slate-800 tracking-tighter uppercase leading-none">IT Academy</h1>
              <p className="text-[9px] font-black text-primary-500 uppercase tracking-widest mt-0.5 opacity-70">CRM System</p>
            </div>
          </div>
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-50" onClick={onToggle}>
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
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => { if (window.innerWidth < 768) onToggle(); }}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200",
                  isActive
                    ? "bg-primary-50 text-primary-700 shadow-sm shadow-primary-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                  !isOpen && "md:justify-center md:px-0"
                )
              }
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span className={cn("flex-1", !isOpen && "md:hidden")}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-slate-50 space-y-0.5">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200",
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
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-all duration-200 w-full",
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
