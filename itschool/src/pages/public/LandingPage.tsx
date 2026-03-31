import React, { useState } from 'react';
import { GraduationCap, Phone, User, MonitorPlay, ArrowRight, Briefcase, Star, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

const fetchCourses = async () => (await api.get('/courses')).data;
const fetchVacancies = async () => (await api.get('/vacancies')).data;

const LandingPage: React.FC = () => {
   const [form, setForm] = useState({ first_name: '', phone: '', course_id: '' });
   const [status, setStatus] = useState<null|string>(null);
   
   const [vacForm, setVacForm] = useState({ name: '', phone: '', resume_url: '', vacancy_id: '' });
   const [vacStatus, setVacStatus] = useState<null|string>(null);

   const { data: courses } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses });
   const { data: vacancies } = useQuery({ queryKey: ['vacancies'], queryFn: fetchVacancies });

   const handleLeadSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       try {
           await api.post('/leads', { ...form, source: 'site' });
           setStatus('success');
       } catch (e: any) {
           setStatus('error');
       }
   };

   const handleVacancySubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       try {
           await api.post('/vacancies/apply', vacForm);
           setVacStatus('success');
       } catch (e: any) {
           setVacStatus('error');
       }
   };

   return (
       <div className="min-h-screen font-sans bg-slate-50">
           {/* Header */}
           <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 fixed top-0 w-full z-50">
               <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                     <GraduationCap className="text-primary-600 w-8 h-8" />
                     <h1 className="font-black text-slate-800 text-xl tracking-tight">IT School</h1>
                  </div>
                  <nav className="hidden md:flex items-center gap-6 font-bold text-sm text-slate-500">
                     <a href="#courses" className="hover:text-primary-600 transition-colors">Kurslar</a>
                     <a href="#about" className="hover:text-primary-600 transition-colors">Markaz Haqida</a>
                     <a href="#vacancies" className="hover:text-primary-600 transition-colors">Vakansiyalar</a>
                     <a href="http://blog.itschool.uz" className="hover:text-primary-600 transition-colors">Blog</a>
                  </nav>
                  <div className="flex gap-3">
                     <a href="http://student.itschool.uz" className="px-5 py-2 font-bold text-slate-600 hover:text-primary-600 border border-slate-200 rounded-xl">O'quvchi orqali kirish</a>
                     <a href="http://crm.itschool.uz" className="px-5 py-2 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl">Xodim kirishi</a>
                  </div>
               </div>
           </header>

           {/* Hero Section */}
           <section className="pt-36 pb-20 px-4 text-center bg-white border-b border-slate-100">
              <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-loose mb-6">
                 Kelajak Kasbini <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-indigo-600">IT School</span> Bilan Boshlang!
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium mb-12">O'zbekistondagi eng zamonaviy o'quv markaz. Bizning sun'iy intellekt imtihon tizimimiz va real loyihalar uslubida o'qitishimiz sizga 100% amaliy bilim beradi.</p>
              
              <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-2xl shadow-slate-200/50 text-left border border-slate-100">
                 <h3 className="text-xl font-black text-slate-800 mb-6">Konsultatsiyaga yozilish</h3>
                 {status === 'success' ? (
                     <div className="p-4 bg-green-50 text-green-700 rounded-xl font-bold flex items-center gap-3"><CheckCircle className="w-5 h-5"/> Arizangiz qabul qilindi!</div>
                 ) : (
                    <form onSubmit={handleLeadSubmit} className="space-y-4">
                        <div>
                           <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input required type="text" className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium" placeholder="Ism familiya" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
                           </div>
                        </div>
                        <div>
                           <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input required type="text" className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium" placeholder="+998 90 123 45 67" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                           </div>
                        </div>
                        {courses && courses.length > 0 && (
                            <select className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium" value={form.course_id} onChange={e => setForm({...form, course_id: e.target.value})}>
                               <option value="">Kursni tanlang (Ixtiyoriy)</option>
                               {courses.map((c: any) => (
                                   <option key={c.id} value={c.id}>{c.name}</option>
                               ))}
                            </select>
                        )}
                        <button type="submit" className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all">Bepul konsultatsiya <ArrowRight className="w-5 h-5" /></button>
                    </form>
                 )}
              </div>
           </section>

           {/* About & Features */}
           <section id="about" className="py-24 px-4 bg-slate-50">
              <div className="max-w-6xl mx-auto">
                 <div className="text-center mb-16">
                    <h2 className="text-3xl font-black text-slate-800">Nima uchun IT School?</h2>
                 </div>
                 <div className="grid md:grid-cols-3 gap-8">
                     <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
                         <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><MonitorPlay className="w-8 h-8"/></div>
                         <h3 className="font-black text-lg mb-2 text-slate-800">100% Amaliyot</h3>
                         <p className="text-slate-500 font-medium text-sm leading-relaxed">Nazariyaga qaram bo'lmasdan hamma darslar proektlar orqali amalga oshiriladi.</p>
                     </div>
                     <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
                         <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Star className="w-8 h-8"/></div>
                         <h3 className="font-black text-lg mb-2 text-slate-800">AI Imtihonlar</h3>
                         <p className="text-slate-500 font-medium text-sm leading-relaxed">Sun'iy avto imtihon portali yordamida o'zlashtirishingizni tekshirib boramiz.</p>
                     </div>
                     <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
                         <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Briefcase className="w-8 h-8"/></div>
                         <h3 className="font-black text-lg mb-2 text-slate-800">Karyera Markazi</h3>
                         <p className="text-slate-500 font-medium text-sm leading-relaxed">Bitiruvchilar yirik kompaniyalarga HR tavsiyasi asosida yo'naltiriladi.</p>
                     </div>
                 </div>
              </div>
           </section>

           {/* Courses Showcase */}
           <section id="courses" className="py-24 px-4 bg-white border-y border-slate-100">
               <div className="max-w-6xl mx-auto">
                  <h2 className="text-3xl font-black text-slate-800 mb-12 text-center">Mavjud Kurslarimiz</h2>
                  <div className="grid md:grid-cols-3 gap-8">
                     {courses?.map((c: any) => (
                        <div key={c.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50 hover:shadow-xl transition-all">
                           <h3 className="text-2xl font-black text-slate-800 mb-2">{c.name}</h3>
                           <p className="text-sm font-bold text-slate-500 mb-6 min-h-[40px]">{c.description || 'Kurs tavsifi hali yo\\'q'}</p>
                           <div className="flex items-center justify-between mt-auto">
                               <span className="font-black text-lg text-primary-600">{Number(c.price).toLocaleString()} <span className="text-sm">so'm</span></span>
                               <button onClick={() => { setForm({...form, course_id: c.id}); window.scrollTo(0,0); }} className="px-5 py-2 bg-slate-800 text-white rounded-xl font-bold text-sm">Tanlash</button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
           </section>

           {/* Vacancies / HR Apply section */}
           <section id="vacancies" className="py-24 px-4 bg-slate-900 text-white">
               <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-12">
                      <h2 className="text-3xl font-black text-white mb-4">Bizning Jamoaga Qo'shiling</h2>
                      <p className="text-slate-400 font-medium">Bizning professional va yosh jamoamiz uchun o'z ishini sevadigan mutaxassislar kerak!</p>
                  </div>

                  <div className="grid gap-6 mb-12">
                     {vacancies?.map((v: any) => (
                         <div key={v.id} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                             <div>
                                 <h3 className="text-xl font-black mb-1">{v.title}</h3>
                                 <p className="text-sm text-slate-400 mb-2">{v.description}</p>
                                 <span className="inline-block px-3 py-1 bg-slate-700 text-slate-300 font-bold text-xs rounded-lg">Maosh: {v.salary || "Kelishilgan"}</span>
                             </div>
                             <button onClick={() => setVacForm({...vacForm, vacancy_id: v.id})} className="px-6 py-3 bg-primary-600 font-black rounded-xl whitespace-nowrap w-full md:w-auto hover:bg-primary-500">Ariza Topsihrish</button>
                         </div>
                     ))}
                  </div>

                  {vacForm.vacancy_id && (
                     <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 max-w-xl mx-auto">
                        <h4 className="text-xl font-black mb-6">Rezyume Yuborish</h4>
                        {vacStatus === 'success' ? (
                            <div className="p-4 bg-emerald-500/20 text-emerald-400 font-black rounded-xl">Arizangiz jo'natildi!</div>
                        ) : (
                           <form onSubmit={handleVacancySubmit} className="space-y-4">
                              <input required type="text" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:border-primary-500 font-medium text-white" placeholder="Ism familiya" value={vacForm.name} onChange={e => setVacForm({...vacForm, name: e.target.value})} />
                              <input required type="text" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:border-primary-500 font-medium text-white" placeholder="Telefon" value={vacForm.phone} onChange={e => setVacForm({...vacForm, phone: e.target.value})} />
                              <input required type="url" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:border-primary-500 font-medium text-white" placeholder="Rezyume havolasi (Google Drive, Telegram va h.k)" value={vacForm.resume_url} onChange={e => setVacForm({...vacForm, resume_url: e.target.value})} />
                              <div className="flex gap-3 pt-2">
                                 <button type="submit" className="flex-1 py-3 bg-primary-600 font-black rounded-xl">Yuborish</button>
                                 <button type="button" onClick={() => setVacForm({...vacForm, vacancy_id: ''})} className="px-6 py-3 bg-slate-700 font-black rounded-xl">Bekor qilish</button>
                              </div>
                           </form>
                        )}
                     </div>
                  )}
               </div>
           </section>

           <footer className="py-8 text-center text-slate-500 font-medium bg-slate-50 text-sm">
               © {new Date().getFullYear()} IT School by System Builder. All rights reserved.
           </footer>
       </div>
   );
};

export default LandingPage;
