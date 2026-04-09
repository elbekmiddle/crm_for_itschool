import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, Phone, ChevronRight, MessageSquare, ShieldCheck, ArrowLeft, Zap } from 'lucide-react';
import api from '../lib/api';
import { reconnectRealtimeSocket } from '../lib/realtimeSocket';
import { useAdminStore } from '../store/useAdminStore';
import { useToast } from '../context/ToastContext';

type LoginStep = 'IDENTIFY' | 'PASSWORD' | 'TELEGRAM_CODE' | 'SET_PASSWORD';

const LoginPage: React.FC = () => {
  const { showToast } = useToast();
  const [loginValue, setLoginValue] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>('IDENTIFY');
  
  // Telegram flow state
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [studentInfo, setStudentInfo] = useState<any>(null);

  const { fetchMe } = useAdminStore();
  const navigate = useNavigate();

  const isPhone = (val: string) => /^\+?[0-9]{7,15}$/.test(val.replace(/\s/g, ''));

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginValue) return;
    
    setLoading(true);
    try {
      if (isPhone(loginValue)) {
        const { data } = await api.post('/auth/check-phone', { phone: loginValue });
        setStudentInfo(data);
        if (data.exists) {
          setStep('PASSWORD');
        } else {
          showToast(data.message || "Ushbu raqam tizimda mavjud emas.", "error");
        }
      } else {
        // Assume email/admin
        setStep('PASSWORD');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Xatolik yuz berdi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isPhone(loginValue) ? '/auth/student-login-password' : '/auth/login';
      const payload = isPhone(loginValue) ? { phone: loginValue, password } : { email: loginValue, password };
      
      const { data: responseData } = await api.post(endpoint, payload);
      const userData = responseData?.user || responseData?.user || responseData?.data?.user;
      
      if (userData) {
        useAdminStore.getState().setUser(userData);
      } else {
        await fetchMe();
      }

      reconnectRealtimeSocket();

      const updatedUser = useAdminStore.getState().user;
      if (!updatedUser) {
        throw new Error("Foydalanuvchi ma'lumotlarini yuklab bo'lmadi");
      }
      
      const routes: Record<string, string> = {
        'ADMIN': '/admin/dashboard',
        'MANAGER': '/manager/dashboard',
        'TEACHER': '/teacher/dashboard',
        'STUDENT': '/student/dashboard'
      };
      navigate(routes[updatedUser.role] || '/dashboard');
      showToast("Xush kelibsiz!", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Parol noto'g'ri", "error");
    } finally {
      setLoading(false);
    }
  };

  const startTelegramFlow = async () => {
     setLoading(true);
     try {
        await api.post('/auth/send-verify-code', { phone: loginValue });
        setStep('TELEGRAM_CODE');
        showToast("Kod Telegramga yuborildi", "success");
     } catch (err: any) {
        showToast(err.response?.data?.message || "Telegram kodini yuborib bo'lmadi", "error");
     } finally {
        setLoading(false);
     }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
       await api.post('/auth/check-code', {
         phone: loginValue,
         code: verificationCode.replace(/\D/g, ''),
       });
       setStep('SET_PASSWORD');
    } catch (err: any) {
       showToast(err.response?.data?.message || "Kod noto'g'ri", "error");
    } finally {
       setLoading(false);
    }
  };

  const handleFinalVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
       await api.post('/auth/verify-code', { phone: loginValue, code: verificationCode, password: newPassword });
       await fetchMe();
       reconnectRealtimeSocket();
       navigate('/student/dashboard');
       showToast("Parol o'rnatildi va tizimga kirildi!", "success");
    } catch (err: any) {
       showToast(err.response?.data?.message || "Xatolik", "error");
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans text-[#08060d]">
      {/* Visual side — faqat fon rasmi, gradient va logo */}
      <div className="hidden lg:flex lg:w-3/5 relative min-h-screen overflow-hidden bg-[#08060d]">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: "url('/images/uzbek-hero.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#08060d]/88 via-[#1e1b4b]/80 to-[#4c1d95]/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08060d] via-transparent to-[#08060d]/40" />
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-5"
          >
            <div className="w-16 h-16 bg-white/95 rounded-[1.35rem] flex items-center justify-center p-3 ring-1 ring-white/25 shrink-0">
              <img src="/images/logo.png" alt="IT School" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-black text-2xl xl:text-3xl tracking-tight uppercase leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
              IT SCHOOL
            </span>
          </motion.div>
          <div className="pointer-events-none opacity-0" aria-hidden />
        </div>
      </div>

      {/* Form side — yorug‘ fon, dark tema global h2 rangini bekor qilish */}
      <div className="login-form-panel flex-1 flex items-center justify-center p-12 bg-[#f8fafc] lg:bg-white text-slate-900 relative overflow-hidden [color-scheme:light]">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#aa3bff]/6 rounded-full blur-[100px] pointer-events-none" />
         
         <div className="w-full max-w-md relative z-10">
            <div className="mb-10 text-center lg:text-left">
               <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                  <div className="w-14 h-14 bg-white border border-slate-200 rounded-[1.25rem] flex items-center justify-center p-2.5 shadow-sm">
                     <img src="/images/logo.png" alt="IT School" className="w-full h-full object-contain" />
                  </div>
                  <span className="font-black text-xl uppercase tracking-tight text-slate-900">IT SCHOOL</span>
               </div>
               <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-3">Tizimga kirish</h2>
               <p className="login-subtitle text-base font-medium leading-snug max-w-md">Login yoki telefon bilan kiring.</p>
            </div>

            <AnimatePresence mode="wait">
               {step === 'IDENTIFY' && (
                 <motion.form 
                   key="identify" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                   onSubmit={handleIdentify} className="space-y-8"
                 >
                    <div>
                       <label className="text-[11px] font-black text-[#6b6375] uppercase tracking-[0.2em] mb-3 block">Login yoki Telefon raqami</label>
                       <div className="relative group">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#6b6375] group-focus-within:text-[#aa3bff] transition-all duration-300">
                             {isPhone(loginValue) ? <Phone className="w-6 h-6 border-r pr-2 border-[#e5e4e7]" /> : <Mail className="w-6 h-6 border-r pr-2 border-[#e5e4e7]" />}
                          </div>
                          <input 
                            type="text" value={loginValue} onChange={e => setLoginValue(e.target.value)} required
                            placeholder="Email yoki +998..."
                            className="w-full bg-[#f4f3ec]/50 border-2 border-transparent rounded-[2rem] py-5 pl-16 pr-8 focus:bg-white focus:border-[#aa3bff] focus:outline-none transition-all duration-500 font-bold text-[#08060d] shadow-inner placeholder:opacity-50"
                          />
                       </div>
                    </div>
                    <button disabled={loading || !loginValue} className="w-full bg-[#08060d] hover:bg-[#aa3bff] text-white font-black py-5 rounded-[2rem] transition-[background-color,transform] duration-200 flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50 relative group overflow-hidden">
                       <span className="relative z-10 uppercase tracking-widest">{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Identifikatsiya'}</span>
                       {!loading && <ChevronRight className="w-6 h-6 relative z-10 transition-transform group-hover:translate-x-2" />}
                       <div className="absolute inset-0 bg-gradient-to-r from-[#aa3bff] to-[#c084fc] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </button>
                 </motion.form>
               )}

               {step === 'PASSWORD' && (
                 <motion.form 
                   key="password" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                   onSubmit={handlePasswordLogin} className="space-y-8"
                 >
                    <button type="button" onClick={() => setStep('IDENTIFY')} className="flex items-center gap-3 text-xs font-black text-[#6b6375] hover:text-[#aa3bff] mb-4 transition-colors group">
                       <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> <span className="opacity-60">{loginValue}</span>
                    </button>
                    <div>
                       <label className="text-[11px] font-black text-[#6b6375] uppercase tracking-[0.2em] mb-3 block">Shaxsiy parolingiz</label>
                       <div className="relative group">
                          <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#6b6375] group-focus-within:text-[#aa3bff] border-r pr-2 border-[#e5e4e7]" />
                          <input 
                            type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoFocus
                            placeholder="••••••••"
                            className="w-full bg-[#f4f3ec]/50 border-2 border-transparent rounded-[2rem] py-5 pl-16 pr-16 focus:bg-white focus:border-[#aa3bff] focus:outline-none transition-all duration-500 font-bold text-[#08060d] shadow-inner"
                          />
                          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#6b6375] hover:text-[#aa3bff] transition-colors">
                             {showPw ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                          </button>
                       </div>
                    </div>
                    <button disabled={loading} className="w-full bg-[#aa3bff] hover:bg-[#9329e6] text-white font-black py-5 rounded-[2rem] transition-[background-color,transform] duration-200 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest relative overflow-hidden group">
                       <span className="relative z-10">{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Tizimga kirish'}</span>
                       {!loading && <Zap className="w-5 h-5 relative z-10 animate-pulse" />}
                       <div className="absolute inset-0 bg-[#08060d] opacity-0 group-hover:opacity-10 transition-opacity" />
                    </button>

                    {isPhone(loginValue) && (
                       <div className="pt-8 border-t border-[#e5e4e7]">
                          <p className="text-center text-[10px] text-[#6b6375] font-black mb-6 uppercase tracking-widest opacity-40 italic">Muqobil Kirish Usullari</p>
                          <button type="button" onClick={startTelegramFlow} className="w-full border-2 border-[#e5e4e7] hover:border-[#aa3bff] hover:text-[#aa3bff] rounded-[2rem] py-4 text-sm font-black transition-all duration-300 flex items-center justify-center gap-4 bg-white shadow-sm hover:shadow-xl active:scale-95 group">
                             <MessageSquare className="w-5 h-5 text-sky-500 group-hover:scale-110 transition-transform" /> <span>TELEGRAM TASDIQLASH</span>
                          </button>
                       </div>
                    )}
                 </motion.form>
               )}

               {step === 'TELEGRAM_CODE' && (
                 <motion.form 
                    key="tg-code" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                    onSubmit={handleVerifyCode} className="space-y-8"
                 >
                    <div className="bg-[#aa3bff]/5 p-8 rounded-[2rem] border border-[#aa3bff]/10 mb-8 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-[#aa3bff]/10 rounded-full blur-2xl -mr-16 -mt-16" />
                       <p className="text-sm font-bold text-[#4f147a] leading-relaxed relative z-10 flex items-start gap-3">
                          <MessageSquare className="w-5 h-5 shrink-0" />
                          <span>Sizning Telegramingizga 6 xonali tasdiqlash kodi yuborildi. Hisobingiz xavfsizligi uchun kodni kiriting.</span>
                       </p>
                    </div>
                    <div>
                       <label className="text-[11px] font-black text-[#6b6375] uppercase tracking-[0.2em] mb-4 block text-center">Tasdiqlash kodi</label>
                       <input 
                         type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                         placeholder="0 0 0 0 0 0" maxLength={6} required autoFocus
                         className="w-full bg-[#f4f3ec]/50 border-2 border-transparent rounded-[2.5rem] py-7 text-center text-5xl font-black tracking-[0.6em] focus:bg-white focus:border-[#aa3bff] focus:outline-none transition-all duration-500 text-[#08060d] shadow-xl placeholder:opacity-20"
                       />
                    </div>
                    <button disabled={loading || verificationCode.length < 6} className="w-full bg-[#aa3bff] hover:bg-[#9329e6] text-white font-black py-5 rounded-[2rem] transition-all duration-500 shadow-2xl shadow-[#aa3bff]/30 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest">
                       {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'KODNI TASDIQLASH'}
                    </button>
                    <button type="button" onClick={() => setStep('PASSWORD')} className="w-full text-center text-xs font-black text-[#6b6375] hover:text-[#08060d] uppercase tracking-[0.2em] opacity-60 hover:opacity-100 transition-all">
                       ORTGA QAYTISH
                    </button>
                 </motion.form>
               )}

               {step === 'SET_PASSWORD' && (
                  <motion.form 
                    key="set-pw" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                    onSubmit={handleFinalVerify} className="space-y-8"
                  >
                     <div className="mb-8">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-emerald-500/10 shadow-xl border border-emerald-200 animate-bounce">
                           <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-3xl font-black text-[#08060d] mb-3 tracking-tight">Xavfsiz parol o'rnating</h3>
                        <p className="text-[#6b6375] text-lg font-medium leading-relaxed">Endi siz ushbu parol orqali keyingi safar to'g'ridan-to'g'ri tizimga kirishingiz mumkin.</p>
                     </div>
                     <div>
                        <label className="text-[11px] font-black text-[#6b6375] uppercase tracking-[0.2em] mb-3 block">Yangi shaxsiy parol</label>
                        <input 
                          type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={4}
                          placeholder="••••••••" autoFocus
                          className="w-full bg-[#f4f3ec]/50 border-2 border-transparent rounded-[2rem] py-5 px-8 focus:bg-white focus:border-[#aa3bff] focus:outline-none transition-all duration-500 font-bold text-[#08060d] shadow-inner"
                        />
                     </div>
                     <button disabled={loading || !newPassword} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-5 rounded-[2rem] transition-all duration-500 shadow-2xl shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest group">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'SAQLASH VA DASHBOARDGA KIRISH'}
                        {!loading && <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />}
                     </button>
                  </motion.form>
               )}
            </AnimatePresence>

            <footer className="mt-20 flex flex-col items-center gap-6">
               <div className="flex items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                  <img src="https://it-park.uz/storage/images/logo.png" className="h-6" alt="IT Park" />
               </div>
               <div className="text-[10px] font-black text-[#6b6375] uppercase tracking-[0.4em] opacity-40 text-center leading-relaxed">
                  © 2026 SCHOLAR FLOW ECOSYSTEM <br/> SECURE ENGINE v4.2.1
               </div>
            </footer>
         </div>
      </div>
    </div>
  );
};

export default LoginPage;

