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
      <div className="absolute inset-0 bg-red-900/60 backdrop-blur-md" aria-hidden />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 animate-in-scale z-10 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow border-8 border-red-50">
          <ShieldAlert className="w-12 h-12 text-red-600" />
        </div>

        <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">OGOHLANTIRISH!</h3>
        <p className="text-slate-500 font-bold mb-4 text-sm leading-relaxed px-4">
          Imtihon paytida sahifani tark etmang yoki boshqa oynaga o&apos;tmoqing.
        </p>
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className={`text-4xl font-black ${violations >= 2 ? 'text-red-600 animate-bounce' : 'text-slate-800'}`}>
            {violations} <span className="text-slate-300">/ 3</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 bg-red-50 px-4 py-1.5 rounded-full">
            {violations === 1 ? 'Birinchi ogohlantirish' : 'OXIRGI OGOHLANTIRISH!'}
          </div>
        </div>
        <button type="button" onClick={onClose} className="w-full btn-primary">
          Tushundim, davom etaman
        </button>
      </div>
    </div>,
    document.body
  );
};

export default AntiCheatModal;
