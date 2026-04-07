import { useEffect, useCallback, useState } from 'react';
import { getRealtimeSocket } from '../lib/realtimeSocket';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(() => getRealtimeSocket().connected);

  useEffect(() => {
    const s = getRealtimeSocket();
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    setIsConnected(s.connected);
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, []);

  const joinExamRoom = useCallback(
    (examId: string, userId: string, role: 'teacher' | 'student') => {
      const s = getRealtimeSocket();
      if (s.connected) {
        s.emit('join_exam_room', { examId, userId, role });
      }
    },
    [],
  );

  const leaveExamRoom = useCallback((examId: string, userId: string) => {
    const s = getRealtimeSocket();
    if (s.connected) {
      s.emit('leave_exam_room', { examId, userId });
    }
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    getRealtimeSocket().on(event, callback);
  }, []);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    const s = getRealtimeSocket();
    if (callback) s.off(event, callback);
    else s.off(event);
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    const s = getRealtimeSocket();
    if (s.connected) s.emit(event, data);
  }, []);

  return {
    socket: getRealtimeSocket(),
    isConnected,
    joinExamRoom,
    leaveExamRoom,
    on,
    off,
    emit,
  };
};

export default useSocket;
