import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

interface AntiCheatViolation {
  type: 'tab_switch' | 'screen_share' | 'minimize' | 'copy_paste' | 'right_click';
  timestamp: Date;
  severity: 'warning' | 'critical';
}

interface AntiCheatConfig {
  enableTabMonitoring: boolean;
  enableScreenShare: boolean;
  enableCopyPaste: boolean;
  enableRightClick: boolean;
  maxViolations: number;
  onViolation?: (violation: AntiCheatViolation) => void;
  onMaxViolationsReached?: () => void;
}

export const useAntiCheat = (config: AntiCheatConfig = {}) => {
  const defaultConfig: AntiCheatConfig = {
    enableTabMonitoring: true,
    enableScreenShare: true,
    enableCopyPaste: true,
    enableRightClick: true,
    maxViolations: 3,
    ...config,
  };

  const [violations, setViolations] = useState<AntiCheatViolation[]>([]);
  const [isTabActive, setIsTabActive] = useState(true);
  const documentHiddenRef = useRef<string | null>(null);

  // Detect tab/window switching
  useEffect(() => {
    if (!defaultConfig.enableTabMonitoring) return;

    // Check for hidden property
    const hiddenProperty = ['hidden', 'webkitHidden', 'mozHidden', 'msHidden'].find(
      (prop) => prop in document,
    ) as string | undefined;

    if (hiddenProperty) {
      documentHiddenRef.current = hiddenProperty;
    }

    const handleVisibilityChange = () => {
      const isHidden = document[documentHiddenRef.current as keyof Document] as boolean;
      setIsTabActive(!isHidden);

      if (isHidden) {
        const violation: AntiCheatViolation = {
          type: 'tab_switch',
          timestamp: new Date(),
          severity: 'warning',
        };
        recordViolation(violation);
        toast.error('⚠️ Tab o\'zgartirishni payqadik!');
      }
    };

    const handleWindowBlur = () => {
      const violation: AntiCheatViolation = {
        type: 'minimize',
        timestamp: new Date(),
        severity: 'warning',
      };
      recordViolation(violation);
      toast.error('⚠️ Oyna minimized!');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [defaultConfig.enableTabMonitoring]);

  // Disable copy/paste
  useEffect(() => {
    if (!defaultConfig.enableCopyPaste) return;

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      const violation: AntiCheatViolation = {
        type: 'copy_paste',
        timestamp: new Date(),
        severity: 'critical',
      };
      recordViolation(violation);
      toast.error('❌ Copy-paste taqiqlangan!');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const violation: AntiCheatViolation = {
        type: 'copy_paste',
        timestamp: new Date(),
        severity: 'critical',
      };
      recordViolation(violation);
      toast.error('❌ Paste taqiqlangan!');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
    };
  }, [defaultConfig.enableCopyPaste]);

  // Disable right-click
  useEffect(() => {
    if (!defaultConfig.enableRightClick) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const violation: AntiCheatViolation = {
        type: 'right_click',
        timestamp: new Date(),
        severity: 'warning',
      };
      recordViolation(violation);
      toast.error('❌ Right-click taqiqlangan!');
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [defaultConfig.enableRightClick]);

  // Disable keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+C
      if (e.key === 'F12') {
        e.preventDefault();
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const recordViolation = useCallback(
    (violation: AntiCheatViolation) => {
      setViolations((prev) => {
        const newViolations = [...prev, violation];

        if (defaultConfig.onViolation) {
          defaultConfig.onViolation(violation);
        }

        if (newViolations.length >= (defaultConfig.maxViolations || 3)) {
          if (defaultConfig.onMaxViolationsReached) {
            defaultConfig.onMaxViolationsReached();
          }
        }

        return newViolations;
      });
    },
    [defaultConfig],
  );

  return {
    violations,
    isTabActive,
    violationCount: violations.length,
  };
};

export default useAntiCheat;
