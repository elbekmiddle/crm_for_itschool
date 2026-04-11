import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, Lock, Eye, EyeOff,
  Loader2, AlertCircle, CheckCircle2,
  RefreshCw, Send, ChevronRight,
  ShieldCheck, GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

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

  const didRedirect = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || didRedirect.current) return;
    didRedirect.current = true;
    navigate('/dashboard', { replace: true });
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
    setLoading(true);
    try {
      await loginWithPassword(normalizedPhone, password, 'student');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.data?.message || err.message || '';
      setError(msg || "Telefon raqam yoki parol noto'g'ri");
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
    setError('');
    if (code.length < 6) { setError("6 ta raqamli kodni kiriting"); return; }
    setLoading(true);
    try {
      const digits = code.replace(/\D/g, '');
      await api.post('/auth/check-code', { phone: normalizePhone(phone), code: digits });
      setStep('set-password');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.data?.message || '';
      setError(msg || "Kod noto'g'ri. Telegram botdan tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 4: Set new password ─────────────────────────────────────────────────
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError("Parol kamida 6 ta belgi bo'lishi kerak"); return; }
    if (newPassword !== confirmPassword) { setError("Parollar mos emas"); return; }
    setLoading(true);
    try {
      await verifyCode(normalizePhone(phone), code, newPassword);
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
    'main': 'Tizimga Kirish',
    'code': 'Tasdiqlash Kodi',
    'set-password': 'Parol O\'rnatish',
  };

  return (
    <div className="min-h-screen flex bg-[#f4f3ec] overflow-hidden font-sans text-[#08060d]">
      {/* ── Left: yorug‘ rejim — teacher CRM light palette bilan mos ── */}
      <div className="relative hidden min-h-screen w-full overflow-hidden bg-[#f4f3ec] lg:flex lg:w-3/5">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/uzbek-hero.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/92 via-[#f5f0ff]/88 to-[#ece0ff]/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f4f3ec] via-transparent to-white/50" />
        <div className="relative z-10 flex min-h-screen w-full flex-col justify-between p-12 xl:p-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-5"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-white/95 p-3 ring-1 ring-white/25">
              <img src="/images/logo.png" alt="IT School" className="h-full w-full object-contain" />
            </div>
            <span className="text-2xl font-black uppercase leading-none tracking-tight text-[#08060d] xl:text-3xl">
              IT SCHOOL
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55 }}
            className="mt-auto max-w-lg pt-12 xl:pt-20"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[#e5e4e7]">
                <GraduationCap className="h-7 w-7 text-[#9329e6]" strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#661a9e]/90">
                Nexus Engine · onlayn imtihon
              </span>
            </div>
            <p className="text-lg font-bold leading-relaxed text-[#2d2640] xl:text-xl">
              CRM kabinetingiz bilan bir xil xavfsiz kirish: telefon, parol va Telegram tasdiqlash.
            </p>
            <p className="mt-4 text-sm font-medium text-[#6b6375]">
              IT School · bilim va natijalar bir joyda
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f4f3ec] relative overflow-hidden">
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-[#aa3bff]/15 rounded-full blur-[80px] -mr-32 -mt-32" />
        
        <div className="w-full max-w-lg relative z-10">

          {/* Logo (mobile only) */}
          <div className="mb-12 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2.5 shadow-sm">
               <img src="/images/logo.png" alt="IT School" className="h-full w-full object-contain" />
            </div>
            <span className="text-2xl font-black uppercase tracking-tight text-[#08060d]">IT SCHOOL</span>
          </div>

          <div className="rounded-[3rem] border border-[#e5e4e7] bg-white/95 p-12 shadow-[0_24px_48px_-12px_rgba(80,40,120,0.12)] backdrop-blur-xl">
            {/* Step indicator */}
            <div className="mb-12">
              <div className="flex items-center gap-4">
                {(['main', 'code', 'set-password'] as Step[]).map((s, i) => (
                  <div 
                    key={s} 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500 flex-1",
                      s === step ? "bg-[#aa3bff] shadow-[0_0_12px_rgba(170,59,255,0.35)]" : 
                      (['main', 'code', 'set-password'] as Step[]).indexOf(step) > i ? "bg-emerald-500" : "bg-[#e5e4e7]"
                    )} 
                  />
                ))}
              </div>
              <div className="flex justify-between items-center mt-10">
                 <div>
                    <h2 className="text-4xl font-black text-[#08060d] tracking-tight mb-2">{stepTitle[step]}</h2>
                    <p className="text-[#6b6375] font-medium text-sm">
                      {step === 'main' && 'Nexus Engine onlayn. Ma\'lumotlarni kiriting.'}
                      {step === 'code' && 'Tasdiqlash kodi Telegram botga yuborildi.'}
                      {step === 'set-password' && 'Akkauntingiz uchun maxfiy parol kiriting.'}
                    </p>
                 </div>
                 <div className="w-14 h-14 bg-[#f5f0ff] rounded-[1.5rem] flex items-center justify-center ring-1 ring-[#ece0ff]">
                    {step === 'main' && <ShieldCheck className="w-7 h-7 text-[#9329e6]" />}
                    {step === 'code' && <Send className="w-7 h-7 text-[#9329e6]" />}
                    {step === 'set-password' && <Lock className="w-7 h-7 text-[#9329e6]" />}
                 </div>
              </div>
            </div>

            {/* Notifications / Errors */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mb-8 flex items-start gap-4 bg-red-50 text-red-600 rounded-2xl p-5 text-sm border border-red-100 font-bold"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
              {info && !error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mb-8 flex items-start gap-4 bg-emerald-50 text-emerald-700 rounded-2xl p-5 text-sm border border-emerald-100 font-bold"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{info}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ══ STEP: main ══════════════════════════════════════════════════════ */}
            {step === 'main' && (
              <form onSubmit={handleMainLogin} className="space-y-6">
                <p className="text-xs font-bold text-[#6b6375] -mt-1 leading-relaxed rounded-2xl border border-[#ece0ff] bg-[#faf9ff] px-4 py-3">
                  Faqat <span className="text-[#9329e6]">talaba</span> akkaunti bilan kiring (CRM uchun alohida dastur).
                </p>
                <div>
                  <label className="block text-[10px] font-black text-[#6b6375] uppercase tracking-[0.3em] mb-3 ml-1">
                    Telefon Raqam
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6375] group-focus-within:text-[#aa3bff] transition-colors" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => { setPhone(e.target.value); setError(''); }}
                      placeholder="+998 90 123 45 67"
                      className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-[#e5e4e7] bg-white text-[#08060d] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#aa3bff] transition-all text-sm font-black shadow-inner"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#6b6375] uppercase tracking-[0.3em] mb-3 ml-1">
                    Parol
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6375] group-focus-within:text-[#aa3bff] transition-colors" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="••••••••"
                      className="w-full pl-14 pr-14 py-4 rounded-2xl border-2 border-[#e5e4e7] bg-white text-[#08060d] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#aa3bff] transition-all text-sm font-black shadow-inner"
                      required
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-[#6b6375] hover:text-[#08060d] transition-colors">
                      {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-4 bg-[#aa3bff] hover:bg-[#9329e6] disabled:opacity-60 text-white font-black py-5 rounded-2xl active:scale-[0.98] transition-[background-color,transform] duration-200 uppercase tracking-widest text-xs mt-6">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Tizimga Kirish</span><ChevronRight className="w-5 h-5" /></>}
                </button>

                {/* Reset Flow Toggle */}
                <div className="pt-8 mt-4 border-t border-[#e5e4e7]">
                   <button type="button" onClick={handleSendCode} disabled={loading}
                     className="w-full flex items-center justify-center gap-3 text-[#9329e6] font-black text-[10px] uppercase tracking-[0.2em] py-5 rounded-2xl border-2 border-[#ece0ff] bg-[#faf9ff] hover:bg-[#f5f0ff] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                     <Send className="w-4 h-4" />
                     Parolni unutdingizmi? (Telegram orqali)
                   </button>
                </div>
              </form>
            )}

            {/* ══ STEP: code ══════════════════════════════════════════════════════ */}
            {step === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-8">
                <div className="flex items-center gap-4 rounded-2xl border-2 border-[#e5e4e7] bg-white px-6 py-5 shadow-inner">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-100">
                     <Phone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-[#08060d] text-lg font-black tracking-widest">{phone}</span>
                  <button type="button" onClick={() => { setStep('main'); setCode(''); setError(''); }}
                    className="ml-auto text-[#9329e6] text-[10px] font-black uppercase tracking-widest hover:underline">
                    Xato?
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#6b6375] uppercase tracking-[0.3em] mb-4 text-center">
                    6 Xonali Kod
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                    placeholder="000 000"
                    className="w-full py-6 rounded-[2rem] border-2 border-[#e5e4e7] bg-white text-[#08060d] focus:outline-none focus:border-[#aa3bff] text-center text-5xl font-black tracking-[0.3em] shadow-inner placeholder:text-[#e5e4e7]"
                    autoFocus
                  />
                  <p className="mt-6 text-center text-[10px] font-black uppercase leading-relaxed tracking-[0.15em] text-[#6b6375]">
                    Telegram bot orqali yuborilgan <br /> 6 xonali tasdiqlash kodini kiriting
                  </p>
                </div>

                <button type="submit" disabled={loading || code.length < 6}
                  className="w-full flex items-center justify-center gap-4 bg-[#aa3bff] hover:bg-[#9329e6] disabled:opacity-60 text-white font-black py-5 rounded-2xl active:scale-[0.98] transition-[background-color,transform] duration-200 uppercase tracking-widest text-xs">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Kodini Tasdiqlash</span>}
                </button>

                <button type="button" onClick={handleResend} disabled={resendTimer > 0 || loading}
                  className="w-full flex items-center justify-center gap-3 text-[#6b6375] font-black text-[10px] uppercase tracking-widest hover:text-[#9329e6] transition-colors py-2">
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                  {resendTimer > 0 ? `Qayta yuborish (${resendTimer}s)` : 'Kodni qayta yuborish'}
                </button>
              </form>
            )}

            {/* ══ STEP: set-password ══════════════════════════════════════════════ */}
            {step === 'set-password' && (
              <form onSubmit={handleSetPassword} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-[#6b6375] uppercase tracking-[0.3em] mb-3 ml-1">
                    Yangi Parol
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6375] group-focus-within:text-[#aa3bff] transition-colors" />
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }}
                      placeholder="Kamida 6 ta belgi"
                      className="w-full pl-14 pr-14 py-4 rounded-2xl border-2 border-[#e5e4e7] bg-white text-[#08060d] focus:outline-none focus:border-[#aa3bff] transition-all text-sm font-black shadow-inner"
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowNewPwd(v => !v)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-[#6b6375] hover:text-[#08060d]">
                      {showNewPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#6b6375] uppercase tracking-[0.3em] mb-3 ml-1">
                    Tasdiqlash
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6375] group-focus-within:text-[#aa3bff] transition-colors" />
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                      placeholder="Parolni takrorlang"
                      className="w-full pl-14 pr-14 py-4 rounded-2xl border-2 border-[#e5e4e7] bg-white text-[#08060d] focus:outline-none focus:border-[#aa3bff] transition-all text-sm font-black shadow-inner"
                    />
                  </div>
                  {newPassword && confirmPassword && (
                    <p className={cn("text-[9px] font-black uppercase tracking-widest mt-3 ml-1", newPassword === confirmPassword ? 'text-emerald-500' : 'text-red-500')}>
                      {newPassword === confirmPassword ? '✓ Parollar mos keladi' : '✗ Parollar mos emas'}
                    </p>
                  )}
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                    className="w-full flex items-center justify-center gap-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black py-5 rounded-2xl active:scale-[0.98] transition-[background-color,transform] duration-200 uppercase tracking-widest text-xs">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Parolni O'rnatish va Kirish</span>}
                  </button>
                </div>

                <button type="button" onClick={() => { setStep('code'); setError(''); }}
                  className="w-full text-[#6b6375] font-black text-[10px] uppercase tracking-widest hover:text-[#9329e6] transition-colors mt-2">
                  ← Orqaga (Kodni tahrirlash)
                </button>
              </form>
            )}

          </div>

          <div className="mt-12 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6b6375]/70">
              IT School · Exam Platform
            </p>
            <div className="flex justify-center gap-6 mt-4 opacity-20">
               <span className="w-1.5 h-1.5 bg-[#aa3bff] rounded-full" />
               <span className="w-1.5 h-1.5 bg-[#aa3bff] rounded-full" />
               <span className="w-1.5 h-1.5 bg-[#aa3bff] rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

