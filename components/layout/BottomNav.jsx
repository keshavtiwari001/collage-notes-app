'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, GraduationCap, Search } from 'lucide-react';

const items = [
  { href: '/',        icon: LayoutDashboard, label: 'Home'     },
  { href: '/periods', icon: GraduationCap,   label: 'Periods'  },
  { href: '/search',  icon: Search,           label: 'Search'   },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center border-t"
      style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderColor: 'var(--border-default)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {items.map(({ href, icon: Icon, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors"
            style={{ color: active ? 'var(--brand-500)' : 'var(--text-muted)' }}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
            {active && (
              <span
                className="absolute top-0 w-8 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--brand-500)' }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
