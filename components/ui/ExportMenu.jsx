'use client';
import { useState, useEffect, useRef } from 'react';
import { Download, FileText, File, Loader2 } from 'lucide-react';

export default function ExportMenu({ onExportTxt, onExportPdf, loadingTxt, loadingPdf }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleTxt = () => { setOpen(false); onExportTxt?.(); };
  const handlePdf = () => { setOpen(false); onExportPdf?.(); };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-150 hover:bg-[var(--bg-hover)]"
        style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)' }}
      >
        <Download size={14} />
        <span className="hidden sm:inline">Export</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-30 w-44 rounded-xl border shadow-lg py-1 animate-scale-in"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
        >
          <button
            onClick={handleTxt}
            disabled={loadingTxt}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
            style={{ color: 'var(--text-secondary)' }}
          >
            {loadingTxt ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            Export as .txt
          </button>
          <button
            onClick={handlePdf}
            disabled={loadingPdf}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
            style={{ color: 'var(--text-secondary)' }}
          >
            {loadingPdf ? <Loader2 size={14} className="animate-spin" /> : <File size={14} />}
            Export as PDF
          </button>
        </div>
      )}
    </div>
  );
}
