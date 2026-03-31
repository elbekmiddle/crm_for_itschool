import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../lib/api';

const fetchLeads = async () => (await api.get('/leads')).data;

const LeadsPage: React.FC = () => {
   const queryClient = useQueryClient();
   const { data, isLoading } = useQuery({ queryKey: ['leads'], queryFn: fetchLeads });

   const convertMutation = useMutation({
       mutationFn: (id: string) => api.post(`/leads/${id}/convert`),
       onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
   });

   if (isLoading) return <div className="p-8">Yuklanmoqda...</div>;

   return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
         <div className="flex justify-between items-center mb-6">
             <h1 className="text-2xl font-black text-slate-800">Yangi Arizalar (Leads)</h1>
         </div>
         <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-sm font-bold text-slate-400 border-b border-slate-100">
                     <th className="pb-3">Ism Familiya</th>
                     <th className="pb-3">Telefon</th>
                     <th className="pb-3">Kurs</th>
                     <th className="pb-3">Manba</th>
                     <th className="pb-3">Status</th>
                     <th className="pb-3 text-right">Amal</th>
                  </tr>
               </thead>
               <tbody>
                  {data?.map((l: any) => (
                     <tr key={l.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                        <td className="py-4 font-bold text-slate-800">{l.first_name} {l.last_name || ''}</td>
                        <td className="py-4 font-bold text-slate-500 flex items-center gap-2"><Phone className="w-4 h-4"/> {l.phone}</td>
                        <td className="py-4 font-bold text-primary-600">{l.course_name || 'Tanlanmagan'}</td>
                        <td className="py-4 font-bold text-slate-500 uppercase text-xs">{l.source}</td>
                        <td className="py-4">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${l.status === 'converted' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {l.status}
                            </span>
                        </td>
                        <td className="py-4 text-right">
                           {l.status !== 'converted' && (
                               <button onClick={() => {
                                  if (window.confirm("Bu arizani O'quvchiga aylantirasizmi?")) { convertMutation.mutate(l.id) }
                               }} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 ml-auto">
                                   <RefreshCw className="w-4 h-4"/> Convert
                               </button>
                           )}
                           {l.status === 'converted' && <div className="text-green-500 flex justify-end"><CheckCircle /></div>}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
};

export default LeadsPage;
