'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen, GraduationCap, LayoutDashboard, Search,
  Sun, Moon, Scroll, X, ChevronRight, PanelLeftClose, PanelLeftOpen,
  LogOut,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth }  from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/',        icon: LayoutDashboard, label: 'Dashboard'        },
  { href: '/periods', icon: GraduationCap,   label: 'Semesters / Years' },
  { href: '/search',  icon: Search,           label: 'Search'            },
];

const themeOptions = [
  { key: 'light', icon: Sun,    label: 'Light'  },
  { key: 'dark',  icon: Moon,   label: 'Dark'   },
  { key: 'paper', icon: Scroll, label: 'Paper'  },
];

export default function Sidebar({ open, onClose, onCollapseChange }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { theme, changeTheme } = useTheme();
  const { user }  = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('academica-sidebar-collapsed') === 'true';
    setCollapsed(saved);
    setMounted(true);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('academica-sidebar-collapsed', String(next));
    onCollapseChange?.(next);
  };

  // Close mobile sidebar on route change
  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null;

  const w = collapsed ? '56px' : '260px';

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'var(--bg-overlay)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full flex flex-col
          transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto shrink-0
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          width: w,
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-default)',
          overflow: 'hidden',
        }}
      >
        {/* Logo row */}
        <div
          className="flex items-center justify-between px-3 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--border-default)', minHeight: 'var(--header-h)' }}
        >
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2.5 min-w-0" onClick={onClose}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--brand-500)' }}>
                <BookOpen size={16} className="text-white" />
              </div>
              <span className="font-bold text-base tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                Academica
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/" className="mx-auto" onClick={onClose}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--brand-500)' }}>
                <BookOpen size={16} className="text-white" />
              </div>
            </Link>
          )}

          {/* Mobile close / desktop collapse */}
          <button
            onClick={collapsed ? toggleCollapse : undefined}
            className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors shrink-0"
            style={{ color: 'var(--text-muted)' }}
            title="Close menu"
            {...(!collapsed && { onClick: onClose })}
          >
            <X size={16} />
          </button>
          {!collapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors shrink-0"
              style={{ color: 'var(--text-muted)' }}
              title="Collapse sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {/* Collapsed expand button */}
        {collapsed && (
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex mx-auto mt-2 p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Expand sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                title={collapsed ? label : undefined}
                className={`
                  flex items-center gap-3 rounded-lg text-sm font-medium
                  transition-all duration-150 group
                  ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                  ${active
                    ? 'text-[var(--brand-500)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
                `}
                style={{ backgroundColor: active ? 'var(--bg-active)' : undefined }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = ''; }}
              >
                <Icon size={17} className="shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight size={14} className="opacity-50" />}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Theme switcher */}
        {!collapsed && (
          <div className="px-3 py-4 border-t shrink-0" style={{ borderColor: 'var(--border-default)' }}>
            <p className="text-xs font-medium mb-2 px-1" style={{ color: 'var(--text-muted)' }}>THEME</p>
            <div className="flex gap-1">
              {themeOptions.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => changeTheme(key)}
                  title={label}
                  className={`
                    flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs font-medium
                    transition-all duration-150
                    ${theme === key
                      ? 'text-[var(--brand-500)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}
                  `}
                  style={{ backgroundColor: theme === key ? 'var(--brand-50)' : undefined }}
                  onMouseEnter={e => { if (theme !== key) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (theme !== key) e.currentTarget.style.backgroundColor = ''; }}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Collapsed theme dots */}
        {collapsed && (
          <div className="flex flex-col items-center gap-1.5 py-4 border-t shrink-0" style={{ borderColor: 'var(--border-default)' }}>
            {themeOptions.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => changeTheme(key)}
                title={label}
                className="p-1.5 rounded-lg transition-colors"
                style={{
                  color: theme === key ? 'var(--brand-500)' : 'var(--text-muted)',
                  backgroundColor: theme === key ? 'var(--brand-50)' : undefined,
                }}
                onMouseEnter={e => { if (theme !== key) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (theme !== key) e.currentTarget.style.backgroundColor = ''; }}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        )}

        {/* User info */}
        {user && !collapsed && (
          <div
            className="mx-3 mb-2 px-3 py-2.5 rounded-xl flex items-center gap-2.5"
            style={{ backgroundColor: 'var(--bg-hover)' }}
          >
            {/* Initials avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
              style={{ backgroundColor: 'var(--brand-500)' }}
            >
              {user.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {user.name}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {user.email}
              </p>
            </div>
          </div>
        )}
        {/* User info — collapsed: just avatar */}
        {user && collapsed && (
          <div className="flex justify-center mb-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: 'var(--brand-500)' }}
              title={user.name}
            >
              {user.name?.charAt(0).toUpperCase() || '?'}
            </div>
          </div>
        )}
        {/* Sign out */}
        <div className="px-3 pb-3 shrink-0">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
            className={`
              flex items-center gap-3 w-full rounded-lg text-sm font-medium
              transition-all duration-150 disabled:opacity-50
              ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
            `}
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
