'use client';
import { Menu, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function Header({ onMenuOpen, breadcrumbs = [] }) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6"
      style={{
        height: 'var(--header-h)',
        backgroundColor: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border-default)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuOpen}
        className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors shrink-0"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
              {crumb.href && i < breadcrumbs.length - 1 ? (
                <Link
                  href={crumb.href}
                  className="text-sm hover:text-[var(--text-primary)] truncate max-w-[120px] sm:max-w-[180px] transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: i === breadcrumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}
                >
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
    </header>
  );
}
