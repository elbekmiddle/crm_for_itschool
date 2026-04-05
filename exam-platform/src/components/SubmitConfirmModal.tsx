import React from 'react';
import { AlertCircle, Send, CheckCircle2, X } from 'lucide-react';

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
  if (!isOpen) return null;

  const unanswered = totalCount - answeredCount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 z-10 text-center border border-slate-100 dark:border-slate-800">
        <button onClick={onCancel} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/40 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Send className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        </div>

        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Imtihonni topshirasizmi?</h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Natijalaringizni tekshirish uchun topshiring.</p>
        
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-left border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jami</p>
            <p className="text-xl font-black text-slate-800 dark:text-white">{totalCount}</p>
          </div>
          <div className={`rounded-2xl p-4 text-left border ${unanswered === 0 ? 'bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-800'}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${unanswered === 0 ? 'text-green-500' : 'text-amber-500'}`}>
              Bajarildi
            </p>
            <p className={`text-xl font-black ${unanswered === 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
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
            onClick={onConfirm} 
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-base shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          >
            Ha, topshiraman <CheckCircle2 className="w-5 h-5" />
          </button>
          <button 
            onClick={onCancel} 
            className="w-full py-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-sm transition-colors"
          >
            Yo'q, qaytaman
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitConfirmModal;
