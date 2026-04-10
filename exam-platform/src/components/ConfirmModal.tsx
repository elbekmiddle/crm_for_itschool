import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import { useModalOverlayEffects } from '../hooks/useModalOverlayEffects';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  children?: React.ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Tasdiqlang',
  message = "Rostdan ham bu amalni bajarasizmi?",
  confirmText = 'Tasdiqlash',
  cancelText = 'Bekor qilish',
  variant = 'danger',
  children,
}) => {
  useModalOverlayEffects(isOpen, { onEscape: onClose });

  if (!isOpen) return null;

  const variantStyles = {
    danger: { btn: 'bg-red-600 hover:bg-red-700 shadow-red-200', icon: 'text-red-500 bg-red-100' },
    warning: { btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200', icon: 'text-amber-500 bg-amber-100' },
    info: { btn: 'bg-primary-600 hover:bg-primary-700 shadow-primary-200', icon: 'text-primary-500 bg-primary-100' },
  }[variant];

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md animate-in" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in-scale z-10 flex flex-col items-center text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${variantStyles.icon}`}>
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 font-medium mb-6 leading-relaxed">{message}</p>
        {children && <div className="w-full mb-6">{children}</div>}
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3.5 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-6 py-3.5 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-[0.97] ${variantStyles.btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
