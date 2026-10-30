import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 20, className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 size={size} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
    </div>
  );
}
