import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Send, CheckCircle2, X } from 'lucide-react';
import { useModalOverlayEffects } from '../hooks/useModalOverlayEffects';

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  totalCount: number;
  answeredCount: number;
}

const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  totalCount,
  answeredCount,
}) => {
  useModalOverlayEffects(isOpen, { onEscape: onCancel });

  if (!isOpen) return null;

  const unanswered = totalCount - answeredCount;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-[#08060d]/55 backdrop-blur-md" onClick={onCancel} aria-hidden />
      <div className="relative w-full max-w-sm max-h-[min(560px,85dvh)] overflow-y-auto bg-[var(--bg-card)] rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 z-10 text-center border border-[var(--border)]">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer absolute top-6 right-6 p-2 text-[var(--text)] hover:text-[var(--text-h)] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 bg-[var(--accent-bg)] rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[var(--accent-border)]">
          <Send className="w-10 h-10 text-[var(--accent)]" />
        </div>

        <h3 className="text-2xl font-black text-[var(--text-h)] mb-2">Imtihonni topshirasizmi?</h3>
        <p className="text-[var(--text)] font-medium mb-8">Natijalaringizni tekshirish uchun topshiring.</p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-[var(--bg-muted)] rounded-2xl p-4 text-left border border-[var(--border)]">
            <p className="text-[10px] font-black text-[var(--text)] uppercase tracking-widest mb-1">Jami</p>
            <p className="text-xl font-black text-[var(--text-h)]">{totalCount}</p>
          </div>
          <div
            className={`rounded-2xl p-4 text-left border ${
              unanswered === 0
                ? 'bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-800'
                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-800'
            }`}
          >
            <p
              className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                unanswered === 0 ? 'text-green-500' : 'text-amber-500'
              }`}
            >
              Bajarildi
            </p>
            <p
              className={`text-xl font-black ${
                unanswered === 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {answeredCount}
            </p>
          </div>
        </div>

        {unanswered > 0 && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/10 rounded-2xl p-4 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-xs font-bold text-red-600 dark:text-red-400 text-left leading-relaxed">
              Diqqat! {unanswered} ta savol javobsiz qolgan. Topshirishga ishonchingiz komilmi?
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer w-full py-4 bg-[var(--accent)] hover:brightness-110 text-white rounded-2xl font-black text-base shadow-xl shadow-[var(--accent)]/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          >
            Ha, topshiraman <CheckCircle2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer w-full py-4 text-[var(--text)] hover:text-[var(--text-h)] font-bold text-sm transition-colors"
          >
            Yo&apos;q, qaytaman
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SubmitConfirmModal;
