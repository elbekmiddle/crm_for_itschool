import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useModalOverlayEffects } from '../hooks/useModalOverlayEffects';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
  useModalOverlayEffects(isOpen, { onEscape: onClose });

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[10000]"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[10001] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                'bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl pointer-events-auto overflow-hidden flex flex-col',
                className
              )}
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-red-500 shadow-sm border border-transparent hover:border-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto max-h-[80vh]">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
