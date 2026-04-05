import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import api from '../lib/api';
import {
  Loader2,
  Phone,
  User,
  Calendar,
  Sparkles,
  DollarSign,
  ClipboardList,
  ArrowLeft,
  Clock,
  BookOpen,
  Users,
  UserCircle
} from 'lucide-react';

const StudentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAdminStore();
  const [student, setStudent] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const targetId = id || user?.id;
      if (!targetId) return;
      
      setLoading(true);
      try {
        const [profileRes, dashboardRes] = await Promise.all([
          api.get(`/students/${targetId}`),
          api.get(`/students/${targetId}/dashboard`)
        ]);
        setStudent(profileRes.data);
        setDashboard(dashboardRes.data);
      } catch (e) {
        console.error('Error loading student profile:', e);
      }
      setLoading(false);
    };
    loadData();
  }, [id, user?.id]);

  if (loading) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-slate-400">Talaba topilmadi</p>
        <button onClick={() => navigate('/students')} className="btn-primary mt-4">Orqaga</button>
      </div>
    );
  }

  const payments = dashboard?.payments || [];
  const totalPaid = payments.reduce((a: number, p: any) => a + (Number(p.amount) || 0), 0);
  const attendancePercent = dashboard ? Math.round(((Number(dashboard.present_days) || 0) / ((Number(dashboard.present_days) || 0) + (Number(dashboard.absent_days) || 0) || 1)) * 100) : 0;
  const examResults = dashboard?.exams || [];
  const avgExamScore = examResults.length > 0 
    ? Math.round(examResults.reduce((a: number, r: any) => a + Number(r.score), 0) / examResults.length) 
    : 0;

  return (
    <div className="page-container animate-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate('/students')} className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-primary-600 mb-2 transition-all uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" /> Talabalar ro'yxatiga qaytish
          </button>
          <h1 className="text-2xl font-black text-slate-800">Talaba Profili</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Profile Info */}
        <div className="space-y-6">
          <div className="card p-6 text-center shadow-lg border-primary-50">
            <div className="w-28 h-28 bg-gradient-to-br from-primary-500 to-indigo-700 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black mx-auto mb-4 shadow-2xl shadow-primary-200/40 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {student.image_url ? (
                <img src={student.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`
              )}
            </div>
            <h2 className="text-xl font-black text-slate-800">{student.first_name} {student.last_name}</h2>
            <p className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-[0.2em]">ID: {student.id?.slice(0, 8)}</p>
            
            <div className="flex justify-center mt-3">
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                student.status === 'active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {student.status || 'Active'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 mt-8 text-left">
              <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:border-primary-100 transition-all duration-300">
                <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0">
                   <Phone className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="label-subtle">Telefon raqam</p>
                  <p className="text-sm font-black text-slate-800 tracking-tight">{student.phone || '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:border-primary-100 transition-all duration-300">
                <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0">
                   <UserCircle className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <p className="label-subtle">Ota-ona ismi</p>
                  <p className="text-sm font-black text-slate-800 tracking-tight">{student.parent_name || '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:border-primary-100 transition-all duration-300">
                <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0">
                   <Calendar className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="label-subtle">Ro'yxatdan o'tgan</p>
                  <p className="text-sm font-black text-slate-800 tracking-tight">
                    {student.created_at ? new Date(student.created_at).toLocaleDateString('uz-UZ') : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Stats & Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-6 bg-white border-l-4 border-l-primary-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="label-subtle text-primary-600/70">Davomat</p>
                <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center text-primary-500">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h4 className="text-3xl font-black text-slate-800">{attendancePercent}<span className="text-lg opacity-40">%</span></h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ko'rsatkich</p>
              </div>
            </div>

            <div className="card p-6 bg-white border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="label-subtle text-green-600/70">To'lovlar</p>
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h4 className="text-2xl font-black text-slate-800 tabular-nums">{totalPaid.toLocaleString()}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">So'm</p>
              </div>
            </div>

            <div className="card p-6 bg-white border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="label-subtle text-amber-600/70">Imtihonlar</p>
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                  <ClipboardList className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h4 className="text-3xl font-black text-slate-800">{avgExamScore}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ball</p>
              </div>
            </div>
          </div>

          {/* AI Mentor Feedback */}
          {dashboard?.ai_status && (
            <div className="card p-8 bg-gradient-to-br from-primary-600 to-indigo-800 text-white relative overflow-hidden group">
               <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-white/20 transition-all duration-1000" />
               <div className="relative z-10 flex items-start gap-6">
                 <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner">
                    <Sparkles className="w-7 h-7 text-white" />
                 </div>
                 <div>
                   <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary-100 mb-2">AI Mentor Fikri</h3>
                   <p className="text-lg font-medium italic leading-relaxed text-indigo-50">
                     "{dashboard.ai_status}"
                   </p>
                 </div>
               </div>
            </div>
          )}

          {/* Course & Group */}
          <div className="card p-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
               Kurs & Guruh
               <div className="h-0.5 w-8 bg-primary-100" />
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50/70 border border-slate-100 rounded-3xl p-5 flex items-center gap-4 hover:bg-white hover:border-primary-100 transition-all duration-300">
                <div className="w-12 h-12 bg-white rounded-[1.25rem] shadow-sm flex items-center justify-center text-indigo-500">
                   <BookOpen className="w-6 h-6" />
                </div>
                <div>
                   <p className="label-subtle">Talim Yo'nalishi</p>
                   <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{student.course_name || 'Belgilanmagan'}</p>
                </div>
              </div>
              <div className="bg-slate-50/70 border border-slate-100 rounded-3xl p-5 flex items-center gap-4 hover:bg-white hover:border-primary-100 transition-all duration-300">
                <div className="w-12 h-12 bg-white rounded-[1.25rem] shadow-sm flex items-center justify-center text-primary-500">
                   <Users className="w-6 h-6" />
                </div>
                <div>
                   <p className="label-subtle">Guruh Nomi</p>
                   <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{student.group_name || 'Belgilanmagan'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
