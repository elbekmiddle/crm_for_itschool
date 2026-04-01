import React from 'react';
import { useToastStore } from '../../store/useToastStore';
import { X, CheckCircle, AlertCircle, Info, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ToastContainer = () => {
  const { toasts, removeToast, confirmState, hideConfirm } = useToastStore();

  return (
    <>
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-top-2",
              t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            )}
          >
            {t.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {t.type === 'info' && <Info className="w-5 h-5" />}
            <span className="text-sm font-semibold">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="ml-4 opacity-50 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in" onClick={hideConfirm}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">{confirmState.title}</h3>
              <p className="text-slate-500 text-sm mb-6">{confirmState.message}</p>
              
              <div className="flex w-full gap-3">
                <button onClick={hideConfirm} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                  Yo'q, bekor qilish
                </button>
                <button onClick={() => { confirmState.onConfirm?.(); hideConfirm(); }} className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors">
                  Ha, tasdiqlayman
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
