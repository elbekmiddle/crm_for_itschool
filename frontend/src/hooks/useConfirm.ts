import { useState, useCallback, useEffect } from 'react';

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
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;

      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);

    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
};
