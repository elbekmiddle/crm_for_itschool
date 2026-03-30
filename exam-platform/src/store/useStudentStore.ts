import { create } from 'zustand';
import api from '../lib/api';
import type { Student, CourseInfo, AttendanceRecord, AttendanceStats, Payment, StudentStats } from '../types';

const isDev = import.meta.env.DEV;
const devLog = (...args: any[]) => { if (isDev) console.log('[StudentStore]', ...args); };

interface StudentState {
  profile: Student | null;
  course: CourseInfo | null;
  attendance: AttendanceRecord[];
  attendanceStats: AttendanceStats | null;
  payments: Payment[];
  stats: StudentStats | null;
  isLoading: boolean;

  fetchProfile: () => Promise<void>;
  fetchCourse: () => Promise<void>;
  fetchAttendance: (studentId: string) => Promise<void>;
  fetchPayments: (studentId: string) => Promise<void>;
  fetchStats: () => Promise<void>;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  profile: null,
  course: null,
  attendance: [],
  attendanceStats: null,
  payments: [],
  stats: null,
  isLoading: false,

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      // Try the dashboard endpoint which returns full student info
      const { data } = await api.get('/students/me');
      devLog('fetchProfile:', data);
      set({ profile: data });
    } catch (e1) {
      try {
        // Fallback: use analytics student endpoint with self
        const { data } = await api.get('/analytics/student/me');
        devLog('fetchProfile fallback:', data);
        set({ profile: data });
      } catch (e2) {
        devLog('fetchProfile failed:', e2);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCourse: async () => {
    set({ isLoading: true });
    try {
      // Try student's own dashboard which includes group/course info
      const { data } = await api.get('/students/dashboard/me');
      devLog('fetchCourse (dashboard):', data);
      if (data) {
        set({
          course: {
            course_name: data.course_name || data.course,
            name: data.course_name || data.course,
            level: data.level,
            group_name: data.group_name || data.group,
            teacher_name: data.teacher_name || data.teacher,
          } as CourseInfo,
        });
      }
    } catch (e1) {
      try {
        // Fallback: GET /courses (if student is enrolled, returns their course)
        const { data } = await api.get('/courses');
        const courses = Array.isArray(data) ? data : data.data || [];
        devLog('fetchCourse (courses list):', courses);
        if (courses.length > 0) set({ course: courses[0] });
      } catch (e2) {
        devLog('fetchCourse failed:', e2);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAttendance: async (studentId: string) => {
    set({ isLoading: true });
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
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/payments/student/${studentId}`);
      devLog('fetchPayments:', Array.isArray(data) ? data.length : data);
      set({ payments: Array.isArray(data) ? data : [] });
    } catch (e) {
      devLog('fetchPayments failed:', e);
      set({ payments: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const { data } = await api.get('/students/me/stats');
      devLog('fetchStats:', data);
      set({ stats: data });
    } catch (e1) {
      try {
        // Fallback: analytics dashboard for student
        const { data } = await api.get('/analytics/student/me');
        devLog('fetchStats analytics:', data);
        set({
          stats: {
            total_exams: data.total_exams || 0,
            average_score: data.average_score || 0,
            attendance_percentage: data.attendance_percentage || 0,
            missed_lessons: data.absent_count || data.missed_lessons || 0,
            total_payments: data.total_payments || 0,
          },
        });
      } catch (e2) {
        devLog('fetchStats failed, using defaults');
        set({
          stats: {
            total_exams: 0,
            average_score: 0,
            attendance_percentage: 0,
            missed_lessons: 0,
            total_payments: 0,
          },
        });
      }
    }
  },
}));
