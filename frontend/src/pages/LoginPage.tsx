import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, TrendingUp, Phone, ChevronRight, MessageSquare, ShieldCheck, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
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
           showToast("Ushbu raqam tizimda mavjud emas.", "error");
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
      // Backend now returns { data: { user, access_token, ... } } because of TransformInterceptor
      const userData = responseData?.user || responseData?.data?.user;
      
      if (userData) {
        useAdminStore.getState().setUser(userData);
      } else {
        // Fallback to fetchMe if user info not in body
        await fetchMe();
      }
      
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
       await api.post('/auth/check-code', { phone: loginValue, code: verificationCode });
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
       navigate('/student/dashboard');
       showToast("Parol o'rnatildi va tizimga kirildi!", "success");
    } catch (err: any) {
       showToast(err.response?.data?.message || "Xatolik", "error");
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans text-slate-900">
      {/* Visual side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 p-16 flex-col justify-between overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#4f46e5,transparent_50%)] opacity-20" />
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#0ea5e9,transparent_50%)] opacity-20" />
         
         <div className="relative z-10 flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/10 p-2">
               <img 
                 src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Logo_IT_Park_Uzbekistan.svg/3840px-Logo_IT_Park_Uzbekistan.svg.png" 
                 alt="IT Park" 
                 className="w-full h-full object-contain"
               />
            </div>
            <span className="text-2xl font-black text-white tracking-widest uppercase">IT Academy <span className="text-indigo-400">CRM</span></span>
         </div>

         <div className="relative z-10">
            <h1 className="text-6xl font-black text-white leading-[1.1] mb-6">
               Kelajak <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">bugundan</span> boshlanadi.
            </h1>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
               Sizning butun o'quv jarayoningiz - darslar, imtihonlar va natijalar bitta aqlli tizimda.
            </p>
         </div>

         <div className="relative z-10 flex items-center gap-8 text-slate-500 font-bold text-xs uppercase tracking-widest">
            <div className="flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-emerald-500" />
               SECURE ACCESS
            </div>
            <div className="flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-indigo-500" />
               REALTIME SYNC
            </div>
         </div>
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 lg:bg-white">
         <div className="w-full max-w-md">
            <div className="mb-10 text-center lg:text-left">
               <div className="lg:hidden flex justify-center mb-6">
                  <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-lg p-2">
                     <img 
                       src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Logo_IT_Park_Uzbekistan.svg/3840px-Logo_IT_Park_Uzbekistan.svg.png" 
                       alt="IT Park" 
                       className="w-full h-full object-contain"
                     />
                  </div>
               </div>
               <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Tizimga kirish</h2>
               <p className="text-slate-500">Davom etish uchun ma'lumotlaringizni kiriting.</p>
            </div>

            <AnimatePresence mode="wait">
               {step === 'IDENTIFY' && (
                 <motion.form 
                   key="identify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                   onSubmit={handleIdentify} className="space-y-6"
                 >
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Login yoki Telefon</label>
                       <div className="relative group">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                             {isPhone(loginValue) ? <Phone className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                          </div>
                          <input 
                            type="text" value={loginValue} onChange={e => setLoginValue(e.target.value)} required
                            placeholder="Email yoki +998..."
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-4 pl-14 pr-6 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all font-bold text-slate-700"
                          />
                       </div>
                    </div>
                    <button disabled={loading || !loginValue} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-3xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                       {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'DAVOM ETISH'}
                       <ChevronRight className="w-5 h-5" />
                    </button>
                 </motion.form>
               )}

               {step === 'PASSWORD' && (
                 <motion.form 
                   key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                   onSubmit={handlePasswordLogin} className="space-y-6"
                 >
                    <button type="button" onClick={() => setStep('IDENTIFY')} className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-600 mb-2">
                       <ArrowLeft className="w-4 h-4" /> {loginValue}
                    </button>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Parolingizni kiriting</label>
                       <div className="relative group">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600" />
                          <input 
                            type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoFocus
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-4 pl-14 pr-14 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all font-bold text-slate-700"
                          />
                          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                             {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                       </div>
                    </div>
                    <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-3xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2">
                       {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'KIRISH'}
                    </button>

                    {isPhone(loginValue) && (
                       <div className="pt-4 border-t border-slate-100">
                          <p className="text-center text-xs text-slate-400 font-bold mb-4 uppercase tracking-widest">Muammo bormi?</p>
                          <button type="button" onClick={startTelegramFlow} className="w-full border-2 border-slate-100 hover:border-indigo-600 hover:text-indigo-600 rounded-2xl py-3 text-sm font-black transition-all flex items-center justify-center gap-3">
                             <MessageSquare className="w-5 h-5" /> TELEGRAM ORQALI TASDIQLASH
                          </button>
                       </div>
                    )}
                 </motion.form>
               )}

               {step === 'TELEGRAM_CODE' && (
                 <motion.form 
                    key="tg-code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleVerifyCode} className="space-y-6"
                 >
                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 mb-6">
                       <p className="text-sm font-bold text-indigo-900 leading-relaxed">
                          Biz sizning Telegramingizga 6 xonali tasdiqlash kodini yubordik. Iltimos uni quyida kiriting.
                       </p>
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tasdiqlash kodi</label>
                       <input 
                         type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                         placeholder="0 0 0 0 0 0" maxLength={6} required autoFocus
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-5 text-center text-3xl font-black tracking-[0.5em] focus:bg-white focus:border-indigo-600 focus:outline-none transition-all text-slate-700"
                       />
                    </div>
                    <button disabled={loading || verificationCode.length < 6} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-3xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2">
                       {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'KODNI TEKSHIRISH'}
                    </button>
                    <button type="button" onClick={() => setStep('PASSWORD')} className="w-full text-center text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">
                       ORTGA QAYTISH
                    </button>
                 </motion.form>
               )}

               {step === 'SET_PASSWORD' && (
                  <motion.form 
                    key="set-pw" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleFinalVerify} className="space-y-6"
                  >
                     <div className="mb-6">
                        <h3 className="text-xl font-black text-slate-900 mb-2">Yangi parol o'rnating</h3>
                        <p className="text-sm text-slate-500 font-medium">Endi siz ushbu parol orqali keyingi safar to'g'ridan-to'g'ri kirishingiz mumkin.</p>
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Yangi parol</label>
                        <input 
                          type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={4}
                          placeholder="••••••••" autoFocus
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-4 px-6 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all font-bold text-slate-700"
                        />
                     </div>
                     <button disabled={loading || !newPassword} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-3xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SAQLASH VA KIRISH'}
                     </button>
                  </motion.form>
               )}
            </AnimatePresence>

            <footer className="mt-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                © 2026 IT SCHOOL FLOW SECURITY SYSTEM v4.1
            </footer>
         </div>
      </div>
    </div>
  );
};

export default LoginPage;
