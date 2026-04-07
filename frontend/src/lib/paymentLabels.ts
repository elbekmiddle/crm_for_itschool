/** To‘lov usuli — jadval va forma uchun o‘zbekcha. */
export function paymentMethodLabel(method: string | null | undefined): string {
  const m = String(method || '').toLowerCase().trim();
  const map: Record<string, string> = {
    cash: 'Naqd pul',
    card: 'Bank kartasi',
    transfer: "Bank o'tkazmasi",
    click: 'Click',
    payme: 'Payme',
    uzum: 'Uzum Bank',
  };
  return map[m] || (method ? String(method) : '—');
}
