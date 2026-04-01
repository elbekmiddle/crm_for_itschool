import { useEffect, useState, useCallback, useRef } from 'react';

interface AntiCheatOptions {
  onWarning: (count: number) => void;
  onAutoSubmit: () => void;
  maxWarnings?: number;
  examId: string;
}

export const useExamAntiCheat = ({ onWarning, onAutoSubmit, maxWarnings = 3, examId }: AntiCheatOptions) => {
  const [warnings, setWarnings] = useState(0);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // 1. Detect Tab Switch (Visibility API)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      setWarnings(prev => {
        const next = prev + 1;
        onWarning(next);
        if (next >= maxWarnings) {
          onAutoSubmit();
        }
        return next;
      });
    }
  }, [onWarning, onAutoSubmit, maxWarnings]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleVisibilityChange]);

  // 2. Detect Focus/Blur
  useEffect(() => {
    const handleBlur = () => {
      // Small timeout to skip momentary blurs
      setTimeout(() => {
         if (!document.hasFocus()) {
            setWarnings(prev => {
               const next = prev + 1;
               onWarning(next);
               if (next >= maxWarnings) onAutoSubmit();
               return next;
            });
         }
      }, 500);
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [onWarning, onAutoSubmit, maxWarnings]);

  // 3. Multi-tab detection
  useEffect(() => {
    const channelName = `exam_${examId}`;
    channelRef.current = new BroadcastChannel(channelName);
    
    // Announce existence to other tabs
    channelRef.current.postMessage({ type: 'CHECK_EXISTENCE' });

    channelRef.current.onmessage = (event) => {
      if (event.data.type === 'CHECK_EXISTENCE' || event.data.type === 'EXISTENCE_RESPONSE') {
        // Another tab of the same exam is open
        alert("IT School Anti-cheat: Sizda ushbu imtihonning bir nechta oynasi ochilgan yoki boshqa tabda faol sessiya bor. Sessiya bitta oynada bo'lishi shart.");
        onAutoSubmit();
      }
    };

    return () => {
      channelRef.current?.close();
    };
  }, [examId, onAutoSubmit]);

  return { warnings };
};
