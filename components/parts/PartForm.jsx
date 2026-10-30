'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function PartForm({ open, onClose, onSave, initial }) {
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
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Part' : 'New Part'} size="sm">
      <div className="flex flex-col gap-4">
        <Input
          label="Part title"
          placeholder="e.g. Part 1 — Basics, Key Concepts…"
          value={title}
          onChange={e => { setTitle(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          error={error}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {initial ? 'Save changes' : 'Create part'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
