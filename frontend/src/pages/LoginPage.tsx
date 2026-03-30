import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, TrendingUp } from 'lucide-react';
import api from '../lib/api';
import { useAdminStore } from '../store/useAdminStore';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAdminStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kirish amalga oshmadi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-primary-900 flex-col justify-between p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black text-white tracking-tight">Scholar Flow</span>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight tracking-tight">
            Unlock your<br />
            <span className="text-primary-400">intellectual potential.</span>
          </h2>
          <p className="text-slate-400 mt-4 text-sm leading-relaxed max-w-md">
            Empowering Education through Intelligence. One dashboard to rule your campus ecosystem.
          </p>
        </div>

        <div className="relative z-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 max-w-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Progress</p>
              <p className="text-xl font-black text-white">+24.8%</p>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
            <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '72%' }} />
          </div>
        </div>

        {/* BG Circles */}
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-primary-400/10 rounded-full blur-3xl" />
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md animate-in">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Xush kelibsiz</h1>
          <p className="text-slate-400 text-sm mt-1 mb-8">Platformaga kirish uchun ma'lumotlaringizni kiriting.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Email yoki Login</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@itschool.uz"
                  className="input pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="input-label mb-0">Parol</label>
                <button type="button" className="text-[10px] font-bold text-primary-600 uppercase tracking-wider hover:underline">
                  Parol esdan chiqdimi?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Kirilmoqda...' : 'Platformaga kirish'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            © 2024 Scholar Flow EdTech Solutions
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
