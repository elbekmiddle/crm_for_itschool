import React from 'react';
import { ShieldAlert, X } from 'lucide-react';

interface AntiCheatModalProps {
  isOpen: boolean;
  violations: number;
  onClose: () => void;
}

const AntiCheatModal: React.FC<AntiCheatModalProps> = ({ isOpen, violations, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-red-900/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 animate-in-scale z-10 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 pulse-glow">
          <ShieldAlert className="w-10 h-10 text-red-600" />
        </div>

        <h3 className="text-2xl font-black text-slate-900 mb-2">Ogohlantirish!</h3>
        <p className="text-slate-500 font-medium mb-2">
          Imtihon paytida sahifani tark etmang.
        </p>
        <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-black mb-6">
          ⚠️ Ogohlantirish {violations} / 3
        </div>
        {violations >= 2 && (
          <p className="text-red-500 text-sm font-bold mb-4">
            Keyingi safar imtihon avtomatik topshiriladi!
          </p>
        )}
        <button onClick={onClose} className="w-full btn-primary">
          Tushundim, davom etaman
        </button>
      </div>
    </div>
  );
};

export default AntiCheatModal;
