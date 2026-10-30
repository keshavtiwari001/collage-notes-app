import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Academica' };

export default function AuthLayout({ children }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--bg-app)' }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 group">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
          style={{ backgroundColor: 'var(--brand-500)' }}
        >
          <BookOpen size={18} className="text-white" />
        </div>
        <span
          className="font-bold text-xl tracking-tight"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
        >
          Academica
        </span>
      </Link>

      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl border shadow-md animate-fade-in"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor:     'var(--border-default)',
        }}
      >
        {children}
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
        Your personal academic knowledge base.
      </p>
    </div>
  );
}
