import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SparklineChart from '../components/charts/SparklineChart';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';
import { formatUzbekDayMonthYear } from '../lib/uzbekDate';
import { isGroupLessonDay } from '../lib/groupSchedule';
import { Calendar, Loader2 } from 'lucide-react';
import { localYmd, toLocalYmd } from '../lib/localDate';

const AttendancePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { groups, attendance, fetchGroups, fetchAttendance, markAttendance, isLoading } = useAdminStore();
  const { fetchGroupStudents } = useAdminStore();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [lessonDate, setLessonDate] = useState(() => localYmd());
  const [topic, setTopic] = useState('');
  const [topicSaving, setTopicSaving] = useState(false);
  const { showToast } = useToast();
  const markDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    return () => {
      if (markDebounceRef.current) clearTimeout(markDebounceRef.current);
    };
  }, []);

  const loadGroup = async (groupId: string) => {
    setSelectedGroupId(groupId);
    const data = await fetchGroupStudents(groupId);
    setStudents(data || []);
    await fetchAttendance(groupId);
  };

  useEffect(() => {
    const gid = searchParams.get('group');
    if (!gid || groups.length === 0) return;
    const exists = groups.some((g: any) => String(g.id) === String(gid));
    if (exists && selectedGroupId !== gid) {
      loadGroup(gid);
    }
  }, [searchParams, groups]);

  const selectedGroup = groups.find((g: any) => g.id === selectedGroupId);

  const lessonDateLabel = useMemo(() => {
    const [y, m, d] = lessonDate.split('-').map(Number);
    if (!y || !m || !d) return lessonDate;
    return formatUzbekDayMonthYear(new Date(y, m - 1, d));
  }, [lessonDate]);

  const scheduleAllowsMarking = useMemo(() => {
    if (!selectedGroup) return true;
    const [y, m, d] = lessonDate.split('-').map(Number);
    if (!y || !m || !d) return true;
    return isGroupLessonDay(selectedGroup.schedule, new Date(y, m - 1, d));
  }, [selectedGroup, lessonDate]);

  const todayStr = localYmd();
  const isFutureDate = lessonDate > todayStr;
  const canMarkDate = lessonDate <= todayStr;

  useEffect(() => {
    if (!selectedGroupId || !lessonDate) {
      setTopic('');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/groups/${selectedGroupId}/lesson-log`, { params: { date: lessonDate } });
        if (!cancelled) setTopic((data as any)?.topic ? String((data as any).topic) : '');
      } catch {
        if (!cancelled) setTopic('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedGroupId, lessonDate]);

  const saveTopic = async () => {
    if (!selectedGroupId) return;
    setTopicSaving(true);
    try {
      await api.post(`/groups/${selectedGroupId}/lesson-log`, {
        lesson_date: lessonDate,
        topic: topic.trim() || null,
      });
      showToast('Dars mavzusi saqlandi', 'success');
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Saqlashda xatolik', 'error');
    } finally {
      setTopicSaving(false);
    }
  };

  const onGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    if (groupId) {
      setSearchParams({ group: groupId });
      loadGroup(groupId);
    } else {
      setSearchParams({});
      setStudents([]);
      setTopic('');
    }
  };

  const handleMark = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    if (isFutureDate) {
      showToast('Kelajak sanasiga davomat qo‘yib bo‘lmaydi', 'error');
      return;
    }
    if (!canMarkDate) {
      showToast('Sana noto‘g‘ri', 'error');
      return;
    }
    if (markDebounceRef.current) clearTimeout(markDebounceRef.current);
    markDebounceRef.current = setTimeout(async () => {
      markDebounceRef.current = null;
      try {
        await markAttendance({
          student_id: studentId,
          group_id: selectedGroupId,
          status,
          lesson_date: lessonDate,
        });
        await fetchAttendance(selectedGroupId);
      } catch (e: any) {
        showToast(e?.response?.data?.message || 'Davomat yozilmadi', 'error');
      }
    }, 380);
  };

  const rowsForDate = attendance.filter(
    (a: any) => toLocalYmd(a.lesson_date) === lessonDate,
  );
  const presentCount = rowsForDate.filter((a: any) => {
    const u = String(a.status || '').toUpperCase();
    return u === 'PRESENT' || u === 'LATE';
  }).length;
  const totalStudents = students.length || 1;
  const attendancePercent = Math.round((presentCount / totalStudents) * 100);

  return (
    <div className="page-container animate-in">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="label-subtle mb-1">GURUHLAR › DAVOMAT</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-[var(--text-h)]">
            {selectedGroup?.name || 'Davomat'}
          </h1>
          {selectedGroup && (
            <p className="mt-0.5 text-sm text-slate-400">{selectedGroup.course_name}</p>
          )}
        </div>
        <select
          value={selectedGroupId}
          onChange={(e) => onGroupChange(e.target.value)}
          className="select max-w-xs bg-[var(--bg-card)] text-[var(--text-h)]"
        >
          <option value="">Guruhni tanlang</option>
          {groups.map((g: any) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {selectedGroupId ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="card p-6 dark:border-[var(--border)] dark:bg-[var(--bg-card)]">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="section-title">Dars sanasi va mavzu</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{lessonDateLabel}</p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sana</label>
                  <input
                    type="date"
                    value={lessonDate}
                    max={todayStr}
                    onChange={(e) => setLessonDate(e.target.value)}
                    className="input max-w-[200px] text-sm"
                  />
                </div>
              </div>
              {isFutureDate && (
                <p className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-800 dark:text-red-200">
                  Kelajak sanasi tanlangan. Davomat faqat bugun yoki o‘tgan kunlar uchun.
                </p>
              )}
              {!scheduleAllowsMarking && !isFutureDate && (
                <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-800 dark:text-amber-200">
                  Jadval bo‘yicha bu kunda dars kuni ko‘rinmayapti — baribir davomatni belgilashingiz mumkin (masalan, qo‘shimcha dars yoki jadval yangilanmagan bo‘lsa).
                </p>
              )}
              <label className="input-label">Bugun nima o‘tilgani?</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                className="input min-h-[88px] resize-y"
                placeholder="Masalan: NestJS modullar, dependency injection..."
              />
              <button
                type="button"
                onClick={saveTopic}
                disabled={topicSaving}
                className="btn-primary mt-3 w-full sm:w-auto"
              >
                {topicSaving ? 'Saqlanmoqda…' : 'Mavzuni saqlash'}
              </button>
            </div>

            <div className="card p-6 dark:border-[var(--border)] dark:bg-[var(--bg-card)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="section-title">Talabalar davomati</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Har bir talaba uchun ushbu kunda bitta holat</p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map((s: any) => {
                    const record = rowsForDate.find((a: any) => a.student_id === s.id);
                    const status = record?.status;
                    return (
                      <div
                        key={s.id}
                        className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 transition-all dark:border-[var(--border)] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-700 dark:text-[var(--text-h)]">
                            {s.first_name} {s.last_name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Tel: {s.phone?.trim() ? s.phone : '—'}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'status-pill',
                              s.status === 'active' ? 'pill-active' : s.status === 'frozen' ? 'pill-frozen' : 'pill-active',
                            )}
                          >
                            {s.status === 'active' ? 'faol' : s.status === 'frozen' ? 'muzlatilgan' : 'faol'}
                          </span>
                          {s.status === 'frozen' ? (
                            <span className="text-xs font-semibold text-slate-400">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                disabled={!canMarkDate || isFutureDate}
                                onClick={() => handleMark(s.id, 'PRESENT')}
                                className={cn(
                                  'rounded-lg border px-3 py-2 text-xs font-bold transition-all',
                                  status?.toUpperCase() === 'PRESENT'
                                    ? 'border-green-500 bg-green-500 text-white'
                                    : 'border-slate-200 text-slate-500 hover:border-green-300 hover:text-green-600 dark:border-[var(--border)]',
                                  (!canMarkDate || isFutureDate) && 'cursor-not-allowed opacity-40',
                                )}
                              >
                                Keldi
                              </button>
                              <button
                                type="button"
                                disabled={!canMarkDate || isFutureDate}
                                onClick={() => handleMark(s.id, 'LATE')}
                                className={cn(
                                  'rounded-lg border px-3 py-2 text-xs font-bold transition-all',
                                  status?.toUpperCase() === 'LATE'
                                    ? 'border-amber-500 bg-amber-500 text-white'
                                    : 'border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-700 dark:border-[var(--border)]',
                                  (!canMarkDate || isFutureDate) && 'cursor-not-allowed opacity-40',
                                )}
                              >
                                Kech qoldi
                              </button>
                              <button
                                type="button"
                                disabled={!canMarkDate || isFutureDate}
                                onClick={() => handleMark(s.id, 'ABSENT')}
                                className={cn(
                                  'rounded-lg border px-3 py-2 text-xs font-bold transition-all',
                                  status?.toUpperCase() === 'ABSENT'
                                    ? 'border-red-500 bg-red-500 text-white'
                                    : 'border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600 dark:border-[var(--border)]',
                                  (!canMarkDate || isFutureDate) && 'cursor-not-allowed opacity-40',
                                )}
                              >
                                Kelmagan
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {students.length === 0 && (
                    <div className="py-12 text-center text-slate-400">Bu guruhda talabalar yo'q</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-6 dark:border-[var(--border)] dark:bg-[var(--bg-card)]">
              <h3 className="section-title mb-4">Tanlangan kun</h3>
              <p className="text-2xl font-black text-slate-800 dark:text-[var(--text-h)]">{lessonDateLabel}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-primary-50 p-4 text-center dark:bg-primary-900/25">
                  <p className="text-2xl font-black text-primary-600 dark:text-primary-300">{students.length}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase text-primary-400">Talabalar</p>
                </div>
                <div className="rounded-xl bg-green-50 p-4 text-center dark:bg-emerald-900/25">
                  <p className="text-2xl font-black text-green-600 dark:text-emerald-300">{presentCount}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase text-green-400">Kelganlar</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Davomat</span>
                  <span className="font-bold text-green-600 dark:text-emerald-400">{attendancePercent}%</span>
                </div>
                <SparklineChart
                  className="mt-1"
                  height={40}
                  color="#22c55e"
                  values={[0, Math.max(0, Math.min(100, attendancePercent))]}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-16 text-center dark:border-[var(--border)]">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h2 className="text-lg font-bold text-slate-500 dark:text-slate-400">Guruhni tanlang</h2>
          <p className="mt-1 text-sm text-slate-400">Davomat belgilash uchun guruhni tanlang.</p>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
