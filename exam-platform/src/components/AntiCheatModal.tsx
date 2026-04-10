import React from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, X } from 'lucide-react';
import { useModalOverlayEffects } from '../hooks/useModalOverlayEffects';

interface AntiCheatModalProps {
  isOpen: boolean;
  violations: number;
  onClose: () => void;
}

const AntiCheatModal: React.FC<AntiCheatModalProps> = ({ isOpen, violations, onClose }) => {
  useModalOverlayEffects(isOpen, { onEscape: onClose });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-red-950/50 backdrop-blur-md" aria-hidden />
      <div className="relative w-full max-w-sm max-h-[min(520px,85dvh)] overflow-y-auto bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] shadow-2xl p-8 animate-in-scale z-10 text-center">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer absolute top-4 right-4 p-2 text-[var(--text)] hover:text-[var(--text-h)] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-500/20">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>

        <h3 className="text-3xl font-black text-[var(--text-h)] mb-2 tracking-tight">OGOHLANTIRISH!</h3>
        <p className="text-[var(--text)] font-bold mb-4 text-sm leading-relaxed px-4">
          Boshqa tab yoki dasturga o&apos;tish yoki imtihon oynasidan chiqish qoidalarga zid. Har safar ogohlantirish beriladi (jami 3 imkoniyat).
        </p>
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className={`text-4xl font-black ${violations >= 2 ? 'text-red-500 animate-bounce' : 'text-[var(--text-h)]'}`}>
            {violations} <span className="text-[var(--text)] opacity-40">/ 3</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 bg-red-50 dark:bg-red-950/30 px-4 py-1.5 rounded-full max-w-[90%]">
            {violations === 1
              ? '1-chi ogohlantirish — keyingi safar diqqat'
              : '2-chi ogohlantirish — 3-chi marta imtihon yopiladi va chetlashtirasiz'}
          </div>
        </div>
        <button type="button" onClick={onClose} className="cursor-pointer w-full btn-primary">
          Tushundim, davom etaman
        </button>
      </div>
    </div>,
    document.body
  );
};

export default AntiCheatModal;
