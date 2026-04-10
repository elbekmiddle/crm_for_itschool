import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';
import { useModalOverlayEffects } from '../hooks/useModalOverlayEffects';

interface TimeUpModalProps {
  isOpen: boolean;
  onAutoSubmit: () => void;
}

const TimeUpModal: React.FC<TimeUpModalProps> = ({ isOpen, onAutoSubmit }) => {
  useModalOverlayEffects(isOpen);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onAutoSubmit, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onAutoSubmit]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="cursor-default absolute inset-0 bg-[#08060d]/60 backdrop-blur-md" aria-hidden />
      <div className="relative w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] shadow-2xl p-8 animate-in-scale z-10 text-center">
        <div className="w-20 h-20 bg-amber-500/15 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
          <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
        </div>
        <h3 className="text-2xl font-black text-[var(--text-h)] mb-2">Vaqt Tugadi!</h3>
        <p className="text-[var(--text)] font-medium mb-6">Imtihon vaqti tugadi. Javoblaringiz avtomatik topshirilmoqda...</p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TimeUpModal;
