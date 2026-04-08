import React from 'react';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className, 
  disabled, 
  ...props 
}) => {
  const baseStyles =
    "flex items-center justify-center gap-2 px-8 py-4 rounded-3xl font-black transition-[background-color,color,transform,opacity] duration-200 ease-out active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none uppercase tracking-widest text-sm shadow-none";
  
  const variants = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white",
    secondary: "bg-[var(--bg-muted)] border-2 border-[var(--border)] text-[var(--text-h)] hover:bg-[var(--hover-bg)]",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    ghost: "bg-transparent hover:bg-[var(--hover-bg)] text-[var(--text)] border border-[var(--border)]"
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], className)}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
  );
};

export default Button;
