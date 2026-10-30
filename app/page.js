'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { BookOpen, GraduationCap, FileText, HelpCircle, ArrowRight, Sparkles, Clock, Layers } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { clientFetch } from '@/lib/clientFetch';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientFetch('/api/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statCards = [
    { icon: GraduationCap, label: 'Periods',   value: stats?.periods  ?? '—', href: '/periods', color: '#3b6ef6' },
    { icon: BookOpen,       label: 'Subjects',  value: stats?.subjects ?? '—', href: '/periods', color: '#14b8a6' },
    { icon: FileText,       label: 'Chapters',  value: stats?.chapters ?? '—', href: '/periods', color: '#8b5cf6' },
    { icon: HelpCircle,     label: 'Q&A Cards', value: stats?.qaItems  ?? '—', href: '/periods', color: '#f59e0b' },
  ];

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard' }]}>
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} style={{ color: 'var(--brand-500)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-500)' }}>
            Study Dashboard
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          {user
            ? `Welcome back, ${user.name.split(' ')[0]}.`
            : authLoading ? 'Welcome to Academica' : 'Welcome to Academica'
          }
        </h1>
        <p className="text-base max-w-xl" style={{ color: 'var(--text-secondary)' }}>
          Your personal academic knowledge base. Organize notes by semester, subject, and chapter.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ icon: Icon, label, value, href, color }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border p-4 flex flex-col gap-3 hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 group"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {loading ? <span className="inline-block w-6 h-6 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-hover)' }} /> : value}
              </div>
              <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent chapters */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} style={{ color: 'var(--text-muted)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recently updated</h2>
          </div>

          <div
            className="rounded-xl border divide-y overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)', '--tw-divide-opacity': 1 }}
          >
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-hover)' }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 rounded animate-pulse w-2/3" style={{ backgroundColor: 'var(--bg-hover)' }} />
                    <div className="h-2.5 rounded animate-pulse w-1/3" style={{ backgroundColor: 'var(--bg-hover)' }} />
                  </div>
                </div>
              ))
            ) : !stats?.recent?.length ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                No chapters yet — start writing your notes.
              </div>
            ) : (
              stats.recent.map(chapter => (
                <Link
                  key={chapter._id}
                  href={`/periods/${chapter.periodId}/subjects/${chapter.subjectId}/chapters/${chapter._id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${chapter.subjectColor || 'var(--brand-500)'}20` }}
                  >
                    <Layers size={15} style={{ color: chapter.subjectColor || 'var(--brand-500)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {chapter.title}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {chapter.subjectName} · {chapter.periodName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(chapter.updatedAt)}
                    </span>
                    <ArrowRight size={13} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Getting started / Continue writing */}
        <div className="lg:col-span-2">
          {stats?.recent?.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={15} style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Continue writing</h2>
              </div>
              <div
                className="rounded-xl border divide-y overflow-hidden"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
              >
                {stats.recent.slice(0, 3).map(chapter => (
                  <Link
                    key={chapter._id}
                    href={`/periods/${chapter.periodId}/subjects/${chapter.subjectId}/chapters/${chapter._id}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--bg-hover)] transition-colors group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${chapter.subjectColor || 'var(--brand-500)'}20` }}
                    >
                      <Layers size={15} style={{ color: chapter.subjectColor || 'var(--brand-500)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{chapter.title}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{chapter.subjectName}</p>
                    </div>
                    <ArrowRight size={13} className="shrink-0 opacity-0 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all" style={{ color: 'var(--text-muted)' }} />
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={15} style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Get started</h2>
              </div>
              <div
                className="rounded-xl border p-5 flex flex-col gap-3"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
              >
                {[
                  { step: '01', title: 'Create a semester', desc: 'Add a semester or academic year.', href: '/periods' },
                  { step: '02', title: 'Add subjects',       desc: 'Add the subjects you are studying.',  href: '/periods' },
                  { step: '03', title: 'Write your notes',   desc: 'Create chapters, parts, and notes.',  href: '/periods' },
                ].map(({ step, title, desc, href }) => (
                  <Link
                    key={step}
                    href={href}
                    className="flex items-start gap-3 p-3 rounded-lg border transition-all duration-150 hover:border-[var(--border-focus)] group"
                    style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-hover)' }}
                  >
                    <span className="text-xs font-bold tabular-nums mt-0.5" style={{ color: 'var(--brand-500)' }}>{step}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                    </div>
                    <ArrowRight size={13} className="shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" style={{ color: 'var(--brand-500)' }} />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
