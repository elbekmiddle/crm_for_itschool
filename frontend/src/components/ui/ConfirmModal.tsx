import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Tasdiqlash',
  cancelLabel = 'Bekor qilish',
  onConfirm,
  onCancel,
  variant = 'info'
}) => {
  if (!isOpen) return null;

  const btnColors = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-amber-500 hover:bg-amber-600',
    info: 'bg-indigo-600 hover:bg-indigo-700'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl"
        >
          <div className="p-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              {title}
            </h3>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {message}
            </p>
          </div>

          <div className="flex gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-all active:scale-95 shadow-md ${btnColors[variant]}`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
