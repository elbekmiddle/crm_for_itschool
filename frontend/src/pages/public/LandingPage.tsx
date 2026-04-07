import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Phone, User, MonitorPlay, ArrowRight } from 'lucide-react';
import api from '../../lib/api';

const LandingPage: React.FC = () => {
   const navigate = useNavigate();
   const [form, setForm] = useState({ first_name: '', phone: '', course_id: '' });
   const [status, setStatus] = useState<null|string>(null);

   const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       try {
           await api.post('/leads', { ...form, source: 'site' });
           setStatus('success');
       } catch (e: any) {
           setStatus('error');
       }
   };

   return (
       <div className="min-h-screen font-sans bg-slate-50">
           {/* Header */}
           <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 fixed top-0 w-full z-50">
               <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                     <GraduationCap className="text-primary-600 w-8 h-8" />
                     <h1 className="font-black text-slate-800 text-xl tracking-tight">IT School</h1>
                  </div>
                  <nav className="hidden md:flex items-center gap-6 font-bold text-sm text-slate-500">
                     <a href="#" className="hover:text-primary-600 transition-colors">Kurslar</a>
                     <a href="/blog" className="hover:text-primary-600 transition-colors">Blog</a>
                  </nav>
                  <div className="flex gap-3">
                     <button onClick={() => navigate('/crm')} className="px-5 py-2 font-bold text-slate-600 hover:text-primary-600">Tizimga kirish</button>
                  </div>
               </div>
           </header>

           {/* Hero */}
           <section className="pt-32 pb-20 px-4 text-center">
              <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-loose mb-6">
                 Kelajak Kasbini <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-indigo-600">IT School</span> Bilan Boshlang!
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium mb-10">Zamonaviy ta'lim, amaliy loyihalar va sun'iy intellekt imtihon tizimi orqali IT sohasi bo'yicha kuchli mutaxassis bo'lib yetishing.</p>
              
              {/* Lead Form */}
              <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 text-left border border-slate-100">
                 <h3 className="text-xl font-black text-slate-800 mb-6">Bepul Konsultatsiya</h3>
                 
                 {status === 'success' ? (
                     <div className="p-4 bg-green-50 text-green-700 rounded-xl font-bold flex items-center gap-3">✅ Arizangiz qabul qilindi! Menejerlar tez orada bog'lanishadi.</div>
                 ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                           <label className="text-xs font-bold text-slate-500 mb-1 block">Ismingiz</label>
                           <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input required type="text" className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 border border-transparent transition-all" placeholder="Ism familiya" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
                           </div>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-500 mb-1 block">Telefon</label>
                           <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input required type="text" className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 border border-transparent transition-all" placeholder="+998 90 123 45 67" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                           </div>
                        </div>
                        <button type="submit" className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-xl shadow-lg shadow-primary-200 flex items-center justify-center gap-2 transition-all">Ro'yxatdan o'tish <ArrowRight className="w-5 h-5" /></button>
                        {status === 'error' && <p className="text-xs text-red-500 text-center font-bold">Xatolik. Raqam band bo'lishi mumkin.</p>}
                    </form>
                 )}
              </div>
           </section>
       </div>
   );
};

export default LandingPage;
