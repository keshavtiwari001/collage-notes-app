'use client';
import { use, useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Spinner from '@/components/ui/Spinner';
import PartForm from '@/components/parts/PartForm';
import NoteEditor from '@/components/editor/NoteEditor';
import ExportMenu from '@/components/ui/ExportMenu';
import { PartSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/context/ToastContext';
import { exportChapterAsTxt, exportChapterAsPdf } from '@/lib/exportUtils';
import { clientFetch } from '@/lib/clientFetch';
import {
  Layers, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  FileText, BookOpen,
} from 'lucide-react';

// Single collapsible part with editor
function PartBlock({ part, subjectColor, onSaveContent, onEditTitle, onDelete }) {
  const [open, setOpen] = useState(true);

  const handleSave = useCallback(
    (content) => onSaveContent(part._id, content),
    [part._id, onSaveContent]
  );

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)' }}
    >
      {/* Part header */}
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none group"
        style={{ backgroundColor: 'var(--bg-hover)', borderBottom: open ? `1px solid var(--border-default)` : 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        {/* Collapse chevron */}
        <span style={{ color: 'var(--text-muted)' }}>
          {open
            ? <ChevronDown size={15} />
            : <ChevronRight size={15} />
          }
        </span>

        {/* Color accent */}
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: subjectColor }} />

        {/* Title */}
        <span className="flex-1 font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
          {part.title}
        </span>

        {/* Actions — stop propagation so click doesn't toggle collapse */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button
            title="Edit title"
            onClick={() => onEditTitle(part)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--border-default)] transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <Pencil size={13} />
          </button>
          <button
            title="Delete part"
            onClick={() => onDelete(part)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-red-400 hover:text-red-500"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Editor */}
      {open && (
        <NoteEditor
          partId={part._id}
          initialContent={part.content}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default function ChapterDetailPage({ params }) {
  const { periodId, subjectId, chapterId } = use(params);
  const { toast } = useToast();

  const [period,        setPeriod]        = useState(null);
  const [subject,       setSubject]       = useState(null);
  const [chapter,       setChapter]       = useState(null);
  const [parts,         setParts]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [formOpen,      setFormOpen]      = useState(false);
  const [editing,       setEditing]       = useState(null);
  const [deleting,      setDeleting]      = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loadingTxt,    setLoadingTxt]    = useState(false);
  const [loadingPdf,    setLoadingPdf]    = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [pRes, sRes, cRes, partsRes] = await Promise.all([
        clientFetch(`/api/periods/${periodId}`),
        clientFetch(`/api/subjects/${subjectId}`),
        clientFetch(`/api/chapters/${chapterId}`),
        clientFetch(`/api/parts?chapterId=${chapterId}`),
      ]);
      const [p, s, c, pts] = await Promise.all([
        pRes.json(), sRes.json(), cRes.json(), partsRes.json(),
      ]);
      setPeriod(p); setSubject(s); setChapter(c);
      setParts(Array.isArray(pts) ? pts : []);
    } catch {
      toast({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  }, [periodId, subjectId, chapterId, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Create part
  const handleCreate = async ({ title }) => {
    const res = await fetch('/api/parts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId, title }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const created = await res.json();
    setParts(prev => [...prev, created]);
    toast({ type: 'success', message: `"${created.title}" created` });
  };

  // Edit part title
  const handleEditTitle = async ({ title }) => {
    const res = await fetch(`/api/parts/${editing._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const updated = await res.json();
    setParts(prev => prev.map(p => p._id === updated._id ? { ...p, title: updated.title } : p));
    toast({ type: 'success', message: 'Part renamed' });
    setEditing(null);
  };

  // Save content (called by debounced autosave in NoteEditor)
  const handleSaveContent = useCallback(async (partId, content) => {
    const res = await fetch(`/api/parts/${partId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Save failed');
    // Update local content silently
    setParts(prev => prev.map(p => p._id === partId ? { ...p, content } : p));
  }, []);

  // Delete part
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/parts/${deleting._id}`, { method: 'DELETE' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setParts(prev => prev.filter(p => p._id !== deleting._id));
      toast({ type: 'success', message: `"${deleting.title}" deleted` });
      setDeleting(null);
    } catch (e) {
      toast({ type: 'error', message: e.message || 'Delete failed' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportTxt = async () => {
    setLoadingTxt(true);
    try {
      exportChapterAsTxt({ chapterTitle: chapter?.title, subjectName: subject?.name, parts });
    } catch {
      toast({ type: 'error', message: 'TXT export failed' });
    } finally {
      setLoadingTxt(false);
    }
  };

  const handleExportPdf = async () => {
    setLoadingPdf(true);
    try {
      await exportChapterAsPdf({
        chapterTitle: chapter?.title,
        subjectName:  subject?.name,
        periodName:   period?.name,
        parts,
      });
    } catch (e) {
      toast({ type: 'error', message: 'PDF export failed' });
    } finally {
      setLoadingPdf(false);
    }
  };

  const breadcrumbs = [
    { label: 'Semesters & Years',  href: '/periods' },
    { label: period?.name  || '…', href: `/periods/${periodId}` },
    { label: subject?.name || '…', href: `/periods/${periodId}/subjects/${subjectId}` },
    { label: chapter?.title || '…' },
  ];

  const subjectColor = subject?.color || 'var(--brand-500)';

  return (
    <AppShell breadcrumbs={breadcrumbs}>
      {loading ? (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-hover)' }} />
            <div className="space-y-2">
              <div className="h-3 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-hover)' }} />
              <div className="h-5 w-56 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-hover)' }} />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {[1, 2].map(i => <PartSkeleton key={i} />)}
          </div>
        </div>
      ) : (
        <>
          {/* Chapter header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${subjectColor}20` }}
              >
                <BookOpen size={20} style={{ color: subjectColor }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium mb-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: subjectColor }}
                  />
                  {subject?.name}
                </p>
                <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {chapter?.title}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ExportMenu
                onExportTxt={handleExportTxt}
                onExportPdf={handleExportPdf}
                loadingTxt={loadingTxt}
                loadingPdf={loadingPdf}
              />
              <Button onClick={() => setFormOpen(true)} size="md" className="shrink-0">
                <Plus size={16} /> Add part
              </Button>
            </div>
          </div>

          {/* Parts */}
          {parts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No parts yet"
              description="Divide this chapter into parts to organise your notes, or add a single part to start writing."
              action={
                <Button onClick={() => setFormOpen(true)}>
                  <Plus size={15} /> Add first part
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {parts.map(part => (
                <PartBlock
                  key={part._id}
                  part={part}
                  subjectColor={subjectColor}
                  onSaveContent={handleSaveContent}
                  onEditTitle={p => setEditing(p)}
                  onDelete={p => setDeleting(p)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <PartForm open={formOpen}   onClose={() => setFormOpen(false)} onSave={handleCreate} />
      <PartForm open={!!editing}  onClose={() => setEditing(null)}   onSave={handleEditTitle} initial={editing} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete part?"
        message={`"${deleting?.title}" and all its content will be permanently deleted.`}
        confirmLabel="Delete part"
      />
    </AppShell>
  );
}
