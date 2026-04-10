import React, { useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { User, Lock, Palette, Save, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';

const SettingsPage: React.FC = () => {
  const { user, uploadUserPhoto, updateUser } = useAdminStore();
  const { showToast } = useToast();
  const [tab, setTab] = useState<'general' | 'security'>('general');
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const tabs = [
    { id: 'general' as const, label: 'Umumiy', icon: User },
    { id: 'security' as const, label: 'Xavfsizlik', icon: Lock },
  ];

  const handlePasswordSave = async () => {
    if (pwForm.newPw !== pwForm.confirm) {
      showToast('Yangi parollar mos kelmaydi', 'error');
      return;
    }
    if (pwForm.newPw.length < 6) {
      showToast('Yangi parol kamida 6 belgi bo‘lishi kerak', 'error');
      return;
    }
    setPwSaving(true);
    try {
      await api.post('/auth/change-password', {
        current_password: pwForm.current,
        new_password: pwForm.newPw,
      });
      setPwForm({ current: '', newPw: '', confirm: '' });
      showToast('Parol muvaffaqiyatli yangilandi', 'success');
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      showToast(typeof msg === 'string' ? msg : 'Parolni yangilab bo‘lmadi', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const normalizePhone = (p: string) => {
        let clean = p.replace(/\D/g, '');
        if (!clean) return '';
        if (clean.length === 9) return '+998' + clean;
        if (clean.length === 12 && clean.startsWith('998')) return '+' + clean;
        return p.startsWith('+') ? p : '+' + p;
      };
      
      const data = { ...form, phone: normalizePhone(form.phone) };
      await updateUser(user.id, data);
      showToast("Profil muvaffaqiyatli saqlandi! ✨", 'success');
    } catch (e) {
      showToast("Saqlashda xato yuz berdi.", 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Sozlamalar</h1>
        <p className="text-sm text-slate-400 mt-0.5">Profilingiz va tizim sozlamalarini boshqaring.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="card p-4 self-start">
          <div className="space-y-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                  tab === t.id ? "bg-primary-50 text-primary-700" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {tab === 'general' && (
            <>
              {/* Profile Photo */}
              <div className="card p-6">
                <h2 className="section-title mb-5">Profil Ma'lumotlari</h2>
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-primary-600 text-2xl font-black relative group overflow-hidden border-2 border-slate-50">
                    {user?.photo_url ? (
                      <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span>{user?.first_name?.[0]}{user?.last_name?.[0]}</span>
                    )}
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                       <Palette className="w-5 h-5 text-white" />
                       <input 
                         type="file" 
                         className="hidden" 
                         accept="image/*" 
                         onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                               try {
                                  await uploadUserPhoto(user!.id, file);
                                  showToast("Rasm yuklandi", 'success');
                               } catch (e) {
                                  showToast("Rasm yuklashda xato", 'error');
                               }
                            }
                         }} 
                       />
                    </label>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-slate-400 capitalize">{user?.role} · {user?.email}</p>
                    <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mt-1">IT School Xizmatchisi</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Ism</label>
                    <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Familiya</label>
                    <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Email</label>
                    <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Telefon</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="input-label">Bio</label>
                    <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input min-h-[80px] resize-none" placeholder="O'zingiz haqida..." />
                  </div>
                </div>
              </div>

            </>
          )}

          {tab === 'security' && (
            <div className="card p-6">
              <h2 className="section-title mb-5">Xavfsizlik</h2>
              <div className="space-y-4">
                <div className="border-t border-slate-100 pt-0">
                  <h3 className="text-sm font-bold text-slate-700 mb-4">Parolni o'zgartirish</h3>
                  <div className="space-y-3 max-w-md">
                    <div>
                      <label className="input-label">Joriy parol</label>
                      <div className="relative">
                        <input type={showPw ? 'text' : 'password'} value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} className="input pr-10" />
                        <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="input-label">Yangi parol</label>
                      <input type="password" value={pwForm.newPw} onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })} className="input" />
                    </div>
                    <div>
                      <label className="input-label">Qayta kiriting</label>
                      <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} className="input" />
                    </div>
                    <button
                      type="button"
                      disabled={pwSaving || !pwForm.current || !pwForm.newPw}
                      onClick={() => void handlePasswordSave()}
                      className="btn-primary inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Parolni yangilash
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'general' && (
            <div className="flex justify-end">
              <button type="button" onClick={handleSave} className="btn-primary flex items-center gap-2 cursor-pointer">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saqlanmoqda...' : 'O\'zgarishlarni saqlash'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
