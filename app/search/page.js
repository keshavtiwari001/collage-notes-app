'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import Spinner from '@/components/ui/Spinner';
import { debounce } from '@/lib/utils';
import { Search, BookOpen, Layers, FileText, ChevronRight, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';

function ResultRow({ href, color, icon: Icon, title, crumbs }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group hover:bg-[var(--bg-hover)]"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color || 'var(--brand-500)'}20` }}
      >
        <Icon size={15} style={{ color: color || 'var(--brand-500)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-xs flex items-center gap-1 truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={10} />}
              <span>{c}</span>
            </span>
          ))}
        </p>
      </div>
      <ChevronRight size={14} className="shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: 'var(--text-muted)' }} />
    </Link>
  );
}

function ResultGroup({ label, icon: Icon, children, count }) {
  if (!count) return null;
  return (
    <div>
      <div className="flex items-center gap-2 px-1 mb-1">
        <Icon size={13} style={{ color: 'var(--text-muted)' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}
        >
          {count}
        </span>
      </div>
      <div
        className="rounded-xl border divide-y overflow-hidden mb-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
      >
        {children}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(
    debounce(async (q) => {
      if (q.length < 2) { setResults(null); setLoading(false); return; }
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 400),
    []
  );

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length >= 2) setLoading(true);
    else { setLoading(false); setResults(null); }
    doSearch(val);
  };

  const totalResults = results
    ? (results.subjects?.length || 0) + (results.chapters?.length || 0) + (results.parts?.length || 0)
    : 0;

  return (
    <AppShell breadcrumbs={[{ label: 'Search' }]}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Search</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Find subjects, chapters, and parts across all your notes.
          </p>
        </div>

        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-6 transition-all"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search your notes…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
          {loading && <Spinner size={16} />}
          {query && !loading && (
            <button
              onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }}
              className="text-xs px-2 py-1 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* States */}
        {!query && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-hover)' }}>
              <Search size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Start typing to search</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Search across subjects, chapters, and parts.</p>
          </div>
        )}

        {query.length === 1 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
            Type at least 2 characters to search…
          </p>
        )}

        {results && !loading && totalResults === 0 && query.length >= 2 && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-hover)' }}>
              <SlidersHorizontal size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No results for "{query}"</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Try a different search term.</p>
          </div>
        )}

        {/* Results */}
        {results && totalResults > 0 && (
          <div>
            <ResultGroup label="Subjects" icon={BookOpen} count={results.subjects?.length}>
              {results.subjects?.map(s => (
                <ResultRow
                  key={s._id}
                  href={`/periods/${s.periodId}/subjects/${s._id}`}
                  color={s.color}
                  icon={BookOpen}
                  title={s.name}
                  crumbs={[s.periodName || 'Unknown period']}
                />
              ))}
            </ResultGroup>

            <ResultGroup label="Chapters" icon={Layers} count={results.chapters?.length}>
              {results.chapters?.map(c => (
                <ResultRow
                  key={c._id}
                  href={`/periods/${c.periodId}/subjects/${c.subjectId}/chapters/${c._id}`}
                  color={c.subjectColor}
                  icon={Layers}
                  title={c.title}
                  crumbs={[c.periodName, c.subjectName].filter(Boolean)}
                />
              ))}
            </ResultGroup>

            <ResultGroup label="Parts" icon={FileText} count={results.parts?.length}>
              {results.parts?.map(p => (
                <ResultRow
                  key={p._id}
                  href={`/periods/${p.periodId}/subjects/${p.subjectId}/chapters/${p.chapterId}`}
                  color={p.subjectColor}
                  icon={FileText}
                  title={p.title}
                  crumbs={[p.periodName, p.subjectName, p.chapterTitle].filter(Boolean)}
                />
              ))}
            </ResultGroup>
          </div>
        )}
      </div>
    </AppShell>
  );
}
