import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import {
  Wallet, Plus, Loader2, Trash2, X,
  TrendingUp, Snowflake, ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';

const PaymentsPage: React.FC = () => {
  const { payments, students, courses, fetchPayments, fetchStudents, fetchCourses, createPayment, deletePayment, isLoading } = useAdminStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ student_id: '', amount: '', payment_method: 'cash', description: '' });
  const [tab, setTab] = useState<'all' | 'debt'>('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => { fetchPayments(); fetchStudents(); fetchCourses(); }, []);

  const totalRevenue = payments.reduce((a: number, p: any) => a + (Number(p.amount) || 0), 0);
  const list = tab === 'all' ? payments : payments.filter((p: any) => p.status === 'pending' || p.status === 'overdue');
  const totalPages = Math.ceil(list.length / perPage);
  const paginated = list.slice((page - 1) * perPage, page * perPage);

  const handleCreate = async () => {
    await createPayment({ ...form, amount: Number(form.amount) });
    setModal(false);
  };

  return (
    <div className="page-container animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Moliyaviy Monitoring</h1>
          <p className="text-sm text-slate-400 mt-0.5">To'lovlar va qarzlarni kuzating.</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> To'lov qo'shish
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue card */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="label-subtle mb-1">Jami Daromad</p>
              <p className="text-4xl font-black text-slate-800">{totalRevenue.toLocaleString()} <span className="text-sm font-semibold text-slate-400">so'm</span></p>
            </div>
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button className="px-4 py-2 rounded-lg text-xs font-bold bg-white shadow-sm text-slate-700">Oylik</button>
              <button className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400">Yillik</button>
            </div>
          </div>
          <div className="flex items-end gap-2 h-32">
            {['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg'].map((m, i) => {
              const h = [40, 55, 70, 85, 60, 90, 78, 65][i];
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-primary-100 rounded-lg relative overflow-hidden" style={{ height: `${h}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-500/50 to-primary-300/20 rounded-lg" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">{m}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side cards */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Kutilayotgan to'lovlar</p>
            <p className="text-3xl font-black mt-2">{(totalRevenue * 0.15).toLocaleString()} <span className="text-sm">so'm</span></p>
            <div className="flex items-center gap-1 mt-2 text-xs opacity-80">
              <TrendingUp className="w-3 h-3" /> +12% o'tgan oydan
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Muzlatilgan hisoblar</p>
              <Snowflake className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-black mt-2">{Math.floor(students.length * 0.05)}</p>
            <p className="text-xs mt-1 opacity-70">2+ oy muddat o'tgan</p>
          </div>
          <div className="card p-5">
            <p className="label-subtle mb-1">Undirish darajasi</p>
            <p className="text-3xl font-black text-green-600">94.2%</p>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '94.2%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-50">
          <button onClick={() => { setTab('all'); setPage(1); }} className={cn("text-sm font-bold pb-1 border-b-2 transition-all", tab === 'all' ? "text-primary-600 border-primary-600" : "text-slate-400 border-transparent")}>
            Barcha to'lovlar
          </button>
          <button onClick={() => { setTab('debt'); setPage(1); }} className={cn("text-sm font-bold pb-1 border-b-2 transition-all flex items-center gap-1.5", tab === 'debt' ? "text-primary-600 border-primary-600" : "text-slate-400 border-transparent")}>
            Qarzdor talabalar
            <span className="w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">{payments.filter((p: any) => p.status === 'pending').length}</span>
          </button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Talaba</th>
                  <th>Sana</th>
                  <th>Summa</th>
                  <th>Usul</th>
                  <th>Status</th>
                  <th className="text-right">Amal</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p: any) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-[10px] font-black text-primary-600">
                          {p.student_name?.[0] || p.first_name?.[0] || 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">{p.student_name || `${p.first_name || ''} ${p.last_name || ''}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-slate-500">{p.created_at ? new Date(p.created_at).toLocaleDateString('uz-UZ') : '—'}</td>
                    <td className="font-bold text-green-600">{Number(p.amount).toLocaleString()} so'm</td>
                    <td><span className="course-badge bg-slate-100 text-slate-600 uppercase">{p.payment_method || 'Cash'}</span></td>
                    <td>
                      <span className={cn("status-pill", p.status === 'paid' ? 'pill-paid' : p.status === 'pending' ? 'pill-pending' : 'pill-active')}>
                        ● {p.status || 'paid'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button onClick={() => { if (confirm("O'chirishni tasdiqlaysizmi?")) deletePayment(p.id); }} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-slate-400">To'lovlar topilmadi</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-50">
            <span className="text-xs text-slate-400">{list.length} ta natija</span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} className={cn("w-8 h-8 rounded-lg text-xs font-bold", page === n ? "bg-primary-600 text-white" : "hover:bg-slate-100 text-slate-500")}>{n}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content p-6 animate-in-scale" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black">Yangi to'lov</h2>
              <button onClick={() => setModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="input-label">Talaba</label>
                <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="select">
                  <option value="">Talabani tanlang</option>
                  {students.map((s: any) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Summa (so'm)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" placeholder="500000" />
              </div>
              <div>
                <label className="input-label">To'lov usuli</label>
                <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="select">
                  <option value="cash">Naqd</option>
                  <option value="card">Karta</option>
                  <option value="transfer">O'tkazma</option>
                </select>
              </div>
              <div>
                <label className="input-label">Izoh</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="Oylik to'lov" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(false)} className="btn-secondary">Bekor qilish</button>
              <button onClick={handleCreate} className="btn-primary">To'lovni saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
