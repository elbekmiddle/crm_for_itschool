import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/useAdminStore';
import api from '../lib/api';
import { LogIn, Lock, Mail, Loader2, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/Button';

const LoginPage = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAdminStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      // Store token in localStorage
      localStorage.setItem('token', data.accessToken);
      
      // Update store and sessionStorage via setUser
      setUser(data.user);
      
      // Clear timeout and navigate
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login xato! Email yoki parolni tekshiring.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vh] bg-primary-100 rounded-full blur-[120px] -mr-20 -mt-20 opacity-40 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[30vw] h-[30vh] bg-indigo-100 rounded-full blur-[100px] -ml-10 -mb-10 opacity-30 animate-pulse delay-700" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 backdrop-blur-xl p-16 rounded-[4rem] max-w-md w-full text-center space-y-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-white relative z-10"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-primary-600 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-primary-100 rotate-6">
            IT
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase underline decoration-primary-600 decoration-8 underline-offset-8">Admin Kirish</h1>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-red-50 border border-red-100 text-red-600 text-xs font-black uppercase rounded-2xl tracking-widest"
          >
            {error}
          </motion.div>
        )}
        
        <form className="space-y-8" onSubmit={handleLogin}>
          <div className="space-y-4">
             <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                <input 
                   name="email" 
                   placeholder="Email" 
                   type="email" 
                   autoComplete="email"
                   required 
                   className="w-full p-6 pl-16 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none focus:border-primary-500 font-bold text-lg transition-all" 
                />
             </div>
             <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                <input 
                   name="password" 
                   placeholder="Parol" 
                   type="password" 
                   autoComplete="current-password"
                   required 
                   className="w-full p-6 pl-16 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none focus:border-primary-500 font-bold text-lg transition-all" 
                />
             </div>
          </div>
          <Button isLoading={isLoading} type="submit" className="w-full py-8 rounded-[2rem] text-lg uppercase font-black">
             Tizimga Kirish
          </Button>
        </form>
        
        <div className="flex items-center justify-center gap-2">
           <div className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-ping" />
           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">© 2026 IT School ERP v2.0</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
