import React from 'react';
import { Flag } from 'lucide-react';
import { cn } from '../lib/utils';

interface FlagButtonProps {
  isFlagged: boolean;
  onToggle: () => void;
}

const FlagButton: React.FC<FlagButtonProps> = ({ isFlagged, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "p-3 rounded-xl border-2 transition-all shrink-0",
        isFlagged
          ? "bg-amber-50 border-amber-300 text-amber-600 shadow-sm shadow-amber-100"
          : "bg-white border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-500"
      )}
      title={isFlagged ? "Belgini olib tashlash" : "Savolni belgilash"}
    >
      <Flag className="w-5 h-5" />
    </button>
  );
};

export default FlagButton;
