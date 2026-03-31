import React from 'react';
import ConfirmModal from './ConfirmModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  onConfirm?: () => void;
  confirmText?: string;
}

const AntiCheatWarningModal: React.FC<Props> = ({ 
  isOpen, 
  onClose,
  title = "Qoidabuzarlik Aniqlandi!",
  message = "Boshqa oynaga o'tish taqiqlanadi. Agar bu holat 3 marta takrorlansa, imtihon majburiy yakunlanadi.",
  onConfirm,
  confirmText = "TUSHUNDIM"
}) => {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm || onClose}
      title={title}
      message={message}
      confirmText={confirmText}
      type="warning"
    />
  );
};

export default AntiCheatWarningModal;
