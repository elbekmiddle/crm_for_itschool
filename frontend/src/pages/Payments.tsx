import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import {
  Plus, Loader2, X,
  TrendingUp, Snowflake, ChevronLeft, ChevronRight
} from 'lucide-react';

import { useToast } from '../context/ToastContext';
import MiniGrowthChart from '../components/charts/MiniGrowthChart';
import { useModalOverlayEffects } from '../hooks/useModalOverlayEffects';
import { paymentMethodLabel } from '../lib/paymentLabels';

const PaymentsPage: React.FC = () => {
  const {
    payments,
    debtors,
    students,
    stats,
    user,
    fetchPayments,
    fetchStudents,
    fetchCourses,
    fetchStats,
    createPayment,
    updatePayment,
    isLoading,
  } = useAdminStore();
  const { showToast } = useToast();
  const [modal, setModal] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', paid_at: '', description: '' });
  const [form, setForm] = useState({ student_id: '', amount: '', payment_method: 'cash', description: '' });
  const [tab, setTab] = useState<'all' | 'debt'>('all');
  const [page, setPage] = useState(1);
  const [chartPeriod, setChartPeriod] = useState<'month' | 'year'>('month');
  const [paymentBusy, setPaymentBusy] = useState(false);
  const perPage = 10;

  useModalOverlayEffects(modal || !!editRow, {
    onEscape: () => {
      if (editRow) setEditRow(null);
      else setModal(false);
    },
  });

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    fetchCourses();
    fetchStats();
  }, []);

  const totalRevenue = stats?.totalRevenue || payments.reduce((a: number, p: any) => a + (Number(p.amount) || 0), 0);
  const chartTrend =
    chartPeriod === 'year'
      ? (stats?.growthTrendYearly || []).map((g: { year?: string; count?: number }) => ({
          month: String(g.year ?? '—'),
          count: Number(g.count) || 0,
        }))
      : stats?.growthTrend || [];
  const mom = stats?.revenueMonthOverMonthPct;
  const list = tab === 'all' ? payments : [];
  const totalPages = tab === 'all' ? Math.ceil(list.length / perPage) : 1;
  const paginated = tab === 'all' ? list.slice((page - 1) * perPage, page * perPage) : [];
  const canEditPayment = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const handleCreate = async () => {
    if (paymentBusy) return;
    setPaymentBusy(true);
    try {
      await createPayment({ ...form, amount: Number(form.amount) });
      showToast("To'lov muvaffaqiyatli qo'shildi", 'success');
      setModal(false);
      setForm({ student_id: '', amount: '', payment_method: 'cash', description: '' });
    } catch (e: any) {
      const msg = e?.response?.data?.message || "To'lov saqlanmadi";
      showToast(msg, 'error');
    } finally {
      setPaymentBusy(false);
    }
  };

  const openEdit = (p: any) => {
    setEditRow(p);
    const d = p.paid_at || p.created_at;
    setEditForm({
      amount: String(p.amount ?? ''),
      paid_at: d ? new Date(d).toISOString().slice(0, 16) : '',
      description: p.description ?? '',
    });
  };

  const handleEditSave = async () => {
    if (!editRow?.id) return;
    try {
      await updatePayment(editRow.id, {
        amount: Number(editForm.amount),
        paid_at: editForm.paid_at ? new Date(editForm.paid_at).toISOString() : undefined,
        description: editForm.description || null,
      });
      showToast("To'lov yangilandi", 'success');
      setEditRow(null);
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Saqlanmadi', 'error');
    }
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
              <button
                type="button"
                onClick={() => setChartPeriod('month')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-bold transition-all',
                  chartPeriod === 'month' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400',
                )}
              >
                Oylik
              </button>
              <button
                type="button"
                onClick={() => setChartPeriod('year')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-bold transition-all',
                  chartPeriod === 'year' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400',
                )}
              >
                Yillik
              </button>
            </div>
          </div>
          <div className="h-48 w-full min-h-[12rem]">
            <MiniGrowthChart
              trend={chartTrend}
              title=""
              subtitle=""
              height={192}
              className="border-0 p-0 bg-transparent"
            />
          </div>
        </div>

        {/* Side cards */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Kutilayotgan to'lovlar</p>
            <p className="text-3xl font-black mt-2">{(stats?.pendingAmount || 0).toLocaleString()} <span className="text-sm">so'm</span></p>
            <p className="mt-1 text-[11px] opacity-90">
              Qarzdor talabalar: <strong>{stats?.debtorStudentCount ?? debtors?.length ?? 0}</strong> ta
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs opacity-80">
              <TrendingUp className="w-3 h-3" />
              {typeof mom === 'number' ? (
                <span>
                  {mom >= 0 ? '+' : ''}
                  {mom}% oylik tushum (o‘tgan oy bilan)
                </span>
              ) : (
                <span>—</span>
              )}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">60+ kun to'lamagan</p>
              <Snowflake className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-black mt-2">{stats?.overdue60DayStudentCount ?? stats?.frozenAccounts ?? 0}</p>
            <p className="text-xs mt-1 opacity-70">Oxirgi to'lovdan 60 kundan ortiq</p>
          </div>
          <div className="card p-5">
            <p className="label-subtle mb-1">Undirish darajasi</p>
            <p className="text-3xl font-black text-green-600 dark:text-emerald-400">{stats?.collectionRate || 0}%</p>
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
            <span className="w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
              {debtors?.length ?? 0}
            </span>
          </button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
        ) : tab === 'all' ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Talaba</th>
                  <th>Sana</th>
                  <th>Summa</th>
                  <th>Usul</th>
                  <th>Status</th>
                  {canEditPayment && <th className="text-right">Amallar</th>}
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
                          <p className="font-bold text-slate-800 dark:text-[var(--text-h)]">{p.student_name || `${p.first_name || ''} ${p.last_name || ''}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-slate-500">
                      {p.display_date || p.paid_at || p.created_at
                        ? new Date(p.display_date || p.paid_at || p.created_at).toLocaleDateString('uz-UZ')
                        : '—'}
                    </td>
                    <td className="font-bold text-green-600">{Number(p.amount).toLocaleString()} so'm</td>
                    <td>
                      <span className="course-badge bg-slate-100 text-slate-700">{paymentMethodLabel(p.payment_method)}</span>
                    </td>
                    <td>
                      <span className={cn("status-pill", p.status === 'paid' ? 'pill-paid' : p.status === 'pending' ? 'pill-pending' : 'pill-active')}>
                        ● {p.status || 'completed'}
                      </span>
                    </td>
                    {canEditPayment && (
                      <td className="text-right">
                        <button type="button" onClick={() => openEdit(p)} className="text-xs font-bold text-primary-600 hover:underline">
                          Tahrirlash
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={canEditPayment ? 6 : 5} className="text-center py-12 text-slate-400">
                      To'lovlar topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Talaba</th>
                  <th>Guruh / kurs</th>
                  <th>Telefon</th>
                  <th>Oxirgi to'lov</th>
                  <th>Qo'shilgan</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                {(debtors || []).map((d: any) => (
                  <tr key={d.id}>
                    <td className="font-bold text-slate-800 dark:text-[var(--text-h)]">
                      {d.first_name} {d.last_name}
                    </td>
                    <td className="text-xs text-slate-600 dark:text-slate-300">
                      <div className="font-semibold">{d.group_name || '—'}</div>
                      <div className="text-[10px] text-slate-400">{d.course_name || ''}</div>
                    </td>
                    <td className="text-xs text-slate-500">{d.phone || '—'}</td>
                    <td className="text-xs text-slate-500">
                      {d.last_paid ? new Date(d.last_paid).toLocaleDateString('uz-UZ') : "— (to'lov yo'q)"}
                    </td>
                    <td className="text-xs text-slate-500">
                      {d.joined_at
                        ? new Date(d.joined_at).toLocaleString('uz-UZ', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td>
                      <span
                        className={cn(
                          'status-pill',
                          d.debt_status === 'FROZEN' ? 'pill-frozen' : 'pill-pending',
                        )}
                      >
                        ● {d.debt_status === 'FROZEN' ? '60+ kun' : "Kutilmoqda"}
                      </span>
                      {d.days_since_payment != null && (
                        <span className="ml-2 text-[10px] text-slate-400">{d.days_since_payment} kun o'tgan</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!debtors || debtors.length === 0) && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      Qarzdor talaba yo'q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'all' && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-50">
            <span className="text-xs text-slate-400">{list.length} ta natija</span>
            <div className="flex gap-1">
              <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-pagination"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} className={cn("w-8 h-8 rounded-lg text-xs font-bold", page === n ? "bg-primary-600 text-white" : "hover:bg-slate-100 text-slate-500")}>{n}</button>
              ))}
              <button type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-pagination"><ChevronRight className="w-4 h-4" /></button>
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
                <select
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className="select w-full bg-[var(--bg-card)] text-[var(--text-h)] border-[var(--border)]"
                >
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
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  className="select w-full bg-[var(--bg-card)] text-[var(--text-h)] border-[var(--border)]"
                >
                  <option value="cash">Naqd</option>
                  <option value="card">Karta</option>
                </select>
              </div>
              <div>
                <label className="input-label">Izoh</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="Oylik to'lov" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={paymentBusy}
                onClick={handleCreate}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
              >
                {paymentBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                To'lovni saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {editRow && (
        <div className="modal-overlay" onClick={() => setEditRow(null)}>
          <div className="modal-content p-6 animate-in-scale max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black">To'lovni tahrirlash</h2>
              <button type="button" onClick={() => setEditRow(null)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="input-label">Summa</label>
                <input
                  type="number"
                  className="input"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">To'langan vaqt</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={editForm.paid_at}
                  onChange={(e) => setEditForm({ ...editForm, paid_at: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">Izoh</label>
                <input
                  className="input"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setEditRow(null)} className="btn-secondary">
                Bekor
              </button>
              <button type="button" onClick={handleEditSave} className="btn-primary">
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
