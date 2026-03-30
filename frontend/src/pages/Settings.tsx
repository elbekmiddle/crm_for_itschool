import React, { useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import {
  User, Lock, Bell, Palette, Save, Eye, EyeOff,
  Shield, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

const SettingsPage: React.FC = () => {
  const { user } = useAdminStore();
  const [tab, setTab] = useState<'general' | 'security' | 'notifications'>('general');
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

  const tabs = [
    { id: 'general' as const, label: 'Umumiy', icon: User },
    { id: 'security' as const, label: 'Xavfsizlik', icon: Lock },
    { id: 'notifications' as const, label: 'Bildirishnomalar', icon: Bell },
  ];

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
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
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-slate-400 capitalize">{user?.role} · {user?.email}</p>
                    <button className="text-xs font-bold text-primary-600 mt-1 hover:underline">Rasmni o'zgartirish</button>
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

              {/* Preferences */}
              <div className="card p-6">
                <h2 className="section-title mb-5">Afzalliklar</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-slate-700">Dark Mode</p>
                      <p className="text-xs text-slate-400">Tungi rejimdan foydalanish</p>
                    </div>
                    <div className="w-12 h-7 bg-slate-200 rounded-full flex items-center p-1 cursor-pointer">
                      <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-slate-700">Til</p>
                      <p className="text-xs text-slate-400">Interfeys tili</p>
                    </div>
                    <select className="select w-40">
                      <option>O'zbekcha</option>
                      <option>Русский</option>
                      <option>English</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'security' && (
            <div className="card p-6">
              <h2 className="section-title mb-5">Xavfsizlik Sozlamalari</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="font-bold text-sm text-slate-700">Ikki bosqichli tasdiqlash (2FA)</p>
                      <p className="text-xs text-slate-400">Qo'shimcha xavfsizlik</p>
                    </div>
                  </div>
                  <div className="w-12 h-7 bg-slate-200 rounded-full flex items-center p-1 cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
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
                    <button className="btn-primary w-full">Parolni yangilash</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="card p-6">
              <h2 className="section-title mb-5">Bildirishnoma Sozlamalari</h2>
              <div className="space-y-4">
                {[
                  { label: 'Yangi talaba qo\'shilganda', desc: 'Email + dashboard bildirishnomasi', on: true },
                  { label: 'To\'lov kelganda', desc: 'Real-time moliyaviy bildirishnoma', on: true },
                  { label: 'Imtihon natijalari', desc: 'Natijalar tahlili bilan', on: false },
                  { label: 'Davomat ogohlantirishlari', desc: '60% dan past davomat haqida', on: true },
                  { label: 'Telegram bot ogohlantirishlari', desc: 'Bot orqali xabarlar', on: true },
                ].map((n, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-bold text-sm text-slate-700">{n.label}</p>
                      <p className="text-xs text-slate-400">{n.desc}</p>
                    </div>
                    <div className={cn("w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-all", n.on ? "bg-primary-500" : "bg-slate-200")}>
                      <div className={cn("w-5 h-5 bg-white rounded-full shadow-sm transition-transform", n.on && "translate-x-5")} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saqlanmoqda...' : 'O\'zgarishlarni saqlash'}
            </button>
          </div>

          {/* Footer Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <p className="label-subtle mb-1">Oxirgi kirish</p>
              <p className="text-sm font-bold text-slate-700">Bugun, 14:23</p>
            </div>
            <div className="card p-4 text-center">
              <p className="label-subtle mb-1">Profil kuchi</p>
              <p className="text-sm font-bold text-green-600">85%</p>
            </div>
            <div className="card p-4 text-center">
              <p className="label-subtle mb-1">Ulangan qurilmalar</p>
              <p className="text-sm font-bold text-slate-700">3</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
