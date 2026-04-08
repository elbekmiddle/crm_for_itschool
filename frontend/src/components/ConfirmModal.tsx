import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'TASDIQLASH',
  type = 'danger' 
}) => {
  // ESC key + Body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--bg)]/75 backdrop-blur-md z-[200]"
          />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] w-full max-w-2xl rounded-3xl shadow-[var(--shadow)] pointer-events-auto overflow-hidden px-8 py-8 sm:px-10 sm:py-9 text-center space-y-6 relative"
            >
              {/* X Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-[var(--text)]/70 hover:text-[var(--text-h)] rounded-xl hover:bg-[var(--hover-bg)] transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${
                  type === 'danger' ? 'bg-red-500/10 text-red-400 border-red-500/25' : type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' : 'bg-[var(--accent-bg)] text-[var(--accent)] border-[var(--accent-border)]'
                }`}>
                  <AlertTriangle className="w-8 h-8" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-[var(--text-h)] tracking-tight uppercase px-2">{title}</h3>
                <p className="text-[var(--text)] font-semibold leading-relaxed text-sm sm:text-base px-2">{message}</p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                <Button variant="secondary" onClick={onClose} className="flex-1 !py-2.5 !px-5 !rounded-2xl text-xs sm:text-sm !shadow-none">
                  BEKOR QILISH
                </Button>
                <Button 
                  variant={type === 'danger' ? 'danger' : 'primary'} 
                  onClick={onConfirm} 
                  className="flex-1 !py-2.5 !px-5 !rounded-2xl text-xs sm:text-sm !shadow-none"
                >
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
