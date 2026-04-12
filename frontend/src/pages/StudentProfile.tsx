import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import api from '../lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { standardLineChartOptions, LINE_ACCENT, hexToRgba } from '../lib/chartLineTheme';
import {
  Phone,
  Calendar,
  Sparkles,
  DollarSign,
  ClipboardList,
  ArrowLeft,
  Clock,
  UserCircle,
  TrendingUp,
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function useDocumentDark(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const el = document.documentElement;
      const obs = new MutationObserver(() => onStoreChange());
      obs.observe(el, { attributes: true, attributeFilter: ['class'] });
      return () => obs.disconnect();
    },
    () => document.documentElement.classList.contains('dark'),
    () => false,
  );
}

const COLOR_EXAM = LINE_ACCENT;
const COLOR_ATT = '#34d399';
const COLOR_PAY = '#f59e0b';

/** Brauzer vaqt zonasi bo‘yicha kun kaliti — UTC siljishlari bo‘lmaydi */
function dayKeyLocal(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDayShort(dayYmd: string): string {
  const p = dayYmd.split('-').map(Number);
  if (p.length !== 3 || !p[0] || !p[1] || !p[2]) return dayYmd;
  const dt = new Date(p[0], p[1] - 1, p[2]);
  return dt.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
}

/** Imtihon, davomat, to‘lov sanalarini bir vaqt o‘qida birlashtiradi */
function mergeStudentTimeline(dashboard: any) {
  if (!dashboard) return null;
  const dateSet = new Set<string>();
  const exams = Array.isArray(dashboard.exams) ? dashboard.exams : [];
  const trend = Array.isArray(dashboard.attendance_trend) ? dashboard.attendance_trend : [];
  const payments = Array.isArray(dashboard.payments) ? dashboard.payments : [];

  for (const e of exams) {
    const t = e?.submitted_at ? new Date(e.submitted_at) : null;
    if (t && !Number.isNaN(t.getTime())) dateSet.add(dayKeyLocal(t));
  }
  for (const row of trend) {
    const t = row?.lesson_date ? new Date(row.lesson_date) : null;
    if (t && !Number.isNaN(t.getTime())) dateSet.add(dayKeyLocal(t));
  }
  for (const p of payments) {
    const t = p?.paid_at ? new Date(p.paid_at) : null;
    if (t && !Number.isNaN(t.getTime())) dateSet.add(dayKeyLocal(t));
  }

  const sortedDays = [...dateSet].filter(Boolean).sort();
  if (sortedDays.length === 0) return null;

  const examByDay = new Map<string, number[]>();
  for (const e of exams) {
    const t = e?.submitted_at ? new Date(e.submitted_at) : null;
    if (!t || Number.isNaN(t.getTime())) continue;
    const k = dayKeyLocal(t);
    if (!k) continue;
    const s = Number(e.score) || 0;
    if (!examByDay.has(k)) examByDay.set(k, []);
    examByDay.get(k)!.push(s);
  }

  const attByDay = new Map<string, { pres: number; tot: number }>();
  for (const row of trend) {
    const t = row?.lesson_date ? new Date(row.lesson_date) : null;
    if (!t || Number.isNaN(t.getTime())) continue;
    const k = dayKeyLocal(t);
    const pres = String(row.status ?? '')
      .toUpperCase()
      .includes('PRESENT')
      ? 1
      : 0;
    const cur = attByDay.get(k) || { pres: 0, tot: 0 };
    cur.pres += pres;
    cur.tot += 1;
    attByDay.set(k, cur);
  }

  const payByDay = new Map<string, number>();
  for (const p of payments) {
    const t = p?.paid_at ? new Date(p.paid_at) : null;
    if (!t || Number.isNaN(t.getTime())) continue;
    const k = dayKeyLocal(t);
    payByDay.set(k, (payByDay.get(k) || 0) + (Number(p.amount) || 0));
  }

  const labels = sortedDays.map((day) => formatDayShort(day));

  const exam: (number | null)[] = sortedDays.map((day) => {
    const arr = examByDay.get(day);
    if (!arr?.length) return null;
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.round(Math.min(100, Math.max(0, avg)));
  });

  const attendance: (number | null)[] = sortedDays.map((day) => {
    const cur = attByDay.get(day);
    if (!cur || cur.tot === 0) return null;
    return Math.round((cur.pres / cur.tot) * 100);
  });

  const payment: (number | null)[] = sortedDays.map((day) => {
    const v = payByDay.get(day);
    return v != null && v > 0 ? v : null;
  });

  const from = sortedDays[0];
  const to = sortedDays[sortedDays.length - 1];

  return { labels, exam, attendance, payment, from, to };
}

const StudentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAdminStore();
  const [student, setStudent] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [aiMentor, setAiMentor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const chartIsDark = useDocumentDark();

  useEffect(() => {
    const loadData = async () => {
      const targetId = id || user?.id;
      if (!targetId) return;
      
      setLoading(true);
      try {
        const profileRes = await api.get(`/students/${targetId}`);
        setStudent(profileRes.data);
        try {
          const dashboardRes = await api.get(`/students/${targetId}/dashboard`);
          setDashboard(dashboardRes.data);
        } catch {
          setDashboard(null);
        }
        if (user?.role === 'STUDENT' && targetId === user?.id) {
          try {
            const ar = await api.get('/analytics/student/me');
            setAiMentor(ar.data?.ai_humor ? String(ar.data.ai_humor).trim() : null);
          } catch {
            setAiMentor(null);
          }
        } else {
          setAiMentor(null);
        }
      } catch (e) {
        console.error('Error loading student profile:', e);
        setStudent(null);
        setDashboard(null);
      }
      setLoading(false);
    };
    loadData();
  }, [id, user?.id, user?.role]);

  const studentTimeline = useMemo(() => mergeStudentTimeline(dashboard), [dashboard]);

  /** Bir vaqt o‘qida: imtihon ball, davomat %, to‘lov (so‘m) — tema (yorug‘/qorong‘u) bo‘yicha o‘qlar va tooltip */
  const dynamicsChart = useMemo(() => {
    const base = standardLineChartOptions();
    const chartAxis = chartIsDark ? '#94a3b8' : '#475569';
    const chartAxisSoft = chartIsDark ? '#64748b' : '#64748b';
    const gridLine = chartIsDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.32)';
    const pointFill = chartIsDark ? '#1f2028' : '#ffffff';
    const tooltipBg = chartIsDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.97)';
    const tooltipTitle = chartIsDark ? '#f1f5f9' : '#0f172a';
    const tooltipBody = chartIsDark ? '#cbd5e1' : '#334155';
    const tooltipBorder = chartIsDark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(148, 163, 184, 0.45)';

    const merged = studentTimeline;
    if (merged) {
      const payPositive = merged.payment.filter((v): v is number => v != null && v > 0);
      const payMax = payPositive.length > 0 ? Math.max(...payPositive) : 0;
      const n = merged.labels.length;
      const pointR = n <= 2 ? 5 : n <= 8 ? 4 : 3;

      const dsExam = {
        label: 'Imtihon',
        data: merged.exam,
        borderColor: COLOR_EXAM,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.22,
        borderWidth: 2,
        pointRadius: pointR,
        pointHoverRadius: 6,
        pointBackgroundColor: pointFill,
        pointBorderColor: COLOR_EXAM,
        pointBorderWidth: 2,
        yAxisID: 'y',
        xAxisID: 'x',
        order: 3,
        spanGaps: false,
      };

      const dsAtt = {
        label: 'Davomat',
        data: merged.attendance,
        borderColor: COLOR_ATT,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.22,
        borderWidth: 2,
        pointRadius: pointR,
        pointHoverRadius: 6,
        pointBackgroundColor: pointFill,
        pointBorderColor: COLOR_ATT,
        pointBorderWidth: 2,
        yAxisID: 'y',
        xAxisID: 'x',
        order: 2,
        spanGaps: false,
      };

      const dsPay = {
        label: "To'lov",
        data: merged.payment,
        borderColor: COLOR_PAY,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.22,
        borderWidth: 2,
        pointRadius: pointR,
        pointHoverRadius: 6,
        pointBackgroundColor: pointFill,
        pointBorderColor: COLOR_PAY,
        pointBorderWidth: 2,
        yAxisID: 'y1',
        xAxisID: 'x',
        order: 1,
        spanGaps: false,
      };

      return {
        data: {
          labels: merged.labels,
          datasets: [dsPay, dsAtt, dsExam],
        },
        options: {
          ...base,
          plugins: {
            ...base.plugins,
            legend: {
              display: true,
              position: 'bottom' as const,
              align: 'center' as const,
              labels: {
                color: chartAxis,
                usePointStyle: true,
                boxWidth: 10,
                padding: 14,
                font: { size: 12, weight: '600' as const },
              },
            },
            tooltip: {
              ...base.plugins.tooltip,
              backgroundColor: tooltipBg,
              titleColor: tooltipTitle,
              bodyColor: tooltipBody,
              borderColor: tooltipBorder,
              borderWidth: 1,
              padding: 12,
              cornerRadius: 12,
              displayColors: true,
              callbacks: {
                title: (items: any[]) => (items[0]?.label ? String(items[0].label) : ''),
                label: (ctx: any) => {
                  const raw = ctx.raw;
                  if (raw == null || Number.isNaN(Number(raw))) return '';
                  const v = Number(raw);
                  const lab = String(ctx.dataset?.label ?? '');
                  if (lab === "To'lov")
                    return `To'lov: ${v.toLocaleString('uz-UZ')} so'm`;
                  if (lab === 'Davomat') return `Davomat: ${Math.round(v)}%`;
                  return `Imtihon: ${Math.round(v)} ball`;
                },
              },
              filter: (item: any) => item.raw != null && !Number.isNaN(Number(item.raw)),
            },
          },
          scales: {
            x: {
              id: 'x',
              ...base.scales.x,
              offset: false,
              ticks: {
                ...base.scales.x.ticks,
                color: chartAxisSoft,
                maxRotation: 40,
                autoSkip: true,
                maxTicksLimit: 14,
              },
              grid: { display: false },
            },
            y: {
              id: 'y',
              type: 'linear' as const,
              position: 'left' as const,
              min: 0,
              max: 100,
              display: true,
              title: {
                display: true,
                text: 'Ball / davomat (0–100)',
                color: chartAxis,
                font: { size: 11, weight: '600' },
              },
              ticks: {
                ...base.scales.y.ticks,
                color: chartAxisSoft,
                stepSize: 20,
              },
              grid: { color: gridLine },
            },
            y1: {
              id: 'y1',
              type: 'linear' as const,
              position: 'right' as const,
              min: 0,
              suggestedMax: payMax > 0 ? payMax * 1.05 : 1,
              display: true,
              title: {
                display: true,
                text: "To'lov (so'm)",
                color: chartAxis,
                font: { size: 11, weight: '600' },
              },
              ticks: {
                color: chartAxisSoft,
                callback: (val: string | number) =>
                  typeof val === 'number' ? val.toLocaleString('uz-UZ') : val,
              },
              grid: { drawOnChartArea: false },
            },
          },
        },
      };
    }

    const emptySlots = 8;
    return {
      data: {
        labels: Array.from({ length: emptySlots }, () => ''),
        datasets: [
          {
            label: '',
            data: Array.from({ length: emptySlots }, (): number | null => null),
            borderColor: hexToRgba(LINE_ACCENT, 0.35),
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.22,
            borderWidth: 0,
            pointRadius: 0,
            pointHoverRadius: 0,
            spanGaps: false,
          },
        ],
      },
      options: {
        ...base,
        plugins: {
          ...base.plugins,
          tooltip: { enabled: false },
          legend: { display: false },
        },
        scales: {
          ...base.scales,
          x: {
            ...base.scales.x,
            ticks: { ...base.scales.x.ticks, display: false, color: chartAxisSoft },
            grid: { display: false },
          },
          y: {
            ...base.scales.y,
            min: 0,
            max: 100,
            ticks: { ...base.scales.y.ticks, color: chartAxisSoft },
            grid: { color: gridLine },
          },
        },
      },
    };
  }, [studentTimeline, chartIsDark]);

  if (loading) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Yuklanmoqda...</p>
      </div>
    );
  }

  const studentsListPath =
    user?.role === 'STUDENT'
      ? '/student/dashboard'
      : user?.role === 'TEACHER'
        ? '/teacher/students'
        : '/manager/students';

  if (!student) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-slate-400">Talaba topilmadi</p>
        <button type="button" onClick={() => navigate(studentsListPath)} className="btn-primary mt-4">
          Orqaga
        </button>
      </div>
    );
  }

  const payments = dashboard?.payments || [];
  const totalPaid = payments.reduce((a: number, p: any) => a + (Number(p.amount) || 0), 0);
  const presentN = Number(dashboard?.present_days) || 0;
  const absentN = Number(dashboard?.absent_days) || 0;
  const attendanceDenom = presentN + absentN;
  const attendancePercent =
    dashboard && attendanceDenom > 0 ? Math.round((presentN / attendanceDenom) * 100) : 0;
  const examResults = dashboard?.exams || [];
  const avgExamScore = examResults.length > 0 
    ? Math.round(examResults.reduce((a: number, r: any) => a + Number(r.score), 0) / examResults.length) 
    : 0;

  return (
    <div className="page-container animate-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(studentsListPath)}
            className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-primary-600 mb-2 transition-all uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />{' '}
            {user?.role === 'STUDENT' ? 'Kabinetga' : "Ro'yxatga qaytish"}
          </button>
          <h1 className="text-2xl font-black text-slate-800 dark:text-[var(--text-h)]">
            {user?.role === 'STUDENT' ? 'Mening profilim' : 'Talaba Profili'}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 lg:items-stretch gap-6">
        {/* Left — Profile Info (lg: o‘ng ustun bilan bir xil balandlik) */}
        <div className="flex min-h-0 flex-col lg:h-full">
          <div className="card flex h-full min-h-0 flex-col p-6 text-center shadow-lg border-primary-50 dark:border-[var(--border)] dark:bg-[var(--bg-card)]">
            <div className="w-28 h-28 bg-gradient-to-br from-primary-500 to-indigo-700 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black mx-auto mb-4 shadow-2xl shadow-primary-200/40 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {student.image_url ? (
                <img src={student.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`
              )}
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-[var(--text-h)]">
              {student.first_name} {student.last_name}
            </h2>
            <p className="text-[10px] font-black text-slate-300 dark:text-slate-500 mt-1 uppercase tracking-[0.2em]">
              ID: {student.id?.slice(0, 8)}
            </p>
            
            <div className="flex justify-center mt-3">
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                student.status === 'active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {student.status || 'Active'}
              </span>
            </div>

            <div className="mt-8 grid flex-1 grid-cols-1 gap-3 text-left content-start">
              <div className="flex items-center gap-4 p-4 rounded-3xl border border-slate-100/50 bg-slate-50/50 transition-all duration-300 hover:border-primary-100 hover:bg-white dark:border-[var(--border)] dark:bg-[var(--bg-muted)] dark:hover:bg-[var(--hover-bg)] dark:hover:border-[var(--border)]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-[var(--bg-card)]">
                   <Phone className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="label-subtle dark:text-slate-400">Telefon raqam</p>
                  <p className="text-sm font-black tracking-tight text-slate-800 dark:text-[var(--text-h)]">{student.phone || '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-3xl border border-slate-100/50 bg-slate-50/50 transition-all duration-300 hover:border-primary-100 hover:bg-white dark:border-[var(--border)] dark:bg-[var(--bg-muted)] dark:hover:bg-[var(--hover-bg)] dark:hover:border-[var(--border)]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-[var(--bg-card)]">
                   <UserCircle className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <p className="label-subtle dark:text-slate-400">Ota-ona ismi</p>
                  <p className="text-sm font-black tracking-tight text-slate-800 dark:text-[var(--text-h)]">{student.parent_name || '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-3xl border border-slate-100/50 bg-slate-50/50 transition-all duration-300 hover:border-primary-100 hover:bg-white dark:border-[var(--border)] dark:bg-[var(--bg-muted)] dark:hover:bg-[var(--hover-bg)] dark:hover:border-[var(--border)]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-[var(--bg-card)]">
                   <Calendar className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="label-subtle dark:text-slate-400">Ro'yxatdan o'tgan</p>
                  <p className="text-sm font-black tracking-tight text-slate-800 dark:text-[var(--text-h)]">
                    {student.created_at ? new Date(student.created_at).toLocaleDateString('uz-UZ') : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Stats & Content */}
        <div className="flex min-h-0 flex-col gap-6 lg:col-span-2 lg:h-full">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card border-l-4 border-l-primary-500 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-l-primary-400 dark:bg-[var(--bg-card)]">
              <div className="mb-4 flex items-center justify-between">
                <p className="label-subtle text-primary-600/70 dark:text-primary-300/80">Davomat</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-500 dark:bg-primary-900/40 dark:text-primary-300">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h4 className="text-3xl font-black text-slate-800 dark:text-[var(--text-h)]">
                  {attendancePercent}
                  <span className="text-lg opacity-40">%</span>
                </h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Ko'rsatkich</p>
              </div>
            </div>

            <div className="card border-l-4 border-l-green-500 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-l-emerald-400 dark:bg-[var(--bg-card)]">
              <div className="mb-4 flex items-center justify-between">
                <p className="label-subtle text-green-600/70 dark:text-emerald-300/80">To'lovlar</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-500 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h4 className="text-2xl font-black tabular-nums text-slate-800 dark:text-[var(--text-h)]">{totalPaid.toLocaleString()}</h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">So'm</p>
              </div>
            </div>

            <div className="card border-l-4 border-l-amber-500 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-l-amber-400 dark:bg-[var(--bg-card)]">
              <div className="mb-4 flex items-center justify-between">
                <p className="label-subtle text-amber-600/70 dark:text-amber-200/80">Imtihonlar</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-900/40 dark:text-amber-300">
                  <ClipboardList className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h4 className="text-3xl font-black text-slate-800 dark:text-[var(--text-h)]">{avgExamScore}</h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Ball</p>
              </div>
            </div>
          </div>

          {/* Progress line chart — ustoz / menejer / admin (va o‘quvchi o‘z profilida) uchun stat qator ostida */}
          {(user?.role === 'TEACHER' ||
            user?.role === 'MANAGER' ||
            user?.role === 'ADMIN' ||
            user?.role === 'STUDENT') && (
            <div
              className={cn(
                'relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border shadow-lg',
                'border-slate-200/90 bg-gradient-to-br from-white via-slate-50/95 to-primary-50/35 shadow-slate-200/30',
                'dark:border-white/[0.08] dark:bg-gradient-to-br dark:from-[#1c1d24] dark:via-[#1f2028] dark:to-[#1a1028]/95 dark:shadow-none',
              )}
            >
              <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary-400/12 blur-3xl dark:bg-primary-500/8" />
              <div className="pointer-events-none absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-indigo-400/10 blur-2xl dark:bg-indigo-500/6" />

              <div className="relative z-10 border-b border-slate-100 px-6 py-5 dark:border-[var(--border)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-md shadow-primary-500/20 dark:shadow-primary-900/40">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-[var(--text-h)]">
                        Dinamika
                      </h3>
                      {studentTimeline ? (
                        <>
                          <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {formatDayShort(studentTimeline.from)} — {formatDayShort(studentTimeline.to)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Imtihon va davomat — chapda 0–100. To‘lov — o‘ngda so‘m.
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Hozircha grafik uchun yozuv yo‘q.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-5 pt-2 md:px-6 md:pb-6">
                <div className="min-h-[16rem] w-full flex-1 md:min-h-[18rem]">
                  <Line data={dynamicsChart.data} options={dynamicsChart.options as any} />
                </div>
              </div>
            </div>
          )}

          {/* AI Mentor — faqat o‘quvchi o‘z profilini ko‘rayotganda */}
          {user?.role === 'STUDENT' &&
            student?.id &&
            user?.id &&
            String(student.id) === String(user.id) &&
            (aiMentor || dashboard?.ai_status) && (
            <div className="card p-8 bg-gradient-to-br from-primary-600 to-indigo-800 text-white relative overflow-hidden group">
               <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-white/20 transition-all duration-1000" />
               <div className="relative z-10 flex items-start gap-6">
                 <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner">
                    <Sparkles className="w-7 h-7 text-white" />
                 </div>
                 <div>
                   <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary-100 mb-2">AI Mentor</h3>
                   <p className="text-lg font-medium italic leading-relaxed text-indigo-50">
                     "{aiMentor || dashboard?.ai_status}"
                   </p>
                 </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
