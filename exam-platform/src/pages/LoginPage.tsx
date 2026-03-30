import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Phone, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Simple basic validation
    if (!phone.trim() || !firstName.trim()) {
      setError('Iltimos qatorlarni to\'ldiring');
      return;
    }

    try {
      await login(phone, firstName);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 404) {
        setError('Telefon raqami yoki ismingiz noto\'g\'ri');
      } else {
        setError('Tizim xatoligi, qaytadan urinib ko\'ring');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-primary-100 rounded-full blur-[120px] -mr-[25vw] -mt-[10vh] animate-pulse opacity-50" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vh] bg-indigo-100 rounded-full blur-[100px] -ml-[20vw] -mb-[10vh] animate-pulse opacity-30" />

      <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-[3rem] p-10 md:p-14 space-y-12">
          
          <div className="text-center space-y-4">
            <div className="inline-flex justify-center items-center w-20 h-20 bg-primary-600 rounded-[2rem] shadow-xl shadow-primary-200 mb-4 rotate-3 animate-bounce shadow-inner border-4 border-white/20">
              <LogIn className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Imtihon Portal</h1>
            <p className="text-slate-400 font-semibold text-sm uppercase tracking-widest px-4">Talabalar uchun yagona platforma</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2 group">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2 group-focus-within:text-primary-600 transition-colors">Telefon</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"><Phone className="w-5 h-5" /></span>
                  <input 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998 00 000 00 00"
                    type="text" 
                    className="w-full bg-slate-100 border-2 border-transparent focus:border-primary-500 rounded-2xl py-5 pl-14 pr-6 text-lg font-bold text-slate-800 outline-none transition-all placeholder:text-slate-300 shadow-inner" 
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2 group-focus-within:text-primary-600 transition-colors">Ism (Tasdiqlash uchun)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"><UserIcon className="w-5 h-5" /></span>
                  <input 
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Masalan: Ali"
                    type="text" 
                    className="w-full bg-slate-100 border-2 border-transparent focus:border-primary-500 rounded-2xl py-5 pl-14 pr-6 text-lg font-bold text-slate-800 outline-none transition-all placeholder:text-slate-300 shadow-inner" 
                  />
                </div>
              </div>
            </div>

            <button 
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white py-5 rounded-2xl text-xl font-black shadow-2xl shadow-primary-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Tizimga Kirish'}
            </button>
          </form>

          <div className="text-center pt-8 border-t border-slate-50 italic">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-tighter">Powered by IT School AI Engine v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
