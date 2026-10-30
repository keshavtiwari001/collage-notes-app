'use client';
import { use, useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Spinner from '@/components/ui/Spinner';
import { PeriodCardSkeleton } from '@/components/ui/Skeleton';
import SubjectForm from '@/components/subjects/SubjectForm';
import { useToast } from '@/context/ToastContext';
import { clientFetch } from '@/lib/clientFetch';
import { BookOpen, Plus, MoreVertical, Pencil, Trash2, ArrowRight, Layers } from 'lucide-react';
import Link from 'next/link';

export default function PeriodDetailPage({ params }) {
  const { periodId } = use(params);
  const { toast } = useToast();

  const [period,   setPeriod]   = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        clientFetch(`/api/periods/${periodId}`),
        clientFetch(`/api/subjects?periodId=${periodId}`),
      ]);
      if (pRes.status === 404) { setNotFound(true); setLoading(false); return; }
      const [pData, sData] = await Promise.all([pRes.json(), sRes.json()]);
      setPeriod(pData);
      setSubjects(Array.isArray(sData) ? sData : []);
    } catch {
      toast({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  }, [periodId, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  const handleCreate = async (data) => {
    const res = await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, periodId }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const created = await res.json();
    setSubjects(prev => [...prev, created]);
    toast({ type: 'success', message: `"${created.name}" created` });
  };

  const handleEdit = async (data) => {
    const res = await fetch(`/api/subjects/${editing._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const updated = await res.json();
    setSubjects(prev => prev.map(s => s._id === updated._id
      ? { ...updated, chapterCount: s.chapterCount }
      : s
    ));
    toast({ type: 'success', message: `"${updated.name}" updated` });
    setEditing(null);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/subjects/${deleting._id}`, { method: 'DELETE' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setSubjects(prev => prev.filter(s => s._id !== deleting._id));
      toast({ type: 'success', message: `"${deleting.name}" deleted` });
      setDeleting(null);
    } catch (e) {
      toast({ type: 'error', message: e.message || 'Delete failed' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const breadcrumbs = [
    { label: 'Semesters & Years', href: '/periods' },
    { label: period?.name || '…' },
  ];

  return (
    <AppShell breadcrumbs={breadcrumbs}>
      {loading ? (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-hover)' }} />
            <div className="space-y-2">
              <div className="h-5 w-40 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-hover)' }} />
              <div className="h-3 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-hover)' }} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <PeriodCardSkeleton key={i} />)}
          </div>
        </div>
      ) : notFound ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-hover)' }}>
            <BookOpen size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Period not found</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>This period may have been deleted.</p>
          <Button variant="secondary" onClick={() => window.history.back()}>Go back</Button>
        </div>
      ) : (
        <>
          {/* Page header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--brand-50)' }}
              >
                <BookOpen size={20} style={{ color: 'var(--brand-500)' }} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {period?.name}
                </h1>
                <p className="text-sm capitalize" style={{ color: 'var(--text-muted)' }}>
                  {period?.type} · {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button onClick={() => setFormOpen(true)} size="md" className="shrink-0">
              <Plus size={16} /> New subject
            </Button>
          </div>

          {/* Subjects grid */}
          {subjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No subjects yet"
              description="Add subjects you're studying this period."
              action={
                <Button onClick={() => setFormOpen(true)}>
                  <Plus size={15} /> Add first subject
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map(subject => (
                <div key={subject._id} className="relative group">
                  <Link href={`/periods/${periodId}/subjects/${subject._id}`} className="block">
                    <Card hover padding={false} className="p-5">
                      {/* Top row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                            style={{ backgroundColor: subject.color }}
                          />
                          <h2 className="font-semibold text-base leading-snug truncate"
                            style={{ color: 'var(--text-primary)' }}>
                            {subject.name}
                          </h2>
                        </div>
                        <button
                          onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(menuOpen === subject._id ? null : subject._id); }}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--bg-hover)] shrink-0 ml-2"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <MoreVertical size={15} />
                        </button>
                      </div>

                      {/* Description */}
                      {subject.description && (
                        <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                          {subject.description}
                        </p>
                      )}

                      {/* Footer */}
                      <div
                        className="flex items-center gap-2 pt-3 border-t"
                        style={{ borderColor: 'var(--border-default)' }}
                      >
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <Layers size={12} />
                          {subject.chapterCount} chapter{subject.chapterCount !== 1 ? 's' : ''}
                        </span>
                        <ArrowRight
                          size={13}
                          className="ml-auto opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all"
                          style={{ color: 'var(--text-muted)' }}
                        />
                      </div>
                    </Card>
                  </Link>

                  {/* Dropdown menu */}
                  {menuOpen === subject._id && (
                    <div
                      className="absolute top-12 right-3 z-20 w-36 rounded-xl shadow-lg border py-1 animate-scale-in"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => { setEditing(subject); setMenuOpen(null); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--bg-hover)] transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        onClick={() => { setDeleting(subject); setMenuOpen(null); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--bg-hover)] transition-colors text-red-500"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <SubjectForm open={formOpen}  onClose={() => setFormOpen(false)} onSave={handleCreate} />
      <SubjectForm open={!!editing} onClose={() => setEditing(null)}   onSave={handleEdit}   initial={editing} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete subject?"
        message={`"${deleting?.name}" and all its chapters, notes, and Q&A will be permanently deleted.`}
        confirmLabel="Delete subject"
      />
    </AppShell>
  );
}
