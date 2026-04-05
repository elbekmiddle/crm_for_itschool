import React from 'react';
import ConfirmModal from './ConfirmModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const SubmitConfirmModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Imtihonni Yakunlash"
      message="Imtihonni yakunlab, natijalarni saqlashni xohlaysizmi? Bu amalni orqaga qaytarib bo'lmaydi."
      confirmText="YAKUNLASH"
      type="warning"
    />
  );
};

export default SubmitConfirmModal;
