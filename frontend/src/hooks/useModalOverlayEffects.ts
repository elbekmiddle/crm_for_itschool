import { useEffect, useRef } from 'react';

type Options = {
  /** Default: true */
  lockBody?: boolean;
  /** Called on Escape (use for “can’t close while saving” by no-op inside). */
  onEscape?: () => void;
};

/**
 * Modal overlay: body scroll lock + optional Escape to close.
 * onEscape is kept in a ref so the listener stays stable.
 */
export function useModalOverlayEffects(open: boolean, options?: Options) {
  const lockBody = options?.lockBody !== false;
  const onEscape = options?.onEscape;
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!open) return;
    let prevOverflow = '';
    if (lockBody) {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const fn = onEscapeRef.current;
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      if (lockBody) document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, lockBody]);
}
