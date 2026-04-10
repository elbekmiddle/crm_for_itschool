import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, AlertTriangle, LogOut } from 'lucide-react';
import { useModalOverlayEffects } from '../hooks/useModalOverlayEffects';

interface Props {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
  onSaveAndLeave?: () => Promise<void> | void;
}

const UnsavedChangesModal: React.FC<Props> = ({ isOpen, onStay, onLeave, onSaveAndLeave }) => {
  const [isSaving, setIsSaving] = useState(false);
  useModalOverlayEffects(isOpen, { onEscape: onStay });

  const handleSaveAndLeave = async () => {
    if (onSaveAndLeave) {
      setIsSaving(true);
      try {
        await onSaveAndLeave();
        setIsSaving(false);
        onLeave();
      } catch (e) {
        setIsSaving(false);
      }
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[10000]"
          />
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[10001] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden p-8 text-center space-y-6 relative pointer-events-auto"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Unsaved changes</h3>
                <p className="text-slate-500 font-medium">You have unsaved changes. Are you sure?</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onStay}
                  className="flex-1 py-4 px-6 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={onLeave}
                  className="flex-1 py-4 px-6 rounded-xl font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Leave
                </button>
                {onSaveAndLeave && (
                  <button
                    type="button"
                    onClick={handleSaveAndLeave}
                    disabled={isSaving}
                    className="flex-[1.5] py-4 px-6 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save & Leave
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default UnsavedChangesModal;
