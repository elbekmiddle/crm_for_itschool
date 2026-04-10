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
        "cursor-pointer p-3 rounded-xl border-2 transition-all shrink-0",
        isFlagged
          ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-sm"
          : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] hover:border-amber-500/50 hover:text-amber-600"
      )}
      title={isFlagged ? "Belgini olib tashlash" : "Savolni belgilash"}
    >
      <Flag className="w-5 h-5" />
    </button>
  );
};

export default FlagButton;
