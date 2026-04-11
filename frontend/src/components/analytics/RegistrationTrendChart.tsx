import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LINE_ACCENT, primaryGrowthDataset, standardLineChartOptions } from '../../lib/chartLineTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

export type TrendPoint = { label: string; count: number };

export type RegistrationTrendChartProps = {
  week: TrendPoint[];
  month: TrendPoint[];
  year: TrendPoint[];
  title?: string;
  subtitle?: string;
  className?: string;
};

/**
 * Barcha rollar uchun bir xil: ro‘yxatga olishlar (area + HAFTA / OY / YIL).
 */
export const RegistrationTrendChart: React.FC<RegistrationTrendChartProps> = ({
  week,
  month,
  year,
  title = "Ro'yxatga olishlar",
  subtitle = "Yangi o'quvchilar · tizim bo'yicha",
  className,
}) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  const { labels, counts, periodHint } = useMemo(() => {
    if (period === 'week') {
      const w = week?.length ? week : [{ label: '—', count: 0 }];
      return {
        labels: w.map((p) => p.label),
        counts: w.map((p) => Number(p.count) || 0),
        periodHint: "So'nggi 7 kun",
      };
    }
    if (period === 'year') {
      const y = year?.length ? year : [{ label: '—', count: 0 }];
      return {
        labels: y.map((p) => p.label),
        counts: y.map((p) => Number(p.count) || 0),
        periodHint: "So'nggi yillar",
      };
    }
    const m = month?.length ? month : [{ label: '—', count: 0 }];
    return {
      labels: m.map((p) => p.label),
      counts: m.map((p) => Number(p.count) || 0),
      periodHint: "So'nggi oylar",
    };
  }, [period, week, month, year]);

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        primaryGrowthDataset("Yangi o'quvchilar", counts, {
          borderColor: LINE_ACCENT,
          borderWidth: 2.5,
          tension: 0.42,
        }),
      ],
    }),
    [labels, counts],
  );

  const chartOptions = useMemo(() => {
    const base = standardLineChartOptions();
    const nums = counts.map((n) => Number(n) || 0);
    const suggestedMax = nums.length ? Math.max(5, ...nums, 1) : 5;
    return {
      ...base,
      plugins: {
        ...base.plugins,
        tooltip: {
          ...base.plugins.tooltip,
          callbacks: {
            title: (items: { label: string }[]) => items[0]?.label ?? '',
            label: (ctx: { parsed: { y: number } }) => `Yangi o'quvchilar: ${ctx.parsed.y ?? 0}`,
          },
        },
      },
      scales: {
        ...base.scales,
        y: {
          ...(base.scales as { y: Record<string, unknown> }).y,
          suggestedMax,
        },
      },
    };
  }, [counts]);

  const tabs: { id: typeof period; label: string }[] = [
    { id: 'week', label: 'HAFTA' },
    { id: 'month', label: 'OY' },
    { id: 'year', label: 'YIL' },
  ];

  return (
    <div
      className={cn(
        'card overflow-hidden border border-slate-100 p-6 dark:border-[var(--border)] dark:bg-[var(--bg-card)]',
        className,
      )}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#aa3bff]/15 text-[#aa3bff] dark:bg-[#aa3bff]/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-[var(--text-h)]">
              O'sish tendentsiyasi
            </h2>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              {title} · {periodHint}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        <div className="flex rounded-xl border border-slate-200/80 bg-slate-100/80 p-0.5 dark:border-[var(--border)] dark:bg-[var(--bg-muted)]">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPeriod(t.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors',
                period === t.id
                  ? 'bg-white text-[#aa3bff] shadow-sm dark:bg-[var(--bg-card)] dark:text-[#d8b4ff]'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-56 w-full min-w-0 sm:h-64">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};
