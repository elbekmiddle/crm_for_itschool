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
import { hexToRgba } from '../../lib/chartLineTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

type Props = {
  values: number[];
  color?: string;
  height?: number;
  className?: string;
  /** Pastki fon — gradient fill */
  fill?: boolean;
};

/**
 * Kichik line chart (o‘qlar yo‘q). Progress / ulush / foiz ko‘rinishlari uchun.
 */
const SparklineChart: React.FC<Props> = ({
  values,
  color = '#9329e6',
  height = 40,
  className = '',
  fill = true,
}) => {
  const series = useMemo(() => {
    const v = values.length ? values.map((x) => Number(x) || 0) : [0];
    return v.length >= 2 ? v : [0, v[0]];
  }, [values]);

  const labels = useMemo(() => series.map((_, i) => String(i)), [series]);

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: series,
          borderColor: color,
          backgroundColor: fill ? hexToRgba(color, 0.12) : 'transparent',
          fill,
          tension: 0.45,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
        },
      ],
    }),
    [labels, series, color, fill],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 2, bottom: 2, left: 0, right: 0 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          displayColors: false,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 8,
          cornerRadius: 8,
          callbacks: {
            title: () => '',
            label: (ctx: { parsed: { y: number } }) => `${Math.round(ctx.parsed.y * 10) / 10}`,
          },
        },
      },
      scales: {
        x: { display: false, grid: { display: false } },
        y: {
          display: false,
          beginAtZero: true,
          suggestedMax: Math.max(1, ...series) * 1.08,
          grid: { display: false },
        },
      },
      interaction: { mode: 'index' as const, intersect: false },
    }),
    [series],
  );

  return (
    <div className={className} style={{ height, minHeight: height }}>
      <Line data={data} options={options as any} />
    </div>
  );
};

export default SparklineChart;
