import { create } from 'zustand';
import api from '../lib/api';
import type { Student, CourseInfo, AttendanceRecord, AttendanceStats, Payment, StudentStats, Notification } from '../types';

const isDev = import.meta.env.DEV;
const devLog = (...args: any[]) => { if (isDev) console.log('[StudentStore]', ...args); };

interface StudentState {
  profile: Student | null;
  course: CourseInfo | null;
  attendance: AttendanceRecord[];
  attendanceStats: AttendanceStats | null;
  payments: Payment[];
  stats: StudentStats | null;
  notifications: Notification[];
  isLoading: boolean;

  fetchProfile: () => Promise<void>;
  fetchCourse: () => Promise<void>;
  fetchAttendance: (studentId: string) => Promise<void>;
  fetchPayments: (studentId: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
}

export const useStudentStore = create<StudentState>()((set, get) => ({
  profile: null,
  course: null,
  attendance: [],
  attendanceStats: null,
  payments: [],
  stats: null,
  notifications: [],
  isLoading: false,

  fetchProfile: async () => {
    const { profile } = get();
    if (!profile) set({ isLoading: true });
    try {
      const { data } = await api.get('/students/me');
      set({ profile: data, isLoading: false });
    } catch {
      try {
        const { data } = await api.get('/analytics/student/me');
        set({ profile: data, isLoading: false });
      } catch (e2) {
        set({ isLoading: false });
      }
    }
  },

  fetchCourse: async () => {
    const { course } = get();
    if (!course) set({ isLoading: true });
    try {
      const { data } = await api.get('/students/me/dashboard');
      if (data && data.courses && data.courses.length > 0) {
        const c = data.courses[0];
        const g = data.groups?.[0];
        set({
          course: {
            id: c.course_id || 'base-1',
            name: c.course_name || 'Kurs',
            course_name: c.course_name,
            level: c.current_level || 'Boshlang\'ich',
            group_name: g?.group_name || 'Guruhsiz',
            teacher_name: g?.teacher_name || 'Ustoz',
          } as CourseInfo,
          isLoading: false
        });
      }
    } catch {
      try {
        const { data } = await api.get('/courses');
        const courses = Array.isArray(data) ? data : data.data || [];
        if (courses.length > 0) set({ course: courses[0], isLoading: false });
        else set({ isLoading: false });
      } catch (e2) {
        set({ isLoading: false });
      }
    }
  },

  fetchAttendance: async (studentId: string) => {
    const { attendance } = get();
    if (!attendance.length) set({ isLoading: true });
    try {
      const { data } = await api.get(`/students/${studentId}/attendance`);
      devLog('fetchAttendance raw:', data);
      // New backend returns { records, stats }
      if (data && data.records) {
        set({
          attendance: data.records,
          attendanceStats: data.stats,
        });
      } else {
        // Fallback: old format (array)
        const records: AttendanceRecord[] = Array.isArray(data) ? data : [];
        const present = records.filter((r) => r.status === 'PRESENT').length;
        const absent = records.filter((r) => r.status === 'ABSENT').length;
        const total = records.length;
        set({
          attendance: records,
          attendanceStats: {
            total_lessons: total,
            present_count: present,
            absent_count: absent,
            attendance_percentage: total > 0 ? Math.round((present / total) * 100) : 0,
          },
        });
      }
    } catch (e1) {
      devLog('fetchAttendance /students/:id/attendance failed, trying analytics:', e1);
      try {
        const { data } = await api.get(`/analytics/student/${studentId}`);
        set({
          attendance: data.attendance || [],
          attendanceStats: {
            total_lessons: data.total_lessons || 0,
            present_count: data.present_count || 0,
            absent_count: data.absent_count || 0,
            attendance_percentage: data.attendance_percentage || 0,
          },
        });
      } catch (e2) {
        devLog('fetchAttendance failed:', e2);
        set({ attendance: [], attendanceStats: { total_lessons: 0, present_count: 0, absent_count: 0, attendance_percentage: 0 } });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPayments: async (studentId: string) => {
    const { payments } = get();
    if (!payments.length) set({ isLoading: true });
    try {
      const { data } = await api.get(`/payments/student/${studentId}`);
      const pList = Array.isArray(data) ? data : (data.payments || []);
      set({ payments: pList, isLoading: false });
    } catch (e) {
      devLog('fetchPayments failed:', e);
      set({ payments: [], isLoading: false });
    }
  },

  fetchStats: async () => {
    const { stats } = get();
    // Don't show loading for stats as it's background info
    try {
      const { data } = await api.get('/students/me/dashboard');
      const totalExams = data.exams?.length || 0;
      const avgScore = totalExams > 0 
        ? Math.round(data.exams.reduce((acc: number, ex: any) => acc + (ex.score || 0), 0) / totalExams)
        : 0;
      const totalLessons = (data.present_days || 0) + (data.absent_days || 0);
      const attPct = totalLessons > 0 ? Math.round((data.present_days / totalLessons) * 100) : 0;

      set({ 
        stats: {
          total_exams: totalExams,
          average_score: avgScore,
          attendance_percentage: attPct,
          missed_lessons: data.absent_days || 0,
          total_payments: data.payments?.length || 0,
          ai_status: data.ai_status
        }
      });
    } catch (e) {
       // fallback silently or keep old stats
    }
  },

  fetchNotifications: async () => {
    try {
      const { data } = await api.get('/students/me/notifications');
      set({ notifications: Array.isArray(data) ? data : [] });
    } catch {
      // fail silently
    }
  },

  markNotificationRead: async (id: string) => {
    try {
      await api.patch(`/students/me/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
      }));
    } catch {
      // fail silently
    }
  },
}));
