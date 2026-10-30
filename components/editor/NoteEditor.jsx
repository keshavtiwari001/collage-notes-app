'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import EditorToolbar from './EditorToolbar';
import { debounce } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

export default function NoteEditor({ partId, initialContent, onSave }) {
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved
  const saveStateTimer = useRef(null);

  const triggerSave = useCallback(
    debounce(async (content) => {
      setSaveState('saving');
      try {
        await onSave(content);
        setSaveState('saved');
        clearTimeout(saveStateTimer.current);
        saveStateTimer.current = setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('idle');
      }
    }, 1500),
    [onSave]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      UnderlineExt,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing your notes here…' }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: initialContent || '',
    editorProps: {
      attributes: { class: 'ProseMirror focus:outline-none' },
    },
    onUpdate: ({ editor }) => {
      triggerSave(editor.getJSON());
    },
  });

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(saveStateTimer.current), []);

  // When partId changes, update content
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const current = JSON.stringify(editor.getJSON());
      const incoming = JSON.stringify(initialContent || '');
      if (current !== incoming) {
        editor.commands.setContent(initialContent || '');
      }
    }
  }, [partId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col" style={{ backgroundColor: 'var(--bg-card)' }}>
      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Save indicator */}
      <div className="flex justify-end px-4 py-1 min-h-[24px]">
        {saveState === 'saving' && (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Loader2 size={10} className="animate-spin" /> Saving…
          </span>
        )}
        {saveState === 'saved' && (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Check size={10} /> Saved
          </span>
        )}
      </div>

      {/* Editor content */}
      <div className="px-5 pb-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
