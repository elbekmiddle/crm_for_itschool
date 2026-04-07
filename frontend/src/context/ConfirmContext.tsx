import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import ConfirmModal from '../components/ConfirmModal';

interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setOptions(options);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolveCallback(() => resolve);
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (resolveCallback) resolveCallback(false);
  }, [resolveCallback]);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolveCallback) resolveCallback(true);
  }, [resolveCallback]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={options.title || "Ishonchingiz komilmi?"}
        message={options.message || "Ushbu amalni orqaga qaytarib bo'lmaydi."}
        confirmText={options.confirmText}
        type={options.type}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
};
