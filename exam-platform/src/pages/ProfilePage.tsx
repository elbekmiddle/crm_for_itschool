import React, { useEffect } from 'react';
import { useStudentStore } from '../store/useStudentStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  User, Phone, Shield, Info, GraduationCap, Loader2, Sparkles, Settings, ChevronRight, Mail
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const ProfilePage: React.FC = () => {
  const { profile, fetchProfile, isLoading } = useStudentStore();
  const { user } = useAuthStore();

  useEffect(() => { fetchProfile(); }, []);

  const data = profile || user;

  const fields = [
    { icon: User, label: 'To\'liq ism', value: `${data?.first_name || ''} ${data?.last_name || ''}` },
    { icon: Phone, label: 'Telefon raqam', value: data?.phone || '—' },
    { icon: User, label: "Ota-ona", value: (data as any)?.parent_name || '—' },
  ];

  const initials = `${data?.first_name?.[0] || ''}${data?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="page-container space-y-8 pb-32 lg:pb-12 h-full">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 text-[var(--accent)] font-black text-[10px] uppercase tracking-[0.3em] mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Shaxsiy Ma'lumotlar</span>
          </div>
          <h1 className="text-4xl font-black text-[var(--text-h)] tracking-tight">Profilim</h1>
          <p className="text-[var(--text)] font-medium mt-1">Hisob sozlamalari va shaxsiy ma'lumotlar</p>
        </motion.div>
      </header>

      {/* Read-only notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--accent)]/5 border border-[var(--accent)]/15 rounded-[2rem] p-6 flex items-start gap-5"
      >
        <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center shrink-0">
          <Info className="w-6 h-6 text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-sm font-black text-[var(--text-h)]">Faqat o'qish uchun</p>
          <p className="text-xs text-[var(--text)] font-medium mt-1">Profilingizni faqat administrator tahrirlashi mumkin. Xato ma'lumot bo'lsa, menejer bilan bog'laning.</p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)]">
          <Loader2 className="w-10 h-10 text-[var(--accent)] animate-spin" />
          <p className="mt-4 text-[var(--text)] font-bold uppercase tracking-widest text-[10px]">Yuklanmoqda...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Avatar & Status */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-[var(--border)] flex flex-col items-center text-center"
            >
              <div className="w-28 h-28 bg-gradient-to-br from-[#aa3bff] to-[#c084fc] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-[#aa3bff]/20 mb-6">
                {(data as any)?.image_url ? (
                  <img src={(data as any).image_url} className="w-full h-full object-cover rounded-[2rem]" alt="" />
                ) : (
                  <span className="text-white text-4xl font-black">{initials}</span>
                )}
              </div>
              <h2 className="text-2xl font-black text-[var(--text-h)] tracking-tight mb-1">{data?.first_name} {data?.last_name}</h2>
              <span className="status-pill pill-active mt-2 inline-flex gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Faol talaba
              </span>
            </motion.div>

            {/* Security */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="font-black text-[var(--text-h)] text-sm">Xavfsizlik</p>
                  <p className="text-[10px] text-[var(--text)] font-bold uppercase tracking-widest mt-0.5">Telegram orqali</p>
                </div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981] animate-pulse" />
                <p className="text-xs font-black text-emerald-500">Hisob tasdiqlangan ✓</p>
              </div>
            </motion.div>
          </div>

          {/* Right: Fields */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--divide)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center">
                    <Settings className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <h3 className="text-xl font-black text-[var(--text-h)] tracking-tight">Profil Ma'lumotlari</h3>
                </div>
              </div>

              {fields.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-5 p-6 border-b border-[var(--divide)] last:border-b-0 row-hover transition-colors">
                  <div className="w-12 h-12 bg-[var(--bg-muted)] rounded-2xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[var(--text)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-[var(--text)] uppercase tracking-[0.2em] mb-1">{label}</p>
                    <p className="text-base font-black text-[var(--text-h)] truncate">{value}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--text)] opacity-30 shrink-0" />
                </div>
              ))}

              {/* Role */}
              <div className="flex items-center gap-5 p-6 row-hover transition-colors">
                <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-[var(--text)] uppercase tracking-[0.2em] mb-1">Rol</p>
                  <p className="text-base font-black text-[var(--text-h)]">Talaba</p>
                </div>
                <span className="px-4 py-2 bg-[var(--accent)]/10 text-[var(--accent)] text-[9px] font-black uppercase tracking-widest rounded-2xl border border-[var(--accent)]/20">
                  Student
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
