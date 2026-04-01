import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    if (options?.onCancel) options.onCancel();
  }, [options]);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (options?.onConfirm) options.onConfirm();
  }, [options]);

  return {
    isOpen,
    confirm,
    close,
    handleConfirm,
    options
  };
};

/**
 * Hook to prevent accidental tab/refresh/close when there's unsaved state
 */
export const useConfirmLeave = (isDirty: boolean) => {
  const [showConfirm, setShowConfirm] = useState(false);

  // Browser level (beforeunload)
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = ''; // Standard way to trigger browser warning
    }
  }, [isDirty]);

  return { showConfirm, setShowConfirm, handleBeforeUnload };
};
