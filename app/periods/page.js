'use client';
import { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Spinner from '@/components/ui/Spinner';
import { PeriodCardSkeleton } from '@/components/ui/Skeleton';
import PeriodForm from '@/components/periods/PeriodForm';
import { useToast } from '@/context/ToastContext';
import { clientFetch } from '@/lib/clientFetch';
import {
  GraduationCap, Plus, Calendar, BookOpen,
  MoreVertical, Pencil, Trash2, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

const TYPE_LABEL = { semester: 'Semester', year: 'Year' };
const TYPE_ICON  = { semester: GraduationCap, year: Calendar };

export default function PeriodsPage() {
  const { toast } = useToast();
  const [periods, setPeriods]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [formOpen, setFormOpen]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [deleting, setDeleting]     = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(null);

  const fetchPeriods = useCallback(async () => {
    try {
      const res = await clientFetch('/api/periods');
      const data = await res.json();
      setPeriods(data);
    } catch {
      toast({ type: 'error', message: 'Failed to load periods' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchPeriods(); }, [fetchPeriods]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  const handleCreate = async (data) => {
    const res = await fetch('/api/periods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const created = await res.json();
    setPeriods(prev => [...prev, { ...created, subjectCount: 0 }]);
    toast({ type: 'success', message: `"${created.name}" created` });
  };

  const handleEdit = async (data) => {
    const res = await fetch(`/api/periods/${editing._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const updated = await res.json();
    setPeriods(prev => prev.map(p => p._id === updated._id ? { ...updated, subjectCount: p.subjectCount } : p));
    toast({ type: 'success', message: `"${updated.name}" updated` });
    setEditing(null);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/periods/${deleting._id}`, { method: 'DELETE' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setPeriods(prev => prev.filter(p => p._id !== deleting._id));
      toast({ type: 'success', message: `"${deleting.name}" deleted` });
      setDeleting(null);
    } catch (e) {
      toast({ type: 'error', message: e.message || 'Delete failed' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const breadcrumbs = [{ label: 'Semesters & Years' }];

  return (
    <AppShell breadcrumbs={breadcrumbs}>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Semesters &amp; Years
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Organize your studies by academic period
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} size="md" className="shrink-0">
          <Plus size={16} /> New period
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <PeriodCardSkeleton key={i} />)}
        </div>
      ) : periods.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No academic periods yet"
          description="Create your first semester or year to start organizing your notes."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={15} /> Create your first period
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {periods.map(period => {
            const TypeIcon = TYPE_ICON[period.type] || GraduationCap;
            return (
              <div key={period._id} className="relative group">
                <Link href={`/periods/${period._id}`} className="block">
                  <Card hover padding={false} className="p-5 transition-all duration-150">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'var(--brand-50)' }}
                      >
                        <TypeIcon size={18} style={{ color: 'var(--brand-500)' }} />
                      </div>
                      {/* Dropdown trigger — stop link propagation */}
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(menuOpen === period._id ? null : period._id); }}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--bg-hover)]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <MoreVertical size={15} />
                      </button>
                    </div>

                    {/* Name */}
                    <h2 className="font-semibold text-base mb-1 pr-2" style={{ color: 'var(--text-primary)' }}>
                      {period.name}
                    </h2>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: 'var(--brand-50)', color: 'var(--brand-500)' }}
                      >
                        {TYPE_LABEL[period.type] || 'Period'}
                      </span>
                      <span className="flex items-center gap-1 text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                        <BookOpen size={12} />
                        {period.subjectCount} subject{period.subjectCount !== 1 ? 's' : ''}
                      </span>
                      <ArrowRight size={13} className="opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </Card>
                </Link>

                {/* Dropdown menu */}
                {menuOpen === period._id && (
                  <div
                    className="absolute top-12 right-3 z-20 w-36 rounded-xl shadow-lg border py-1 animate-scale-in"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { setEditing(period); setMenuOpen(null); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--bg-hover)] transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => { setDeleting(period); setMenuOpen(null); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--bg-hover)] transition-colors text-red-500"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create form */}
      <PeriodForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleCreate}
      />

      {/* Edit form */}
      <PeriodForm
        open={!!editing}
        onClose={() => setEditing(null)}
        onSave={handleEdit}
        initial={editing}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete period?"
        message={`This will permanently delete "${deleting?.name}" and all its subjects, chapters, and notes. This cannot be undone.`}
        confirmLabel="Delete period"
      />
    </AppShell>
  );
}
