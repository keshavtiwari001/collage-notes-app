'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function QAForm({ open, onClose, onSave, initial }) {
  const [question, setQuestion] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (open) { setQuestion(initial?.question || ''); setError(''); }
  }, [open, initial]);

  const handleSubmit = async () => {
    if (!question.trim()) { setError('Question is required'); return; }
    setLoading(true);
    try {
      await onSave({ question: question.trim() });
      onClose();
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Question' : 'New Question'} size="sm">
      <div className="flex flex-col gap-4">
        <Input
          label="Question"
          placeholder="e.g. What is TCP/IP? How does DNS work?"
          value={question}
          onChange={e => { setQuestion(e.target.value); setError(''); }}
          multiline
          rows={3}
          error={error}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {initial ? 'Save question' : 'Add question'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
