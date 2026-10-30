'use client';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:   'bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white shadow-sm',
  secondary: 'bg-[var(--bg-hover)] hover:bg-[var(--border-default)] text-[var(--text-primary)] border border-[var(--border-default)]',
  ghost:     'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  danger:    'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  outline:   'border border-[var(--border-default)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]',
};

const sizes = {
  sm:   'px-3 py-1.5 text-xs gap-1.5',
  md:   'px-4 py-2   text-sm gap-2',
  lg:   'px-5 py-2.5 text-sm gap-2',
  icon: 'p-2',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-150 ease-out cursor-pointer select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline-2 focus-visible:outline-offset-2
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}
