import React from 'react';
import ConfirmModal from './ConfirmModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Tizimdan chiqish"
      message="Haqiqatan ham tizimdan chiqmoqchimisiz?"
      confirmText="CHIQISH"
      type="danger"
    />
  );
};

export default LogoutConfirmModal;
