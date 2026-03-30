import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  GraduationCap, LayoutDashboard, User, BookOpen,
  CalendarCheck, CreditCard, ClipboardList, LogOut, Menu, X,
  Bell
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile', icon: User, label: 'Profilim' },
  { to: '/course', icon: BookOpen, label: 'Kursim' },
  { to: '/attendance', icon: CalendarCheck, label: 'Davomat' },
  { to: '/payments', icon: CreditCard, label: "To'lovlar" },
  { to: '/exams', icon: ClipboardList, label: 'Imtihonlar' },
];

const AppLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : 'S';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-100 fixed top-0 left-0 h-full z-30">
        {/* Brand */}
        <div className="p-5 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow shadow-primary-200">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-slate-800 text-sm leading-none">IT School</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">Exam Portal</p>
            </div>
          </div>
        </div>

        {/* User card */}
        <div className="p-4 mx-3 mt-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white text-xs font-black shadow">
              {user?.image_url
                ? <img src={user.image_url} className="w-full h-full rounded-xl object-cover" alt="" />
                : initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-[10px] text-slate-400 font-semibold">Talaba</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 mt-2 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-50">
          <button onClick={handleLogout} className="nav-link w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600">
            <LogOut className="w-4 h-4" /> Chiqish
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-slate-800 text-sm">IT School</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500">
            <Bell className="w-4 h-4" />
          </button>
          <button onClick={() => setMobileOpen(true)} className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center">
            <Menu className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-white h-full flex flex-col shadow-2xl animate-in">
            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="font-black text-slate-800 text-sm">IT School</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to} to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4 shrink-0" /> {label}
                </NavLink>
              ))}
            </nav>
            <div className="p-3 border-t border-slate-50">
              <button onClick={handleLogout} className="nav-link w-full text-left text-red-500 hover:bg-red-50">
                <LogOut className="w-4 h-4" /> Chiqish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen pt-0 lg:pt-0">
        <div className="pt-16 lg:pt-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-30 px-2 py-2 flex items-center justify-around">
        {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive ? 'text-primary-600' : 'text-slate-400'}`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-bold">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AppLayout;
