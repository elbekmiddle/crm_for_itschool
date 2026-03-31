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
  const baseStyles = "flex items-center justify-center gap-2 px-8 py-4 rounded-3xl font-black transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none uppercase tracking-widest text-sm shadow-xl";
  
  const variants = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white shadow-primary-200",
    secondary: "bg-white border-2 border-slate-100 text-slate-500 hover:bg-slate-50 shadow-slate-100",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-red-100",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-400 shadow-none border border-transparent"
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
