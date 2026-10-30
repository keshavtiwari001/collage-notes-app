'use client';
import { tiptapToHtml } from './tiptapToHtml';

// ── TipTap JSON → structured plain text ─────────────────────────
function nodeToText(node, indent = 0) {
  if (!node) return '';
  const pad = ' '.repeat(indent);

  switch (node.type) {
    case 'text': {
      let t = node.text || '';
      const ms = node.marks || [];
      if (ms.some(m => m.type === 'bold'))   t = `**${t}**`;
      if (ms.some(m => m.type === 'italic')) t = `_${t}_`;
      return t;
    }
    case 'paragraph':
      return (node.content || []).map(n => nodeToText(n)).join('') + '\n';
    case 'heading': {
      const level = node.attrs?.level || 2;
      const prefix = '#'.repeat(level) + ' ';
      return prefix + (node.content || []).map(n => nodeToText(n)).join('') + '\n';
    }
    case 'bulletList':
      return (node.content || []).map(li =>
        '• ' + (li.content || []).map(n => nodeToText(n)).join('').replace(/\n+$/, '') + '\n'
      ).join('') + '\n';
    case 'orderedList':
      return (node.content || []).map((li, i) =>
        `${i + 1}. ` + (li.content || []).map(n => nodeToText(n)).join('').replace(/\n+$/, '') + '\n'
      ).join('') + '\n';
    case 'listItem':
      return (node.content || []).map(n => nodeToText(n)).join('');
    case 'blockquote':
      return (node.content || []).map(n => '  > ' + nodeToText(n)).join('') + '\n';
    case 'codeBlock':
      return '```\n' + (node.content || []).map(n => nodeToText(n)).join('') + '\n```\n';
    case 'horizontalRule':
      return '────────────────────────────────────\n';
    case 'hardBreak':
      return '\n';
    case 'image':
      return `[Image: ${node.attrs?.alt || node.attrs?.src || 'image'}]\n`;
    default:
      return (node.content || []).map(n => nodeToText(n, indent)).join('');
  }
}

export function tiptapToStructuredText(json) {
  if (!json) return '';
  if (typeof json === 'string') return json;
  return (json.content || []).map(n => nodeToText(n)).join('').trim();
}

// ── Chapter TXT export ───────────────────────────────────────────
export function exportChapterAsTxt({ chapterTitle, subjectName, parts }) {
  const lines = [];
  lines.push(chapterTitle.toUpperCase());
  if (subjectName) lines.push(subjectName);
  lines.push('═'.repeat(50));
  lines.push('');

  parts.forEach(part => {
    lines.push(`── ${part.title} ──`);
    lines.push('');
    const text = tiptapToStructuredText(part.content);
    if (text) lines.push(text);
    lines.push('');
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, sanitizeFilename(chapterTitle) + '.txt');
}

// ── Q&A TXT export ───────────────────────────────────────────────
export function exportQAAsTxt({ subjectName, qaItems }) {
  const lines = [];
  lines.push((subjectName || 'Q&A').toUpperCase() + ' — Questions & Answers');
  lines.push('═'.repeat(50));
  lines.push('');

  qaItems.forEach((item, idx) => {
    lines.push(`Q${idx + 1}: ${item.question}`);
    lines.push('');
    const ansText = tiptapToStructuredText(item.answer);
    lines.push(`A: ${ansText || '(No answer yet)'}`);
    lines.push('');
    lines.push('─'.repeat(40));
    lines.push('');
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, sanitizeFilename((subjectName || 'qa') + '-qa') + '.txt');
}

// ── Chapter PDF export ───────────────────────────────────────────
export async function exportChapterAsPdf({ chapterTitle, subjectName, periodName, parts }) {
  const html2pdf = (await import('html2pdf.js')).default;

  const content = parts.map(part => {
    const html = tiptapToHtml(part.content);
    return `
      <div class="part-block">
        <h2 class="part-title">${escHtml(part.title)}</h2>
        <div class="part-content">${html || '<p class="empty">No content yet.</p>'}</div>
      </div>`;
  }).join('');

  // Build a complete self-contained HTML string
  // Using .from(string, 'string') avoids html2canvas off-screen rendering issues
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; line-height: 1.75; color: #1a1a1a; }
        .doc { padding: 20px; }
        .doc-header { margin-bottom: 28px; }
        .breadcrumb { font-family: Arial, sans-serif; font-size: 8.5pt; color: #888; margin-bottom: 6px; letter-spacing: 0.02em; }
        .doc-title { font-size: 22pt; font-weight: 700; color: #111; line-height: 1.2; margin-bottom: 14px; }
        .doc-divider { border: none; border-top: 2px solid #222; margin-bottom: 20px; }
        .part-block { margin-bottom: 28px; }
        .part-title { font-family: Arial, sans-serif; font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #444; border-left: 3px solid #555; padding-left: 10px; margin-bottom: 12px; }
        .part-content p { margin-bottom: 8px; }
        .part-content h1 { font-size: 16pt; font-weight: 700; margin: 16px 0 8px; }
        .part-content h2 { font-size: 13pt; font-weight: 700; margin: 14px 0 7px; }
        .part-content h3 { font-size: 11pt; font-weight: 700; margin: 12px 0 6px; }
        .part-content ul, .part-content ol { padding-left: 20px; margin-bottom: 8px; }
        .part-content li { margin-bottom: 3px; }
        .part-content blockquote { border-left: 3px solid #bbb; padding-left: 12px; color: #555; font-style: italic; margin: 10px 0; }
        .part-content code { font-family: 'Courier New', Courier, monospace; background: #f4f4f4; border: 1px solid #ddd; border-radius: 3px; padding: 1px 4px; font-size: 9.5pt; }
        .part-content pre { background: #f4f4f4; border: 1px solid #ddd; border-radius: 4px; padding: 10px 14px; margin: 10px 0; font-size: 9pt; overflow: hidden; white-space: pre-wrap; word-break: break-word; }
        .part-content pre code { background: none; border: none; padding: 0; }
        .part-content img { max-width: 100%; height: auto; margin: 8px 0; border-radius: 4px; }
        .part-content a { color: #2451eb; }
        .part-content hr { border: none; border-top: 1px solid #ddd; margin: 14px 0; }
        .part-content strong { font-weight: 700; }
        .part-content em { font-style: italic; }
        .part-content u { text-decoration: underline; }
        .empty { color: #aaa; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="doc">
        <div class="doc-header">
          <div class="breadcrumb">${escHtml([periodName, subjectName].filter(Boolean).join(' › '))}</div>
          <h1 class="doc-title">${escHtml(chapterTitle)}</h1>
          <br/>
          <hr class="doc-divider" />
        </div>
        ${content}
      </div>
    </body>
    </html>`;

  await html2pdf()
    .set({
      margin:      [14, 16, 14, 16],
      filename:    sanitizeFilename(chapterTitle) + '.pdf',
      image:       { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale:        2,
        useCORS:      true,
        logging:      false,
        letterRendering: true,
        allowTaint:   false,
      },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:   { mode: 'avoid-all' },
    })
    .from(fullHtml, 'string')
    .save();
}

// ── Helpers ──────────────────────────────────────────────────────
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name) {
  return (name || 'export').replace(/[^a-z0-9\-_\. ]/gi, '').replace(/\s+/g, '-').toLowerCase().slice(0, 80);
}

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
