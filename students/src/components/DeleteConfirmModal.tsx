import React from 'react';
import ConfirmModal from './ConfirmModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const DeleteConfirmModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title = "Ma'lumotni o'chirish",
  message = "Haqiqatan ham o'chirmoqchimisiz? Bu amalni orqaga qaytarib bo'lmaydi."
}) => {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={message}
      confirmText="O'CHIRISH"
      type="danger"
    />
  );
};

export default DeleteConfirmModal;
