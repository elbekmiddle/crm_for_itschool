import React, { useEffect } from 'react';
import { useStudentStore } from '../store/useStudentStore';
import { useAuthStore } from '../store/useAuthStore';
import { Wallet, CheckCircle2, AlertTriangle, CreditCard, Loader2 } from 'lucide-react';

const PaymentsPage: React.FC = () => {
  const { payments, fetchPayments, isLoading } = useStudentStore();
  const { user } = useAuthStore();

  useEffect(() => { if (user?.id) fetchPayments(user.id); }, [user?.id]);

  const paid = payments.filter((p: any) => p.status === 'PAID' || p.status === 'paid');
  const unpaid = payments.filter((p: any) => p.status !== 'PAID' && p.status !== 'paid');
  const totalPaid = paid.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
  const totalDebt = unpaid.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);

  return (
    <div className="page-container space-y-6 pb-20 lg:pb-6 animate-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">To'lovlar</h1>
        <p className="text-slate-400 text-sm mt-1">Oylik to'lov tarixi</p>
      </div>

      {isLoading ? (
        <div className="card p-12 flex justify-center"><Loader2 className="w-7 h-7 text-primary-400 animate-spin" /></div>
      ) : (
        <>
          {/* Debt warning */}
          {totalDebt > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-800">Qarzdorlik mavjud!</p>
                <p className="text-xs text-red-600 mt-0.5">Umumiy qarz: {totalDebt.toLocaleString()} so'm. Iltimos imkon qadar to'lang.</p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <p className="label-subtle">Jami to'langan</p>
              <p className="text-xl font-black text-green-600 mt-1">{totalPaid.toLocaleString()} <span className="text-xs font-bold text-green-500">so'm</span></p>
            </div>
            <div className="card p-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-red-500" />
              </div>
              <p className="label-subtle">Qarz</p>
              <p className="text-xl font-black text-red-500 mt-1">{totalDebt.toLocaleString()} <span className="text-xs font-bold text-red-400">so'm</span></p>
            </div>
          </div>

          {/* Payment list */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-50">
              <h2 className="section-title text-base">To'lov tarixi</h2>
            </div>
            {payments.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {payments.map((p: any, i: number) => {
                  const isPaid = p.status === 'PAID' || p.status === 'paid';
                  return (
                    <div key={p.id || i} className="flex items-center gap-4 p-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isPaid ? 'bg-green-50' : 'bg-red-50'}`}>
                        <CreditCard className={`w-4 h-4 ${isPaid ? 'text-green-500' : 'text-red-400'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">
                          {p.month || (p.created_at ? new Date(p.created_at).toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' }) : `To'lov #${i + 1}`)}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{p.payment_method || 'Naqd'}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-sm ${isPaid ? 'text-green-600' : 'text-red-500'}`}>
                          {Number(p.amount || 0).toLocaleString()} so'm
                        </p>
                        <span className={`status-pill ${isPaid ? 'pill-paid' : 'pill-unpaid'} mt-1`}>
                          {isPaid ? "✓ To'langan" : '! Qoldi'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Wallet className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-semibold">To'lov ma'lumotlari yo'q</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentsPage;
