export default function Card({ children, className = '', hover = false, onClick, padding = true }) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl border transition-all duration-150
        ${padding ? 'p-5' : ''}
        ${hover ? 'hover:shadow-card-md cursor-pointer hover:-translate-y-0.5' : ''}
        ${className}
      `}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {children}
    </div>
  );
}
