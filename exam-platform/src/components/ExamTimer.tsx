import React, { useEffect } from 'react';
import { useExamStore } from '../store/useExamStore';
import { Timer } from 'lucide-react';
import { cn } from '../lib/utils';

const ExamTimer: React.FC = () => {
  const { timeLeft, tick, examTitle } = useExamStore();

  useEffect(() => {
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [tick]);

  const formatTime = (seconds: number) => {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const isLowTime = timeLeft < 300; // 5 min
  const isCritical = timeLeft < 60; // 1 min

  return (
    <div
      className={cn(
        "sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 border-b transition-all duration-500",
        isCritical
          ? "bg-red-50 border-red-200"
          : isLowTime
            ? "bg-amber-50 border-amber-200"
            : "bg-white/90 backdrop-blur-md border-slate-100"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full animate-pulse",
            isCritical ? "bg-red-500" : isLowTime ? "bg-amber-500" : "bg-green-500"
          )}
        />
        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider hidden md:block">
          {examTitle || "Imtihon"}
        </span>
        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider md:hidden">
          Imtihon
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Timer className={cn("w-5 h-5", isCritical ? "text-red-500" : isLowTime ? "text-amber-500" : "text-slate-400")} />
        <div
          className={cn(
            "text-2xl md:text-3xl font-mono font-black tabular-nums transition-colors",
            isCritical ? "text-red-600 pulse-glow rounded-xl px-3 py-1" : isLowTime ? "text-amber-600" : "text-primary-700"
          )}
        >
          {formatTime(timeLeft)}
        </div>
      </div>
    </div>
  );
};

export default ExamTimer;
