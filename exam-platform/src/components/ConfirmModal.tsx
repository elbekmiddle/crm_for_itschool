import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Tasdiqlang",
  message = "Rostdan ham bu amalni bajarasizmi?",
  confirmText = "Tasdiqlash",
  cancelText = "Bekor qilish",
  variant = 'danger'
}) => {
  // Handle ESC key and Body Scroll Lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 text-white shadow-red-200';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200';
      default: return 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-200';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'danger': return 'text-red-500 bg-red-100';
      case 'warning': return 'text-amber-500 bg-amber-100';
      default: return 'text-primary-500 bg-primary-100';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm motion-opacity-in-0 motion-duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 md:p-8 motion-scale-in-[0.5] motion-opacity-in-0 motion-spring-bounce-50 motion-duration-500 z-10 flex flex-col items-center text-center">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-inner ${getIconColor()}`}>
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Text */}
        <h3 className="text-2xl font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex flex-row items-center justify-center gap-4 w-full">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-3.5 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-6 py-3.5 rounded-2xl font-bold shadow-xl transition-all active:scale-[0.98] ${getVariantStyles()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
