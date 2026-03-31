import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Phone, ExternalLink } from 'lucide-react';
import api from '../lib/api';

const fetchApps = async () => (await api.get('/vacancies/applications')).data;

const ApplicationsPage: React.FC = () => {
   const { data, isLoading } = useQuery({ queryKey: ['applications'], queryFn: fetchApps });

   if (isLoading) return <div className="p-8">Yuklanmoqda...</div>;

   return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
         <h1 className="text-2xl font-black text-slate-800">HR: Ishga joylashish arizalari</h1>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.map((a: any) => (
                <div key={a.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-black text-lg text-slate-800">{a.name}</h3>
                            <span className="font-bold text-sm text-primary-600 flex items-center gap-1"><Briefcase className="w-4 h-4" /> {a.vacancy_title}</span>
                        </div>
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg uppercase">{a.status}</span>
                    </div>
                    <div className="text-slate-500 font-medium flex items-center gap-2 text-sm mt-3">
                        <Phone className="w-4 h-4" /> {a.phone}
                    </div>
                    <a href={a.resume_url} target="_blank" rel="noreferrer" className="mt-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                        Rezyumeni Ochish <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            ))}
            {!data?.length && <div className="text-slate-400 font-bold col-span-2">Arizalar mavjud emas.</div>}
         </div>
      </div>
   );
};

export default ApplicationsPage;
