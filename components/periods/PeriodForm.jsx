'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { GraduationCap, Calendar } from 'lucide-react';

export default function PeriodForm({ open, onClose, onSave, initial }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('semester');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(initial?.name || '');
      setType(initial?.type || 'semester');
      setError('');
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    try {
      await onSave({ name: name.trim(), type });
      onClose();
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: 'semester', label: 'Semester', icon: GraduationCap, example: 'e.g. 1st Semester' },
    { value: 'year',     label: 'Year',     icon: Calendar,      example: 'e.g. 2nd Year' },
  ];

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Period' : 'New Academic Period'} size="sm">
      <div className="flex flex-col gap-4">
        {/* Type toggle */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Type</p>
          <div className="grid grid-cols-2 gap-2">
            {typeOptions.map(({ value, label, icon: Icon, example }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className="flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all duration-150"
                style={{
                  borderColor: type === value ? 'var(--border-focus)' : 'var(--border-default)',
                  backgroundColor: type === value ? 'var(--bg-active)' : 'var(--bg-input)',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <Icon size={13} style={{ color: type === value ? 'var(--brand-500)' : 'var(--text-muted)' }} />
                  <span className="text-sm font-medium" style={{ color: type === value ? 'var(--brand-500)' : 'var(--text-primary)' }}>
                    {label}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{example}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <Input
          label="Name"
          placeholder={type === 'semester' ? '1st Semester, Fall 2025…' : '1st Year, Year One…'}
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          error={error}
          autoFocus
        />

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {initial ? 'Save changes' : 'Create period'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
