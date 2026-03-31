import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import api from '../lib/api';
import {
  Loader2,
  UserCheck,
  BarChart3,
  Clock,
  ArrowLeft
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
    return <div className="page-container flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>;
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
    <div className="page-container animate-in">
      {/* Back Button */}
      <button onClick={() => navigate('/students')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 mb-6 transition-all">
        <ArrowLeft className="w-4 h-4" /> Talabalar ro'yxatiga qaytish
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Profile */}
        <div className="space-y-6">
          <div className="card p-6 text-center shadow-sm">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-4 shadow-xl shadow-primary-200/40">
              {student.image_url ? (
                <img src={student.image_url} alt="" className="w-full h-full rounded-3xl object-cover" />
              ) : (
                `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`
              )}
            </div>
            <h2 className="text-xl font-black text-slate-800">{student.first_name} {student.last_name}</h2>
            <p className="text-xs text-slate-400 mt-1">ID: {student.id?.slice(0, 8)}</p>
            <span className={cn("status-pill mt-3", student.status === 'active' ? 'pill-active' : student.status === 'frozen' ? 'pill-frozen' : 'pill-active')}>
              ● {student.status || 'Active'}
            </span>

            <div className="grid grid-cols-1 gap-3 mt-6 text-left">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50">
                <Phone className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="label-subtle">Telefon</p>
                  <p className="text-sm font-bold text-slate-700">{student.phone || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="label-subtle">Email</p>
                  <p className="text-sm font-bold text-slate-700">{student.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="label-subtle">Ota-ona</p>
                  <p className="text-sm font-bold text-slate-700">{student.parent_name || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="label-subtle">Ro'yxatga olingan</p>
                  <p className="text-sm font-bold text-slate-700">{student.created_at ? new Date(student.created_at).toLocaleDateString('uz-UZ') : '—'}</p>
                </div>
              </div>
              {student.telegram_chat_id && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/40 border border-blue-100/50">
                  <div className="w-8 h-8 bg-[#0088cc] rounded-lg flex items-center justify-center text-white shadow-sm">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="label-subtle text-[#0088cc]/80 font-bold">Telegram Ulangan</p>
                    <p className="text-sm font-bold text-slate-700 truncate">
                      {student.telegram_username ? `@${student.telegram_username}` : 'ID: ' + student.telegram_chat_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Insight */}
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-amber-200/40">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">AI Insight 🤖</span>
            </div>
            <p className="text-sm font-semibold leading-relaxed opacity-95">
              {dashboard?.ai_status ? `"${dashboard.ai_status}"` : `"${student.first_name} davomati barqaror. Imtihon ko'rsatkichlari yaxshi — davom eting! 🏆"`}
            </p>
          </div>
        </div>

        {/* Right — Stats & Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="label-subtle">O'rtacha Ball</p>
                  <p className="text-2xl font-black text-slate-800">{avgExamScore}%</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="label-subtle">Davomat</p>
                  <p className="text-2xl font-black text-slate-800">{attendancePercent}%</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="label-subtle">Jami to'lov</p>
                  <p className="text-2xl font-black text-slate-800">{totalPaid.toLocaleString()} <span className="text-xs font-bold text-slate-300">so'm</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Course & Group */}
          <div className="card p-6">
            <h3 className="section-title mb-4">Kurs & Guruh</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="label-subtle mb-1">Kurs</p>
                <p className="text-sm font-bold text-slate-700">{student.course_name || 'Belgilanmagan'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="label-subtle mb-1">Guruh</p>
                <p className="text-sm font-bold text-slate-700">{student.group_name || 'Belgilanmagan'}</p>
              </div>
            </div>
          </div>

          {/* Exam Performance (dynamic chart) */}
          <div className="card p-6">
            <h3 className="section-title mb-4">Imtihon Natijalari</h3>
            <div className="flex items-end gap-2 h-32">
              {examResults.length > 0 ? examResults.slice(0, 10).reverse().map((res: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className={cn("w-full rounded-t-md transition-all group-hover:opacity-80", 
                      Number(res.score) >= 80 ? "bg-green-400" : Number(res.score) >= 60 ? "bg-amber-400" : "bg-red-400")}
                    style={{ height: `${res.score}%` }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-10">
                    {res.exam_title}: {res.score}%
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">#{i + 1}</span>
                </div>
              )) : (
                <div className="w-full flex items-center justify-center text-slate-300 text-sm">Hali imtihon topshirilmagan</div>
              )}
            </div>
            <div className="flex gap-6 mt-3">
              <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded bg-green-400" /><span className="text-slate-500 font-semibold">80%+</span></div>
              <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded bg-amber-400" /><span className="text-slate-500 font-semibold">60-79%</span></div>
              <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded bg-red-400" /><span className="text-slate-500 font-semibold">&lt;60%</span></div>
            </div>
          </div>

          {/* Payment History */}
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h3 className="section-title">To'lov Tarixi</h3>
            </div>
            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr><th>Sana</th><th>Summa</th><th>Usul</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {payments.map((p: any) => (
                      <tr key={p.id}>
                        <td className="text-xs">{p.created_at ? new Date(p.created_at).toLocaleDateString('uz-UZ') : '—'}</td>
                        <td className="font-bold text-green-600">{Number(p.amount).toLocaleString()} so'm</td>
                        <td><span className="course-badge bg-slate-100 text-slate-600 uppercase">{p.payment_method || 'Cash'}</span></td>
                        <td><span className={cn("status-pill", p.status === 'paid' ? 'pill-paid' : 'pill-pending')}>● {p.status || 'paid'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">To'lovlar topilmadi</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
