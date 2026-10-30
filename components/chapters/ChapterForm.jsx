'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ChapterForm({ open, onClose, onSave, initial }) {
  const [title,   setTitle]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (open) { setTitle(initial?.title || ''); setError(''); }
  }, [open, initial]);

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    try {
      await onSave({ title: title.trim() });
      onClose();
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Chapter' : 'New Chapter'} size="sm">
      <div className="flex flex-col gap-4">
        <Input
          label="Chapter title"
          placeholder="e.g. Chapter 1 — Introduction, Network Models…"
          value={title}
          onChange={e => { setTitle(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          error={error}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {initial ? 'Save changes' : 'Create chapter'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
