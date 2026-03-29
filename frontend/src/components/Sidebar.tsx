import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  TrendingUp, 
  LogOut,
  Settings,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';

const SidebarItem = ({ to, icon: Icon, label }: any) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold group border border-transparent uppercase tracking-wider text-xs leading-none",
        isActive 
          ? "bg-primary-600 text-white shadow-xl shadow-primary-200 border-primary-500" 
          : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
      )
    }
  >
    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
    <span>{label}</span>
  </NavLink>
);

const Sidebar = () => {
  const { user, logout } = useAdminStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-80 bg-white border-r border-slate-100 flex flex-col h-screen fixed inset-y-0 z-50">
      <div className="p-10">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-12 h-12 bg-primary-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-primary-200 rotate-12 group-hover:rotate-0 transition-transform">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="flex flex-col">
             <span className="text-2xl font-black text-slate-800 tracking-tighter leading-none">IT SCHOOL</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mt-1">Liderlar Akademiyasi</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto pt-4 thin-scrollbar">
        <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <>
            <SidebarItem to="/students" icon={Users} label="Talabalar" />
            <SidebarItem to="/courses" icon={BookOpen} label="Kurslar" />
          </>
        )}
        <SidebarItem to="/groups" icon={GraduationCap} label="Guruhlar" />
        <SidebarItem to="/attendance" icon={ClipboardList} label="Yo'qlama" />
        <SidebarItem to="/exams" icon={ClipboardList} label="Imtihonlar" />
        
        {user?.role === 'ADMIN' && (
          <>
            <div className="h-px bg-slate-50 mx-6 my-4" />
            <SidebarItem to="/questions" icon={HelpCircle} label="Savollar Bazasi" />
            <SidebarItem to="/users" icon={ShieldCheck} label="Xodimlar" />
          </>
        )}
        
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <SidebarItem to="/analytics" icon={TrendingUp} label="AI Analitika" />
        )}
      </nav>

      <div className="p-8 border-t border-slate-50 space-y-4">
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl group cursor-pointer hover:bg-slate-100 transition-all">
           <div className="w-10 h-10 rounded-[1rem] bg-white flex items-center justify-center text-primary-600 font-black shadow-sm group-hover:scale-110 transition-transform">
              {user?.email?.[0].toUpperCase() || 'A'}
           </div>
           <div className="flex-1 overflow-hidden">
              <div className="text-xs font-black text-slate-800 truncate uppercase leading-none">{user?.email?.split('@')[0] || 'Admin'}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{user?.role || 'PROFESSIONAL'}</div>
           </div>
           <Settings className="w-4 h-4 text-slate-300 group-hover:rotate-90 transition-transform duration-500" />
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-6 py-4 text-red-500 hover:text-white hover:bg-red-500 rounded-2xl transition-all font-bold uppercase tracking-widest text-[10px] shadow-sm hover:shadow-red-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Tizimdan Chiqish</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
