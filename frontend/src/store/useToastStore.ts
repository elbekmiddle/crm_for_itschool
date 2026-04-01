import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Confirm Modal
  confirmState: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  };
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  hideConfirm: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  confirmState: { isOpen: false, title: '', message: '', onConfirm: null },
  showConfirm: (title, message, onConfirm) => set({ confirmState: { isOpen: true, title, message, onConfirm } }),
  hideConfirm: () => set({ confirmState: { isOpen: false, title: '', message: '', onConfirm: null } }),
}));

export const toast = {
  success: (m: string) => useToastStore.getState().addToast(m, 'success'),
  error: (m: string) => useToastStore.getState().addToast(m, 'error'),
  info: (m: string) => useToastStore.getState().addToast(m, 'info'),
  confirm: (title: string, message: string, onConfirm: () => void) => useToastStore.getState().showConfirm(title, message, onConfirm),
};
