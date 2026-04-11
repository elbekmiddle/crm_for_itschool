import React, { useEffect } from 'react';
import { useStudentStore } from '../store/useStudentStore';
import { useAuthStore } from '../store/useAuthStore';
import { Wallet, CheckCircle2, AlertTriangle, CreditCard, Loader2, Sparkles, TrendingDown, TrendingUp, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatPaymentDisplayUz, formatPaymentMethodUz } from '../lib/utils';
import { isPaymentPaid } from '../lib/paymentStatus';

const PaymentsPage: React.FC = () => {
  const { payments, fetchPayments, isLoading } = useStudentStore();
  const { user } = useAuthStore();

  useEffect(() => { if (user?.id) fetchPayments(user.id); }, [user?.id]);

  const paid = payments.filter((p: any) => isPaymentPaid(p.status));
  const unpaid = payments.filter((p: any) => !isPaymentPaid(p.status));
  const totalPaid = paid.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
  const totalDebt = unpaid.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);

  return (
    <div className="page-container space-y-8 pb-32 lg:pb-12 h-full">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 text-[var(--accent)] font-black text-[10px] uppercase tracking-[0.3em] mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Moliyaviy Ma'lumotlar</span>
          </div>
          <h1 className="text-4xl font-black text-[var(--text-h)] tracking-tight">To'lovlar</h1>
          <p className="text-[var(--text)] font-medium mt-1">Oylik to'lov tarixi va balans</p>
        </motion.div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)]">
          <Loader2 className="w-10 h-10 text-[var(--accent)] animate-spin" />
          <p className="mt-4 text-[var(--text)] font-bold uppercase tracking-widest text-[10px]">Yuklanmoqda...</p>
        </div>
      ) : (
        <>
          {/* Debt warning */}
          {totalDebt > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/5 border-2 border-red-500/20 rounded-[2rem] p-6 flex items-center gap-5"
            >
              <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-black text-red-500 uppercase tracking-tight">Qarzdorlik mavjud!</p>
                <p className="text-xs text-[var(--text)] font-semibold mt-1">Umumiy qarz: <span className="font-black text-red-500">{totalDebt.toLocaleString()} so'm</span>. Iltimos imkon qadar to'lang.</p>
              </div>
            </motion.div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] group hover:shadow-xl transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="text-[10px] font-black text-[var(--text)] uppercase tracking-[0.2em] mb-2">Jami to'langan</p>
                <p className="text-3xl font-black text-emerald-500 tabular-nums tracking-tighter">
                  {totalPaid.toLocaleString()} <span className="text-sm font-black text-emerald-500/50">so'm</span>
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] group hover:shadow-xl transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingDown className="w-7 h-7 text-red-500" />
                </div>
                <p className="text-[10px] font-black text-[var(--text)] uppercase tracking-[0.2em] mb-2">Qarz / Kutilmoqda</p>
                <p className="text-3xl font-black text-red-500 tabular-nums tracking-tighter">
                  {totalDebt.toLocaleString()} <span className="text-sm font-black text-red-500/50">so'm</span>
                </p>
              </div>
            </motion.div>
          </div>

          {/* Payment list */}
          <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] overflow-hidden">
            <div className="p-6 border-b border-[var(--divide)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <h2 className="text-xl font-black text-[var(--text-h)] tracking-tight">To'lov Tarixi</h2>
              </div>
            </div>
            {payments.length > 0 ? (
              <div>
                {payments.map((p: any, i: number) => {
                  const isPaid = isPaymentPaid(p.status);
                  return (
                    <div key={p.id || i} className="flex items-center gap-5 p-6 border-b border-[var(--divide)] last:border-b-0 row-hover transition-colors">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        isPaid ? 'bg-emerald-500/10' : 'bg-red-500/10'
                      )}>
                        <CreditCard className={cn("w-5 h-5", isPaid ? 'text-emerald-500' : 'text-red-500')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-[var(--text-h)] truncate">
                          {formatPaymentDisplayUz({
                            month: p.month,
                            paid_at: p.paid_at,
                            created_at: p.created_at,
                          }) || `To'lov #${i + 1}`}
                        </p>
                        <p className="text-[10px] text-[var(--text)] font-bold uppercase tracking-widest mt-1">
                          {formatPaymentMethodUz(p.payment_method)}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className={cn("font-black text-lg tabular-nums", isPaid ? 'text-emerald-500' : 'text-red-500')}>
                          {Number(p.amount || 0).toLocaleString()} <span className="text-[10px] font-bold opacity-60">so'm</span>
                        </p>
                        <span className={cn("status-pill", isPaid ? 'pill-paid' : 'pill-unpaid')}>
                          {isPaid ? "✓ To'langan" : '! Kutilmoqda'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-20">
                <div className="w-20 h-20 bg-[var(--bg-muted)] rounded-full flex items-center justify-center mb-6">
                  <Wallet className="w-8 h-8 text-[var(--text)] opacity-30" />
                </div>
                <p className="text-[var(--text)] font-black text-xs uppercase tracking-widest opacity-50">To'lov ma'lumotlari yo'q</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentsPage;
