import { useEffect, useRef, useCallback } from 'react';
import { getRealtimeSocket } from '../lib/realtimeSocket';
import { useNotifications } from './useNotifications';
import { useAdminStore } from '../store/useAdminStore';
import { useStudentStore } from '../store/useStudentStore';

/** Bir nechta tez event ketmasligi uchun dashboard yangilanishini birlashtiramiz. */
function useDebouncedDashboardRefresh(delayMs: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const st = useAdminStore.getState();
      void st.fetchStats();
      void st.fetchPayments();
      void st.fetchStudents(1, 20);
      void st.fetchGroups();
      void st.fetchCourses();
      void st.fetchLeads();
      void st.fetchExams();
      void st.fetchUsers();
    }, delayMs);
  }, [delayMs]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return schedule;
}

export const useSocketEvents = () => {
  const { addNotification } = useNotifications();
  const user = useAdminStore((s) => s.user);
  const scheduleDashboardRefresh = useDebouncedDashboardRefresh(350);

  useEffect(() => {
    const s = getRealtimeSocket();
    const isStudent = user?.role === 'STUDENT';

    const emitJoinApp = () => {
      if (user?.id) {
        s.emit('join_app', { userId: user.id, role: user.role });
      }
    };

    const refreshStaffData = () => {
      if (!isStudent) scheduleDashboardRefresh();
      else void useStudentStore.getState().fetchExams();
    };

    const onExamCreated = (exam: { title?: string }) => {
      addNotification({
        title: 'Imtihon yaratildi',
        message: `Yangi imtihon qo'shildi! 📝 ${exam?.title ?? ''}`,
        type: 'info',
      });
      refreshStaffData();
    };

    const onExamStarted = (data: { studentName?: string; examId?: string }) => {
      if (!isStudent) {
        addNotification({
          title: 'Imtihon boshlandi',
          message: `Talaba ${data.studentName ?? ''} imtihonni boshladi: ${data.examId ?? ''}`,
          type: 'info',
        });
      }
    };

    const onAttendanceMissed = (data: { studentId?: string }) => {
      if (!isStudent) {
        addNotification({
          title: 'Dars qoldirildi',
          message: `Talaba dars qoldirdi: ${data.studentId ?? ''}`,
          type: 'error',
        });
        scheduleDashboardRefresh();
      }
    };

    const onExamApproved = (data: { title?: string; examId?: string }) => {
      addNotification({
        title: 'Imtihon tasdiqlandi',
        message: `Imtihon faollashtirildi: ${data.title ?? data.examId ?? ''}`,
        type: 'success',
      });
      refreshStaffData();
    };

    const onNewLead = (lead: { first_name?: string; phone?: string }) => {
      if (!isStudent) {
        addNotification({
          title: 'Yangi lead',
          message: `${lead?.first_name ?? 'Yangi'} — ${lead?.phone ?? ''}`,
          type: 'info',
        });
        scheduleDashboardRefresh();
      }
    };

    const onLeadConverted = () => {
      if (!isStudent) {
        addNotification({
          title: 'Lead aylantirildi',
          message: "Talaba ro'yxatga olindi",
          type: 'success',
        });
        scheduleDashboardRefresh();
      }
    };

    const onDashboardRefresh = () => {
      refreshStaffData();
    };

    const onExamUpdated = () => {
      if (isStudent) void useStudentStore.getState().fetchExams();
      else scheduleDashboardRefresh();
    };

    s.on('connect', emitJoinApp);
    if (s.connected) emitJoinApp();

    s.on('exam_created', onExamCreated);
    s.on('exam_started', onExamStarted);
    s.on('attendance_missed', onAttendanceMissed);
    s.on('exam_approved', onExamApproved);
    s.on('new_lead', onNewLead);
    s.on('lead_converted', onLeadConverted);
    s.on('dashboard_refresh', onDashboardRefresh);
    s.on('exam_updated', onExamUpdated);

    return () => {
      s.off('connect', emitJoinApp);
      s.off('exam_created', onExamCreated);
      s.off('exam_started', onExamStarted);
      s.off('attendance_missed', onAttendanceMissed);
      s.off('exam_approved', onExamApproved);
      s.off('new_lead', onNewLead);
      s.off('lead_converted', onLeadConverted);
      s.off('dashboard_refresh', onDashboardRefresh);
      s.off('exam_updated', onExamUpdated);
    };
  }, [addNotification, user?.id, user?.role, scheduleDashboardRefresh]);

  return getRealtimeSocket();
};
