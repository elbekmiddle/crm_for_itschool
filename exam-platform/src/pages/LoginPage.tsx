import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Phone, Lock, Eye, EyeOff,
  Loader2, AlertCircle, ArrowRight, CheckCircle2,
  Shield, RefreshCw, Send, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../lib/api';

const isDev = import.meta.env.DEV;
const devLog = (...args: any[]) => { if (isDev) console.log('[LoginPage]', ...args); };

// ─── Step types ──────────────────────────────────────────────────────────────
type Step = 'main' | 'code' | 'set-password';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithPassword, sendCode, verifyCode, isAuthenticated } = useAuthStore();

  // ─── Form state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('main');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);

  // ─── UI state ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const normalizePhone = (p: string) => {
    const digits = p.replace(/\D/g, '');
    if (!digits) return p;
    const norm = digits.startsWith('0') ? `998${digits.slice(1)}` : digits;
    return `+${norm}`;
  };

  // ─── Step 1: Phone + Password login ──────────────────────────────────────────
  const handleMainLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    const normalizedPhone = normalizePhone(phone);
    if (!password) { setError("Parolni kiriting"); return; }
    devLog('loginWithPassword:', normalizedPhone);
    setLoading(true);
    try {
      await loginWithPassword(normalizedPhone, password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.data?.message || err.message || '';
      devLog('loginWithPassword error:', msg);
      if (msg.includes('Parol o\'rnatilmagan') || msg.includes('Parol noto\'g\'ri') || msg.includes('not found') || msg.includes('yo\'q')) {
        setError(msg || "Telefon raqam yoki parol noto'g'ri");
      } else {
        setError(msg || "Kirishda xatolik");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Request Telegram code (first-time / forgot password) ─────────────
  const handleSendCode = async () => {
    setError('');
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      setError("Avval telefon raqamingizni kiriting"); return;
    }
    setLoading(true);
    try {
      await sendCode(normalizedPhone);
      setStep('code');
      setResendTimer(60);
      setInfo('Telegram botdan 6 xonali kodni oling');
      devLog('Code sent to:', normalizedPhone);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.data?.message || err.message || '';
      setError(msg || "Kod yuborishda xatolik. Telegram bot ulanganligi tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Verify code ──────────────────────────────────────────────────────
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    if (code.length < 6) { setError("6 ta raqamli kodni kiriting"); return; }
    setLoading(true);
    try {
      await api.post('/auth/check-code', { phone: normalizePhone(phone), code });
      devLog('Code verified, moving to set-password step');
      setStep('set-password');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.data?.message || '';
      if (err.response?.status === 404) {
        setStep('set-password'); // endpoint not found fallback
      } else {
        setError(msg || "Kod noto'g'ri. Telegram botdan tekshiring.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 4: Set new password ─────────────────────────────────────────────────
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    if (newPassword.length < 6) { setError("Parol kamida 6 ta belgi bo'lishi kerak"); return; }
    if (newPassword !== confirmPassword) { setError("Parollar mos emas"); return; }
    const normalizedPhone = normalizePhone(phone);
    devLog('verifyCode & setPassword — phone:', normalizedPhone, 'code:', code);
    setLoading(true);
    try {
      await verifyCode(normalizedPhone, code, newPassword);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.data?.message || err.message || '';
      setError(msg || "Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    await handleSendCode();
  };

  // ─── UI helpers ───────────────────────────────────────────────────────────────
  const stepTitle: Record<Step, string> = {
    'main': 'Kirish',
    'code': 'Tasdiqlash kodi',
    'set-password': 'Yangi parol',
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden flex-col justify-between p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg p-2">
               <img 
                 src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Logo_IT_Park_Uzbekistan.svg/3840px-Logo_IT_Park_Uzbekistan.svg.png" 
                 alt="IT Park" 
                 className="w-full h-full object-contain"
               />
            </div>
            <div>
              <span className="text-white font-black text-xl uppercase tracking-tighter">IT Academy</span>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Exam Portal</p>
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-black text-white leading-tight">
              Bilimingizni<br />
              <span className="text-indigo-400">sinab ko'ring</span>
            </h1>
            <p className="text-white/50 text-base leading-relaxed">
              Imtihonlar, davomat va to'lovlarni<br />bir joyda kuzating.
            </p>
          </div>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-3">
          {[
            { icon: '📝', text: 'Online imtihonlar' },
            { icon: '📊', text: 'Davomat nazorati' },
            { icon: '💳', text: "To'lov tarixi" },
            { icon: '🤖', text: 'Telegram orqali kirish' },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-3 text-white/60 text-sm">
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Decorative blobs */}
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md">

          {/* Logo (mobile only) */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-sm border border-slate-100">
               <img 
                 src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Logo_IT_Park_Uzbekistan.svg/3840px-Logo_IT_Park_Uzbekistan.svg.png" 
                 alt="IT Park" 
                 className="w-full h-full object-contain"
               />
            </div>
            <span className="text-slate-900 dark:text-white font-black text-2xl uppercase tracking-tighter">IT Academy</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/30 p-8 border border-slate-100 dark:border-slate-800">

            {/* Step indicator */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                {(['main', 'code', 'set-password'] as Step[]).map((s, i) => (
                  <React.Fragment key={s}>
                    <div className={`w-2 h-2 rounded-full transition-all ${s === step ? 'bg-indigo-600 w-4' : i < (['main', 'code', 'set-password'] as Step[]).indexOf(step) ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    {i < 2 && <div className={`flex-1 h-px ${i < (['main', 'code', 'set-password'] as Step[]).indexOf(step) ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                  </React.Fragment>
                ))}
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3">{stepTitle[step]}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {step === 'main' && 'Hisobingizga kiring'}
                {step === 'code' && 'Telegram botdan kodni oling'}
                {step === 'set-password' && 'Hisobingiz uchun yangi parol o\'rnatish'}
              </p>
            </div>

            {/* ── Error / Info ── */}
            {error && (
              <div className="mb-4 flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl p-3.5 text-sm border border-red-100 dark:border-red-900/50">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {info && !error && (
              <div className="mb-4 flex items-start gap-2.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-2xl p-3.5 text-sm border border-green-100 dark:border-green-900/50">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{info}</span>
              </div>
            )}

            {/* ══ STEP: main (phone + password) ══════════════════════════════════ */}
            {step === 'main' && (
              <form onSubmit={handleMainLogin} className="space-y-4">
                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Telefon raqam
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => { setPhone(e.target.value); setError(''); }}
                      placeholder="+998 90 123 45 67"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium"
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Parol
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="Parolni kiriting"
                      className="w-full pl-10 pr-12 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium"
                      autoComplete="current-password"
                      required
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 mt-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Kirish</span><ArrowRight className="w-4 h-4" /></>}
                </button>

                {/* Verify link */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-2">
                    Hisobingiz tasdiqlanmaganmi yoki parolni unutdingizmi?
                  </p>
                  <button type="button" onClick={handleSendCode} disabled={loading}
                    className="w-full flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm py-2.5 px-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors">
                    <Send className="w-3.5 h-3.5" />
                    Telegram orqali tasdiqlash
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* ══ STEP: code ══════════════════════════════════════════════════════ */}
            {step === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                {/* Phone display (read-only) */}
                <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-700">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 text-sm font-mono font-medium">{phone}</span>
                  <button type="button" onClick={() => { setStep('main'); setCode(''); setError(''); }}
                    className="ml-auto text-indigo-600 text-xs font-semibold hover:underline">
                    O'zgartirish
                  </button>
                </div>

                {/* Code input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Telegram kodi
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={code}
                      onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                      placeholder="000000"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-xl font-mono tracking-[0.5em] font-bold"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 text-center">
                    Telegram botdan (@bots_tester_bot) kelgan 6 ta raqamni kiriting
                  </p>
                </div>

                <button type="submit" disabled={loading || code.length < 6}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/25">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Tasdiqlash</span><ArrowRight className="w-4 h-4" /></>}
                </button>

                {/* Resend */}
                <button type="button" onClick={handleResend} disabled={resendTimer > 0 || loading}
                  className="w-full flex items-center justify-center gap-1.5 text-slate-500 text-sm py-2 rounded-xl hover:text-indigo-600 transition-colors disabled:opacity-50">
                  <RefreshCw className="w-3.5 h-3.5" />
                  {resendTimer > 0 ? `Qayta yuborish (${resendTimer}s)` : 'Kodni qayta yuborish'}
                </button>
              </form>
            )}

            {/* ══ STEP: set-password ══════════════════════════════════════════════ */}
            {step === 'set-password' && (
              <form onSubmit={handleSetPassword} className="space-y-4">
                {/* New password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Yangi parol
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }}
                      placeholder="Kamida 6 ta belgi"
                      className="w-full pl-10 pr-12 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium"
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowNewPwd(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Parolni tasdiqlang
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                      placeholder="Parolni takrorlang"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium"
                    />
                  </div>
                  {newPassword && confirmPassword && (
                    <p className={`text-xs mt-1 ${newPassword === confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
                      {newPassword === confirmPassword ? '✓ Parollar mos' : '✗ Parollar mos emas'}
                    </p>
                  )}
                </div>

                <button type="submit" disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/25">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Parolni saqlash va kirish</span><ArrowRight className="w-4 h-4" /></>}
                </button>

                <button type="button" onClick={() => { setStep('code'); setError(''); }}
                  className="w-full text-slate-500 text-sm py-2 hover:text-slate-700 transition-colors">
                  ← Kodga qaytish
                </button>
              </form>
            )}

          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            © 2024 IT School · Exam Platform v2.0
          </p>
        </div>
      </div>
    </div>
  );
}
