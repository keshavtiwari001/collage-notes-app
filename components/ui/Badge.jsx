const variants = {
  default: 'bg-[var(--bg-hover)] text-[var(--text-secondary)]',
  primary: 'bg-[var(--brand-50)] text-[var(--brand-600)]',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  danger:  'bg-red-50 text-red-700',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
