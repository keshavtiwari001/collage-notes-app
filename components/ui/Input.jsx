'use client';

export default function Input({
  label,
  error,
  helper,
  className = '',
  multiline = false,
  rows = 3,
  ...props
}) {
  const baseClass = `
    w-full rounded-lg border px-3 py-2.5 text-sm outline-none
    transition-all duration-150 placeholder:text-[var(--text-muted)]
    focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-opacity-20
    focus:border-[var(--border-focus)]
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? 'border-red-400' : 'border-[var(--border-default)]'}
    ${className}
  `;

  const style = {
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      {multiline ? (
        <textarea rows={rows} className={baseClass} style={style} {...props} />
      ) : (
        <input className={baseClass} style={style} {...props} />
      )}
      {error  && <p className="text-xs text-red-500">{error}</p>}
      {helper && !error && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{helper}</p>}
    </div>
  );
}
