import React from 'react';
import { Wallet, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { isPaymentPaid, isPaymentPartial } from '../lib/paymentStatus';
import type { Payment } from '../types';

interface PaymentHistoryProps {
  payments: Payment[];
  showHeader?: boolean;
  maxItems?: number;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  payments,
  showHeader = true,
  maxItems,
}) => {
  const totalPaid = payments
    .filter((p) => isPaymentPaid(p.status))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const unpaidCount = payments.filter((p) => !isPaymentPaid(p.status)).length;
  const displayPayments = maxItems ? payments.slice(0, maxItems) : payments;

  return (
    <div className="card p-6 space-y-5">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-500" /> To'lovlar
          </h3>
          <span className="text-sm font-black text-green-600">
            {totalPaid.toLocaleString()} so'm
          </span>
        </div>
      )}

      {/* Debt warning */}
      {unpaidCount > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs font-bold text-red-700">
            {unpaidCount} ta oylik to'lanmagan
          </p>
        </div>
      )}

      {/* Payment list */}
      <div className="space-y-2">
        {displayPayments.map((payment, i) => (
          <div key={payment.id || i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-3">
              {isPaymentPaid(payment.status) ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <div>
                <div className="text-sm font-bold text-slate-700">
                  {payment.amount?.toLocaleString()} so'm
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {payment.month || new Date(payment.created_at).toLocaleDateString('uz-UZ')}
                </div>
              </div>
            </div>
            <span className={cn(
              "status-pill text-[8px]",
              isPaymentPaid(payment.status)
                ? "bg-green-50 text-green-600 border-green-200"
                : isPaymentPartial(payment.status)
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-red-50 text-red-500 border-red-200"
            )}>
              {isPaymentPaid(payment.status) ? "To'langan" : isPaymentPartial(payment.status) ? "Qisman" : "Qarz"}
            </span>
          </div>
        ))}

        {payments.length === 0 && (
          <p className="text-center text-slate-400 text-sm font-medium py-4">To'lovlar yo'q</p>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
