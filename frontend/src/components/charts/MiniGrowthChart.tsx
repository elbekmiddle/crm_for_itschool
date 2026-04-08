import React, { useMemo } from 'react';
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
import { primaryGrowthDataset, standardLineChartOptions } from '../../lib/chartLineTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

type Point = { month: string; count: number };

interface Props {
  trend?: Point[];
  title?: string;
  subtitle?: string;
  className?: string;
  height?: number;
}

const MiniGrowthChart: React.FC<Props> = ({
  trend,
  title = "O'sish",
  subtitle = "Yangi ro'yxatga olishlar",
  className = '',
  height = 200,
}) => {
  const labels = (trend && trend.length > 0 ? trend : [{ month: '—', count: 0 }]).map((t) => t.month);
  const dataPoints = (trend && trend.length > 0 ? trend : [{ month: '—', count: 0 }]).map((t) => Number(t.count) || 0);

  const data = useMemo(
    () => ({
      labels,
      datasets: [primaryGrowthDataset("Ro'yxatga olishlar", dataPoints)],
    }),
    [labels, dataPoints],
  );

  const options = useMemo(() => {
    const base = standardLineChartOptions() as Record<string, unknown>;
    return {
      ...base,
      elements: {
        line: { spanGaps: true },
        point: { radius: dataPoints.length <= 1 ? 5 : 3, hoverRadius: 6 },
      },
      scales: {
        ...(base.scales as object),
        y: {
          ...(base.scales as { y: Record<string, unknown> }).y,
          suggestedMax: Math.max(4, ...dataPoints, 1),
        },
      },
    };
  }, [dataPoints]);

  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 h-full flex flex-col ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title ? (
            <h3 className="text-sm font-black uppercase tracking-tight text-[var(--text-h)]">{title}</h3>
          ) : null}
          {subtitle ? (
            <p className="text-[10px] font-bold text-[var(--text)]/70 uppercase tracking-widest mt-0.5">{subtitle}</p>
          ) : null}
        </div>
      )}
      <div className="flex-1 min-h-0" style={{ height }}>
        <Line data={data} options={options as any} />
      </div>
    </div>
  );
};

export default MiniGrowthChart;
