import React, { useEffect } from 'react';
import { useExamStore } from '../store/useExamStore';

const ExamTimer: React.FC = () => {
  const { timeLeft, tick } = useExamStore();
  
  useEffect(() => {
    const timer = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(timer);
  }, [tick]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const isLowTime = timeLeft < 300; // 5 mins

  return (
    <div className={`sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b bg-white shadow-sm transition-colors duration-300 ${isLowTime ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full animate-pulse ${isLowTime ? 'bg-red-500' : 'bg-primary-500'}`} />
        <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Imtihon Davom Etmoqda</span>
      </div>
      
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-400 font-medium">Qolgan Vaqt:</span>
        <div className={`text-3xl font-mono font-extrabold tabular-nums transition-colors ${isLowTime ? 'text-red-600' : 'text-primary-700'}`}>
          {formatTime(timeLeft)}
        </div>
      </div>
    </div>
  );
};

export default ExamTimer;
