import React, { useEffect } from 'react';
import { useStudentStore } from '../store/useStudentStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  User, Phone, Mail, Shield, Info, GraduationCap, Loader2
} from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { profile, fetchProfile, isLoading } = useStudentStore();
  const { user } = useAuthStore();

  useEffect(() => { fetchProfile(); }, []);

  const data = profile || user;

  const fields = [
    { icon: User, label: 'Ism', value: `${data?.first_name || ''} ${data?.last_name || ''}` },
    { icon: Phone, label: 'Telefon', value: data?.phone || '—' },
    { icon: Mail, label: 'Email', value: (data as any)?.email || '—' },
    { icon: User, label: "Ota-ona ismi", value: (data as any)?.parent_name || '—' },
  ];

  return (
    <div className="page-container space-y-6 pb-20 lg:pb-6 animate-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Profilim</h1>
        <p className="text-slate-400 text-sm mt-1">Shaxsiy ma'lumotlaringiz</p>
      </div>

      {/* Read-only notice */}
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-primary-800">Ma'lumotlar faqat o'qish uchun</p>
          <p className="text-xs text-primary-600 mt-0.5">Profilingizni faqat administrator tahrirlashi mumkin. Xato ma'lumot bo'lsa, menejer bilan bog'laning.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="card p-12 flex justify-center"><Loader2 className="w-7 h-7 text-primary-400 animate-spin" /></div>
      ) : (
        <>
          {/* Avatar card */}
          <div className="card p-6 flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl flex items-center justify-center shadow-xl shadow-primary-200/40">
              {(data as any)?.image_url ? (
                <img src={(data as any).image_url} className="w-full h-full object-cover rounded-3xl" alt="" />
              ) : (
                <span className="text-white text-3xl font-black">
                  {data?.first_name?.[0]}{data?.last_name?.[0]}
                </span>
              )}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black text-slate-900">{data?.first_name} {data?.last_name}</h2>
              <span className="status-pill pill-active mt-2 inline-flex">● Faol talaba</span>
            </div>
          </div>

          {/* Profile fields */}
          <div className="card divide-y divide-slate-50">
            {fields.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="label-subtle">{label}</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Security */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Xavfsizlik</p>
                <p className="text-xs text-slate-400">Telegram orqali tasdiqlangan</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <p className="text-xs font-bold text-green-700">Hisob tasdiqlangan ✓</p>
            </div>
          </div>

          {/* Role */}
          <div className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-500" />
            </div>
            <div>
              <p className="label-subtle">Rol</p>
              <p className="text-sm font-bold text-slate-800">Talaba</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilePage;
