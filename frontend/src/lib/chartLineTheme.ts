/** Shared line-chart look (Chart.js) — barcha grafiklar bir xil chiziq dizaynida */

export const LINE_PRIMARY = '#9329e6';
export const LINE_ACCENT = '#aa3bff';

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(147, 41, 230, ${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function primaryGrowthDataset(
  label: string,
  data: number[],
  opts?: { borderColor?: string; borderWidth?: number; tension?: number },
) {
  const borderColor = opts?.borderColor ?? LINE_ACCENT;
  const borderWidth = opts?.borderWidth ?? 2;
  const tension = opts?.tension ?? 0.4;
  return {
    label,
    data,
    borderColor,
    backgroundColor: hexToRgba(borderColor, 0.1),
    fill: true,
    tension,
    pointRadius: data.length <= 1 ? 5 : data.length <= 4 ? 4 : 3,
    pointHoverRadius: 6,
    borderWidth,
    pointBackgroundColor: '#fff',
    pointBorderColor: borderColor,
    pointBorderWidth: Math.min(3, borderWidth),
  };
}

const tickStyle = {
  color: '#64748b',
  font: { size: 10 } as const,
  maxRotation: 0 as const,
};

export function standardLineChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: tickStyle,
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.22)' },
        ticks: tickStyle,
      },
    },
  };
}
