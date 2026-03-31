import React, { useEffect, useState } from 'react';
import api from '../../lib/api';

const BlogPage: React.FC = () => {
   const [blogs, setBlogs] = useState([]);

   useEffect(() => {
       api.get('/blogs').then(res => setBlogs(res.data)).catch(console.error);
   }, []);

   return (
       <div className="min-h-screen bg-slate-50 pt-24 px-4 pb-20">
           <div className="max-w-4xl mx-auto">
               <h1 className="text-4xl font-black text-slate-800 mb-2">IT School Blog</h1>
               <p className="text-slate-500 font-medium mb-10">Dasturlash olamidagi so'nggi yangiliklar, foydali darslar va maqolalar.</p>

               <div className="grid gap-6">
                   {blogs.map((b: any) => (
                       <article key={b.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-6 hover:shadow-lg transition-shadow">
                           {b.image_url ? (
                               <img src={b.image_url} alt="" className="w-48 h-32 object-cover rounded-2xl" />
                           ) : (
                               <div className="w-48 h-32 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 font-black">No Image</div>
                           )}
                           <div>
                               <span className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">{b.category || 'General'}</span>
                               <h2 className="text-2xl font-black text-slate-800 mt-3 mb-2 leading-snug">{b.title}</h2>
                               <p className="text-sm text-slate-500 line-clamp-2">{b.content.replace(/<[^>]*>?/gm, '')}</p>
                               <div className="text-[10px] font-bold text-slate-400 mt-4 tracking-widest uppercase">
                                  Muallif: {b.author_name} • Ko'rishlar: {b.views_count}
                               </div>
                           </div>
                       </article>
                   ))}
               </div>
           </div>
       </div>
   );
};

export default BlogPage;
