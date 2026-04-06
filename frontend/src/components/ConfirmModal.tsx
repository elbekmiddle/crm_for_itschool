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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200]"
          />
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[201] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl pointer-events-auto overflow-hidden p-10 text-center space-y-8 relative"
            >
              {/* X Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-center">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${
                  type === 'danger' ? 'bg-red-50 text-red-500' : type === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-primary-50 text-primary-500'
                }`}>
                  <AlertTriangle className="w-10 h-10" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{title}</h3>
                <p className="text-slate-500 font-bold leading-relaxed">{message}</p>
              </div>

              <div className="flex gap-4">
                <Button variant="secondary" onClick={onClose} className="flex-1 py-5">
                  BEKOR QILISH
                </Button>
                <Button 
                  variant={type === 'danger' ? 'danger' : 'primary'} 
                  onClick={onConfirm} 
                  className="flex-1 py-5"
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
