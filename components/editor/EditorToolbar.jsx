'use client';
import { useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code2, AlignLeft, AlignCenter, AlignRight,
  Minus, ImageIcon, Loader2,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const MAX_BYTES = 5 * 1024 * 1024;

function ToolBtn({ onClick, active, title, children, disabled }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 flex items-center justify-center rounded transition-all duration-100 disabled:opacity-40"
      style={{
        backgroundColor: active ? 'var(--bg-active)' : 'transparent',
        color: active ? 'var(--brand-500)' : 'var(--text-secondary)',
      }}
      onMouseEnter={e => { if (!active && !disabled) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = active ? 'var(--bg-active)' : 'transparent'; }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 mx-0.5 shrink-0" style={{ backgroundColor: 'var(--border-default)' }} />;
}

export default function EditorToolbar({ editor }) {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  if (!editor) return null;

  const handleImageClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so same file can be re-selected

    if (!file.type.startsWith('image/')) {
      toast({ type: 'error', message: 'Only image files are supported' });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ type: 'error', message: 'Image must be under 5MB' });
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
      toast({ type: 'success', message: 'Image inserted' });
    } catch (err) {
      toast({ type: 'error', message: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const groups = [
    [
      { icon: <Bold size={13} />,      title: 'Bold',      action: () => editor.chain().focus().toggleBold().run(),      active: editor.isActive('bold') },
      { icon: <Italic size={13} />,    title: 'Italic',    action: () => editor.chain().focus().toggleItalic().run(),    active: editor.isActive('italic') },
      { icon: <Underline size={13} />, title: 'Underline', action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline') },
    ],
    [
      { icon: <Heading1 size={13} />, title: 'Heading 1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
      { icon: <Heading2 size={13} />, title: 'Heading 2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
      { icon: <Heading3 size={13} />, title: 'Heading 3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
    ],
    [
      { icon: <List size={13} />,        title: 'Bullet list',  action: () => editor.chain().focus().toggleBulletList().run(),  active: editor.isActive('bulletList') },
      { icon: <ListOrdered size={13} />, title: 'Ordered list', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
      { icon: <Quote size={13} />,       title: 'Blockquote',   action: () => editor.chain().focus().toggleBlockquote().run(),  active: editor.isActive('blockquote') },
      { icon: <Code2 size={13} />,       title: 'Code block',   action: () => editor.chain().focus().toggleCodeBlock().run(),   active: editor.isActive('codeBlock') },
    ],
    [
      { icon: <AlignLeft size={13} />,   title: 'Align left',   action: () => editor.chain().focus().setTextAlign('left').run(),   active: editor.isActive({ textAlign: 'left' }) },
      { icon: <AlignCenter size={13} />, title: 'Align center', action: () => editor.chain().focus().setTextAlign('center').run(), active: editor.isActive({ textAlign: 'center' }) },
      { icon: <AlignRight size={13} />,  title: 'Align right',  action: () => editor.chain().focus().setTextAlign('right').run(),  active: editor.isActive({ textAlign: 'right' }) },
    ],
    [
      { icon: <Minus size={13} />, title: 'Horizontal rule', action: () => editor.chain().focus().setHorizontalRule().run(), active: false },
    ],
  ];

  return (
    <div
      className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 border-b"
      style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-hover)' }}
    >
      {groups.map((group, gi) => (
        <span key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <Divider />}
          {group.map((btn, bi) => (
            <ToolBtn key={bi} onClick={btn.action} active={btn.active} title={btn.title}>
              {btn.icon}
            </ToolBtn>
          ))}
        </span>
      ))}

      {/* Image upload */}
      <Divider />
      <ToolBtn onClick={handleImageClick} title="Insert image" disabled={uploading} active={false}>
        {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
      </ToolBtn>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
