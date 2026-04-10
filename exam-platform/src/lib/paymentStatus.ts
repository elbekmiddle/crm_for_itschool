/** Backend `payments.status` qiymatlari turli xil bo‘lishi mumkin (PAID, paid, completed, …). */
export function isPaymentPaid(raw: unknown): boolean {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (!s) return false;
  return ['paid', 'completed', 'success', 'done', 'tolangan'].includes(s);
}

export function isPaymentPartial(raw: unknown): boolean {
  return String(raw ?? '')
    .trim()
    .toLowerCase() === 'partial';
}
