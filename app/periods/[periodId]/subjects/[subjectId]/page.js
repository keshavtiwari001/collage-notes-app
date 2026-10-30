'use client';
import { use, useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Spinner from '@/components/ui/Spinner';
import { ChapterRowSkeleton, QACardSkeleton } from '@/components/ui/Skeleton';
import ChapterForm from '@/components/chapters/ChapterForm';
import QAForm from '@/components/qa/QAForm';
import NoteEditor from '@/components/editor/NoteEditor';
import ExportMenu from '@/components/ui/ExportMenu';
import { useToast } from '@/context/ToastContext';
import { tiptapToHtml } from '@/lib/tiptapToHtml';
import { clientFetch } from '@/lib/clientFetch';
import { exportQAAsTxt } from '@/lib/exportUtils';
import {
  Layers, Plus, MoreVertical, Pencil, Trash2,
  ArrowRight, HelpCircle, BookOpen, Hash, ChevronDown, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

// ─── QA Card ────────────────────────────────────────────────────────
function QACard({ item, subjectColor, onEdit, onDelete, onSaveAnswer }) {
  const [editingAnswer, setEditingAnswer] = useState(false);

  const handleSave = useCallback(
    (content) => onSaveAnswer(item._id, content),
    [item._id, onSaveAnswer]
  );

  const answerHtml = tiptapToHtml(item.answer);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)' }}
    >
      {/* Question */}
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: 'var(--border-default)', backgroundColor: `${subjectColor}08` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span
              className="mt-0.5 shrink-0 text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${subjectColor}20`, color: subjectColor }}
            >Q</span>
            <p className="font-semibold text-base leading-snug" style={{ color: 'var(--text-primary)' }}>
              {item.question}
            </p>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              title="Edit question"
              onClick={() => onEdit(item)}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <Pencil size={13} />
            </button>
            <button
              title="Delete"
              onClick={() => onDelete(item)}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-red-50 text-red-400 hover:text-red-500"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Answer */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}
          >A</span>
          {!editingAnswer && (
            <button
              onClick={() => setEditingAnswer(true)}
              className="text-xs font-medium transition-colors hover:underline ml-auto"
              style={{ color: 'var(--brand-500)' }}
            >
              {item.answer ? 'Edit answer' : 'Write answer'}
            </button>
          )}
          {editingAnswer && (
            <button
              onClick={() => setEditingAnswer(false)}
              className="text-xs font-medium transition-colors hover:underline ml-auto"
              style={{ color: 'var(--text-muted)' }}
            >
              Done
            </button>
          )}
        </div>

        {editingAnswer ? (
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
            <NoteEditor
              partId={item._id}
              initialContent={item.answer}
              onSave={handleSave}
            />
          </div>
        ) : (
          <div>
            {answerHtml ? (
              <div
                className="prose-answer text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
                dangerouslySetInnerHTML={{ __html: answerHtml }}
              />
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                No answer yet — click "Write answer" to add one.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Subject Page ────────────────────────────────────────────
export default function SubjectDetailPage({ params }) {
  const { periodId, subjectId } = use(params);
  const { toast } = useToast();

  const [period,        setPeriod]        = useState(null);
  const [subject,       setSubject]       = useState(null);
  const [chapters,      setChapters]      = useState([]);
  const [qaItems,       setQaItems]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [notFound,      setNotFound]      = useState(false);
  const [activeTab,     setActiveTab]     = useState('chapters');

  // Chapter state
  const [chapterFormOpen, setChapterFormOpen] = useState(false);
  const [editingChapter,  setEditingChapter]  = useState(null);
  const [deletingChapter, setDeletingChapter] = useState(null);
  const [chapterDelLoading, setChapterDelLoading] = useState(false);
  const [menuOpen,        setMenuOpen]        = useState(null);

  // QA state
  const [qaFormOpen,  setQaFormOpen]  = useState(false);
  const [editingQA,   setEditingQA]   = useState(null);
  const [deletingQA,  setDeletingQA]  = useState(null);
  const [qaDelLoading,setQaDelLoading]= useState(false);
  const [loadingQaTxt, setLoadingQaTxt] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [pRes, sRes, cRes, qaRes] = await Promise.all([
        clientFetch(`/api/periods/${periodId}`),
        clientFetch(`/api/subjects/${subjectId}`),
        clientFetch(`/api/chapters?subjectId=${subjectId}`),
        clientFetch(`/api/qa?subjectId=${subjectId}`),
      ]);
      if (sRes.status === 404 || pRes.status === 404) { setNotFound(true); setLoading(false); return; }
      const [p, s, c, qa] = await Promise.all([pRes.json(), sRes.json(), cRes.json(), qaRes.json()]);
      setPeriod(p); setSubject(s);
      setChapters(Array.isArray(c) ? c : []);
      setQaItems(Array.isArray(qa) ? qa : []);
    } catch {
      toast({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  }, [periodId, subjectId, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!menuOpen) return;
    const h = () => setMenuOpen(null);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [menuOpen]);

  // ── Chapter handlers ──
  const handleCreateChapter = async ({ title }) => {
    const res = await fetch('/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId, title }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const created = await res.json();
    setChapters(prev => [...prev, created]);
    toast({ type: 'success', message: `"${created.title}" created` });
  };

  const handleEditChapter = async ({ title }) => {
    const res = await fetch(`/api/chapters/${editingChapter._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const updated = await res.json();
    setChapters(prev => prev.map(c =>
      c._id === updated._id ? { ...updated, partCount: c.partCount } : c
    ));
    toast({ type: 'success', message: 'Chapter updated' });
    setEditingChapter(null);
  };

  const handleDeleteChapter = async () => {
    setChapterDelLoading(true);
    try {
      const res = await fetch(`/api/chapters/${deletingChapter._id}`, { method: 'DELETE' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setChapters(prev => prev.filter(c => c._id !== deletingChapter._id));
      toast({ type: 'success', message: `"${deletingChapter.title}" deleted` });
      setDeletingChapter(null);
    } catch (e) {
      toast({ type: 'error', message: e.message || 'Delete failed' });
    } finally {
      setChapterDelLoading(false);
    }
  };

  // ── QA handlers ──
  const handleCreateQA = async ({ question }) => {
    const res = await fetch('/api/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId, question }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const created = await res.json();
    setQaItems(prev => [...prev, created]);
    toast({ type: 'success', message: 'Question added' });
  };

  const handleEditQA = async ({ question }) => {
    const res = await fetch(`/api/qa/${editingQA._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const updated = await res.json();
    setQaItems(prev => prev.map(q => q._id === updated._id ? { ...q, question: updated.question } : q));
    toast({ type: 'success', message: 'Question updated' });
    setEditingQA(null);
  };

  const handleDeleteQA = async () => {
    setQaDelLoading(true);
    try {
      const res = await fetch(`/api/qa/${deletingQA._id}`, { method: 'DELETE' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setQaItems(prev => prev.filter(q => q._id !== deletingQA._id));
      toast({ type: 'success', message: 'Question deleted' });
      setDeletingQA(null);
    } catch (e) {
      toast({ type: 'error', message: e.message || 'Delete failed' });
    } finally {
      setQaDelLoading(false);
    }
  };

  const handleSaveAnswer = useCallback(async (qaId, content) => {
    const res = await fetch(`/api/qa/${qaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: content }),
    });
    if (!res.ok) throw new Error('Save failed');
    setQaItems(prev => prev.map(q => q._id === qaId ? { ...q, answer: content } : q));
  }, []);

  const handleExportQATxt = async () => {
    setLoadingQaTxt(true);
    try {
      exportQAAsTxt({ subjectName: subject?.name, qaItems });
    } catch {
      toast({ type: 'error', message: 'Export failed' });
    } finally {
      setLoadingQaTxt(false);
    }
  };

  const breadcrumbs = [
    { label: 'Semesters & Years', href: '/periods' },
    { label: period?.name  || '…', href: `/periods/${periodId}` },
    { label: subject?.name || '…' },
  ];

  const subjectColor = subject?.color || 'var(--brand-500)';

  const tabs = [
    { key: 'chapters', label: 'Chapters', icon: Layers,     count: chapters.length },
    { key: 'qa',       label: 'Q&A',      icon: HelpCircle, count: qaItems.length  },
  ];

  return (
    <AppShell breadcrumbs={breadcrumbs}>
      {loading ? (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-hover)' }} />
            <div className="space-y-2">
              <div className="h-5 w-44 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-hover)' }} />
              <div className="h-3 w-28 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-hover)' }} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => <ChapterRowSkeleton key={i} />)}
          </div>
        </div>
      ) : notFound ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-hover)' }}>
            <BookOpen size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Subject not found</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>This subject may have been deleted.</p>
          <Button variant="secondary" onClick={() => window.history.back()}>Go back</Button>
        </div>
      ) : (
        <>
          {/* Subject header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${subjectColor}20` }}
              >
                <BookOpen size={20} style={{ color: subjectColor }} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: subjectColor }} />
                  <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {subject?.name}
                  </h1>
                </div>
                {subject?.description && (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{subject.description}</p>
                )}
              </div>
            </div>
            {/* Context-aware action button */}
            {activeTab === 'chapters' && (
              <Button onClick={() => setChapterFormOpen(true)} size="md" className="shrink-0">
                <Plus size={16} /> New chapter
              </Button>
            )}
            {activeTab === 'qa' && (
              <div className="flex items-center gap-2">
                {qaItems.length > 0 && (
                  <ExportMenu
                    onExportTxt={handleExportQATxt}
                    loadingTxt={loadingQaTxt}
                  />
                )}
                <Button onClick={() => setQaFormOpen(true)} size="md" className="shrink-0">
                  <Plus size={16} /> Add question
                </Button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
            {tabs.map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px"
                style={{
                  borderBottomColor: activeTab === key ? subjectColor : 'transparent',
                  color: activeTab === key ? subjectColor : 'var(--text-muted)',
                }}
              >
                <Icon size={15} />
                {label}
                <span
                  className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: activeTab === key ? `${subjectColor}18` : 'var(--bg-hover)',
                    color: activeTab === key ? subjectColor : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* ── Chapters tab ── */}
          {activeTab === 'chapters' && (
            chapters.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No chapters yet"
                description="Break this subject into chapters to keep your notes organised."
                action={<Button onClick={() => setChapterFormOpen(true)}><Plus size={15} /> Add first chapter</Button>}
              />
            ) : (
              <div className="flex flex-col gap-2">
                {chapters.map((chapter, idx) => (
                  <div key={chapter._id} className="relative group">
                    <Link href={`/periods/${periodId}/subjects/${subjectId}/chapters/${chapter._id}`}>
                      <Card hover padding={false} className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold tabular-nums"
                            style={{ backgroundColor: `${subjectColor}18`, color: subjectColor }}
                          >
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate" style={{ color: 'var(--text-primary)' }}>
                              {chapter.title}
                            </p>
                            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                              <Hash size={10} />{chapter.partCount} part{chapter.partCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <button
                            onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(menuOpen === chapter._id ? null : chapter._id); }}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--bg-hover)] shrink-0"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <MoreVertical size={15} />
                          </button>
                          <ArrowRight size={14} className="shrink-0 opacity-30 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all" style={{ color: 'var(--text-muted)' }} />
                        </div>
                      </Card>
                    </Link>
                    {menuOpen === chapter._id && (
                      <div
                        className="absolute top-12 right-3 z-20 w-36 rounded-xl shadow-lg border py-1 animate-scale-in"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button onClick={() => { setEditingChapter(chapter); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--bg-hover)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
                          <Pencil size={13} /> Edit
                        </button>
                        <button onClick={() => { setDeletingChapter(chapter); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--bg-hover)] transition-colors text-red-500">
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── Q&A tab ── */}
          {activeTab === 'qa' && (
            qaItems.length === 0 ? (
              <EmptyState
                icon={HelpCircle}
                title="No questions yet"
                description="Add questions and answers to prepare for exams and revise effectively."
                action={<Button onClick={() => setQaFormOpen(true)}><Plus size={15} /> Add first question</Button>}
              />
            ) : (
              <div className="flex flex-col gap-4">
                {qaItems.map(item => (
                  <QACard
                    key={item._id}
                    item={item}
                    subjectColor={subjectColor}
                    onEdit={q => setEditingQA(q)}
                    onDelete={q => setDeletingQA(q)}
                    onSaveAnswer={handleSaveAnswer}
                  />
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* Chapter modals */}
      <ChapterForm open={chapterFormOpen}   onClose={() => setChapterFormOpen(false)} onSave={handleCreateChapter} />
      <ChapterForm open={!!editingChapter}  onClose={() => setEditingChapter(null)}   onSave={handleEditChapter}   initial={editingChapter} />
      <ConfirmDialog
        open={!!deletingChapter} onClose={() => setDeletingChapter(null)}
        onConfirm={handleDeleteChapter} loading={chapterDelLoading}
        title="Delete chapter?"
        message={`"${deletingChapter?.title}" and all its parts will be permanently deleted.`}
        confirmLabel="Delete chapter"
      />

      {/* QA modals */}
      <QAForm open={qaFormOpen}  onClose={() => setQaFormOpen(false)} onSave={handleCreateQA} />
      <QAForm open={!!editingQA} onClose={() => setEditingQA(null)}   onSave={handleEditQA}   initial={editingQA} />
      <ConfirmDialog
        open={!!deletingQA} onClose={() => setDeletingQA(null)}
        onConfirm={handleDeleteQA} loading={qaDelLoading}
        title="Delete question?"
        message={`This question and its answer will be permanently deleted.`}
        confirmLabel="Delete question"
      />
    </AppShell>
  );
}
