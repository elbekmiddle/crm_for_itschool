import React from 'react';
import { AlertCircle, Send } from 'lucide-react';

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalQuestions: number;
  answeredCount: number;
}

const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions,
  answeredCount,
}) => {
  if (!isOpen) return null;

  const unanswered = totalQuestions - answeredCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 animate-in-scale z-10 text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Send className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Topshirasizmi?</h3>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4">
            <span className="text-sm font-semibold text-slate-500">Jami savollar</span>
            <span className="text-lg font-black text-slate-800">{totalQuestions}</span>
          </div>
          <div className="flex items-center justify-between bg-green-50 rounded-2xl p-4">
            <span className="text-sm font-semibold text-green-600">Javob berilgan</span>
            <span className="text-lg font-black text-green-700">{answeredCount}</span>
          </div>
          {unanswered > 0 && (
            <div className="flex items-center justify-between bg-amber-50 rounded-2xl p-4">
              <span className="text-sm font-semibold text-amber-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Javobsiz
              </span>
              <span className="text-lg font-black text-amber-700">{unanswered}</span>
            </div>
          )}
        </div>

        {unanswered > 0 && (
          <p className="text-amber-600 text-sm font-bold mb-4">
            Hali {unanswered} ta savolga javob bermadingiz!
          </p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary">
            Ortga
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 btn-primary">
            Topshirish
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitConfirmModal;
