export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="mb-4 p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-hover)' }}>
          <Icon size={28} style={{ color: 'var(--text-muted)' }} />
        </div>
      )}
      <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {description && (
        <p className="text-sm max-w-xs mb-5" style={{ color: 'var(--text-muted)' }}>{description}</p>
      )}
      {action}
    </div>
  );
}
