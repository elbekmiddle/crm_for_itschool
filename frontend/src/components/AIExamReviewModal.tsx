import React from 'react';
import ConfirmModal from './ConfirmModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  examTitle?: string;
}

const AIExamReviewModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, examTitle = "" }) => {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="AI Imtihon Tayyor"
      message={`"${examTitle}" imtihoni sun'iy intellekt tomonidan yaratildi. Uni tasdiqlash uchun ko'rib chiqing.`}
      confirmText="KO'RIB CHIQISH"
      type="info"
    />
  );
};

export default AIExamReviewModal;
