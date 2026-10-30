'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Check } from 'lucide-react';

const COLORS = [
  { value: '#3b6ef6', label: 'Blue'   },
  { value: '#14b8a6', label: 'Teal'   },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#f59e0b', label: 'Amber'  },
  { value: '#f43f5e', label: 'Rose'   },
  { value: '#22c55e', label: 'Green'  },
  { value: '#f97316', label: 'Orange' },
  { value: '#64748b', label: 'Slate'  },
];

export default function SubjectForm({ open, onClose, onSave, initial }) {
  const [name, setName]             = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor]           = useState(COLORS[0].value);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (open) {
      setName(initial?.name || '');
      setDescription(initial?.description || '');
      setColor(initial?.color || COLORS[0].value);
      setError('');
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    try {
      await onSave({ name: name.trim(), description: description.trim(), color });
      onClose();
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Subject' : 'New Subject'} size="sm">
      <div className="flex flex-col gap-4">
        <Input
          label="Subject name"
          placeholder="e.g. Computer Networks, Mathematics…"
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          error={error}
          autoFocus
        />

        <Input
          label="Description (optional)"
          placeholder="A short description of this subject…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          multiline
          rows={2}
        />

        {/* Color picker */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Color</p>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => setColor(c.value)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus-visible:outline-2"
                style={{ backgroundColor: c.value, outline: color === c.value ? `2px solid ${c.value}` : 'none', outlineOffset: '2px' }}
              >
                {color === c.value && <Check size={12} className="text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div
          className="flex items-center gap-3 p-3 rounded-lg border"
          style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-hover)' }}
        >
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {name || 'Subject name'}
          </span>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {initial ? 'Save changes' : 'Create subject'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
