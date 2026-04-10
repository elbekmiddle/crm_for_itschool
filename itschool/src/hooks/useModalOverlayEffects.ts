import { useEffect, useRef } from 'react';

type Options = {
  lockBody?: boolean;
  onEscape?: () => void;
};

let bodyLockCount = 0;
let savedScrollY = 0;

export function useModalOverlayEffects(open: boolean, options?: Options) {
  const lockBody = options?.lockBody !== false;
  const onEscape = options?.onEscape;
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!open) return;

    if (lockBody) {
      bodyLockCount += 1;
      if (bodyLockCount === 1) {
        savedScrollY = window.scrollY;
        const b = document.body;
        b.style.position = 'fixed';
        b.style.top = `-${savedScrollY}px`;
        b.style.left = '0';
        b.style.right = '0';
        b.style.width = '100%';
        b.style.overflow = 'hidden';
        b.style.overscrollBehavior = 'none';
      }
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
      document.removeEventListener('keydown', onKey, true);
      if (lockBody) {
        bodyLockCount -= 1;
        if (bodyLockCount === 0) {
          const b = document.body;
          b.style.position = '';
          b.style.top = '';
          b.style.left = '';
          b.style.right = '';
          b.style.width = '';
          b.style.overflow = '';
          b.style.overscrollBehavior = '';
          window.scrollTo(0, savedScrollY);
        }
      }
    };
  }, [open, lockBody]);
}
