import React from 'react';
import { ShieldX } from 'lucide-react';

interface AlreadySubmittedModalProps {
  isOpen: boolean;
  onGoHome: () => void;
}

const AlreadySubmittedModal: React.FC<AlreadySubmittedModalProps> = ({ isOpen, onGoHome }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 animate-in-scale z-10 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-600" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Allaqachon topshirilgan</h3>
        <p className="text-slate-500 font-medium mb-6">
          Bu imtihon allaqachon topshirilgan. Qayta kirish mumkin emas.
        </p>
        <button onClick={onGoHome} className="w-full btn-primary">
          Asosiy sahifaga qaytish
        </button>
      </div>
    </div>
  );
};

export default AlreadySubmittedModal;
