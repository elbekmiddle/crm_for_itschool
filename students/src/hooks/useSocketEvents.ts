import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotifications } from './useNotifications';

let socket: Socket | null = null;

export const useSocketEvents = (userId?: string) => {
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Only connect if not already connected
    if (!socket) {
      // Typically backend is on port 5001 or read from env
      socket = io('http://localhost:5001');
    }

    const onExamCreated = (exam: any) => {
      addNotification(`Yangi imtihon qo'shildi! 📝 ${exam?.title}`, 'info');
    };

    const onExamStarted = (data: any) => {
      addNotification(`Talaba ${data.studentName} imtihonni boshladi: ${data.examId}`, 'info');
    };

    const onAttendanceMissed = (data: any) => {
      addNotification(`Talaba dars qoldirdi: ${data.studentId}`, 'error');
    };

    const onExamApproved = (data: any) => {
      addNotification(`Imtihon faollashtirildi: ${data.title}`, 'success');
    };

    socket.on('exam_created', onExamCreated);
    socket.on('exam_started', onExamStarted);
    socket.on('attendance_missed', onAttendanceMissed);
    socket.on('exam_approved', onExamApproved);

    return () => {
      if (socket) {
        socket.off('exam_created', onExamCreated);
        socket.off('exam_started', onExamStarted);
        socket.off('attendance_missed', onAttendanceMissed);
        socket.off('exam_approved', onExamApproved);
      }
    };
  }, [addNotification, userId]);

  return socket;
};
