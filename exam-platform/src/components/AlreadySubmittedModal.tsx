import React from 'react';
import { createPortal } from 'react-dom';
import { ShieldX } from 'lucide-react';
import { useModalOverlayEffects } from '../hooks/useModalOverlayEffects';

interface AlreadySubmittedModalProps {
  isOpen: boolean;
  onGoHome: () => void;
}

const AlreadySubmittedModal: React.FC<AlreadySubmittedModalProps> = ({ isOpen, onGoHome }) => {
  useModalOverlayEffects(isOpen, { onEscape: onGoHome });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#08060d]/55 backdrop-blur-md" aria-hidden />
      <div className="relative w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] shadow-2xl p-8 animate-in-scale z-10 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-2xl font-black text-[var(--text-h)] mb-2">Allaqachon topshirilgan</h3>
        <p className="text-[var(--text)] font-medium mb-6">Bu imtihon allaqachon topshirilgan. Qayta kirish mumkin emas.</p>
        <button type="button" onClick={onGoHome} className="cursor-pointer w-full btn-primary">
          Asosiy sahifaga qaytish
        </button>
      </div>
    </div>,
    document.body
  );
};

export default AlreadySubmittedModal;
