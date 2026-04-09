import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import {
  Search, Loader2, Trash2, UserPlus, ChevronLeft, ChevronRight, Phone
} from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { toast } from 'react-hot-toast';
import { useModalOverlayEffects } from '../hooks/useModalOverlayEffects';

const statusMap: Record<string, { label: string; cls: string }> = {
  new: { label: 'YANGI', cls: 'pill-pending' },
  called: { label: 'QO\'NG\'IROQ QILINGAN', cls: 'pill-frozen' },
  converted: { label: 'O\'QUVCHI', cls: 'pill-active' },
  rejected: { label: 'RAD ETILGAN', cls: 'pill-dropped' },
};

const LeadsPage: React.FC = () => {
  const { leads, groups, fetchLeads, fetchCourses, fetchGroups, convertLead, deleteLead, isLoading } = useAdminStore();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<any>(null);
  const [form, setForm] = useState({ group_id: '', branch_id: '' });
  const [page, setPage] = useState(1);
  const perPage = 10;

  useModalOverlayEffects(!!modal, { onEscape: () => setModal(null) });

  useEffect(() => {
    fetchLeads();
    fetchCourses();
    fetchGroups();
  }, []);

  const filtered = leads.filter((l: any) => 
    `${l.first_name} ${l.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleConvert = async () => {
    if (modal) {
      await convertLead(modal.id, form);
      toast.success("Lead talabaga aylantirildi!");
      setModal(null);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Leadni o'chirish?",
      message: "Bu amalni ortga qaytarib bo'lmaydi.",
      confirmText: "O'CHIRISH",
      type: 'danger'
    });
    if (ok) {
      await deleteLead(id);
      toast.success("O'chirildi");
    }
  };

  return (
    <div className="page-container animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Leadlar (Arizalar)</h1>
          <p className="text-sm text-slate-400 mt-0.5">{filtered.length} ta umumiy ariza</p>
        </div>
      </div>

      <div className="card p-4 mb-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Ism yoki telefon orqali qidirish..."
            className="input search-input"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Telefon</th>
                  <th>Kurs (Qiziqish)</th>
                  <th>Manba</th>
                  <th>Status</th>
                  <th className="text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((l: any) => {
                  const st = statusMap[l.status?.toLowerCase()] || statusMap.new;
                  return (
                    <tr key={l.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-slate-500">
                            {l.first_name?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-700">{l.first_name} {l.last_name || ''}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{new Date(l.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-300" />
                          {l.phone}
                        </div>
                      </td>
                      <td>
                        {l.course_name ? (
                          <span className="course-badge bg-primary-50 text-primary-600">{l.course_name}</span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                          #{l.source || 'web'}
                        </span>
                      </td>
                      <td><span className={cn("status-pill", st.cls)}>{st.label}</span></td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          {l.status !== 'converted' && (
                            <button onClick={() => { setModal(l); setForm({ group_id: '', branch_id: '' }); }} className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-all" title="O'quvchiga aylantirish">
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(l.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-all" title="O'chirish">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">Leadlar topilmadi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-50">
            <span className="text-xs text-slate-400">Sahifa {page} / {totalPages}</span>
            <div className="flex gap-1">
              <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-pagination">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-pagination">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Convert Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content p-8 animate-in-scale max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">O'quvchiga aylantirish</h2>
            </div>
            
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              <b>{modal.first_name}</b> platformaga o'quvchi sifatida qo'shiladi. Parol avtomatik <code>123</code> qilib belgilanadi.
            </p>

            <div className="space-y-4">
              <div>
                <label className="input-label">Filial (Branch)</label>
                <select value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} className="select">
                  <option value="">Asosiy filial</option>
                  <option value="1">Toshkent</option>
                </select>
              </div>
              <div>
                <label className="input-label">Guruhga qo'shish (Majburiy emas)</label>
                <select value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })} className="select">
                  <option value="">Guruhsiz (Keyinroq qo'shish)</option>
                  {groups.filter((g: any) => !modal.course_id || g.course_id === modal.course_id).map((g: any) => (
                    <option key={g.id} value={g.id}>{g.name} ({g.course_name})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 py-4">Bekor qilish</button>
              <button onClick={handleConvert} className="btn-primary flex-1 py-4 shadow-lg shadow-green-600/30 font-black">CONVERT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;
