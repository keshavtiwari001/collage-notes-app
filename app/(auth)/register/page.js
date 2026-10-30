'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// ── Password strength ─────────────────────────────────────────────
function getStrength(password) {
  if (!password) return { level: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8)   score++;
  if (password.length >= 12)  score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: 'Weak',   color: '#ef4444' };
  if (score <= 4) return { level: 2, label: 'Medium',  color: '#f59e0b' };
  return          { level: 3, label: 'Strong', color: '#22c55e' };
}

function PasswordStrength({ password }) {
  const { level, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= level ? color : 'var(--border-default)' }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color }}>{label}</p>
    </div>
  );
}

// ── Client-side validation ────────────────────────────────────────
function validateForm({ name, email, password, confirmPassword }) {
  if (!name.trim())            return 'Full name is required';
  if (name.trim().length > 100) return 'Name must be 100 characters or fewer';
  if (!email.trim())           return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address';
  if (!password)               return 'Password is required';
  if (password.length < 8)    return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErr = validateForm(form);
    if (clientErr) { setError(clientErr); return; }

    setLoading(true);
    setError('');

    try {
      const res  = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      // Redirect to verification page with userId
      router.push(`/verify-email?userId=${encodeURIComponent(data.userId)}`);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Create your account
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Start organising your academic notes.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Full name"
          type="text"
          placeholder="Your name"
          value={form.name}
          onChange={set('name')}
          autoComplete="name"
          autoFocus
          disabled={loading}
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set('email')}
          autoComplete="email"
          disabled={loading}
        />

        {/* Password with show/hide */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
              disabled={loading}
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none pr-10
                transition-all duration-150 placeholder:text-[var(--text-muted)]
                focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-opacity-20
                focus:border-[var(--border-focus)] border-[var(--border-default)]
                disabled:opacity-50"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
              tabIndex={-1}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <PasswordStrength password={form.password} />
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Confirm password
          </label>
          <div className="relative">
            <input
              type={showCPw ? 'text' : 'password'}
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              autoComplete="new-password"
              disabled={loading}
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none pr-10
                transition-all duration-150 placeholder:text-[var(--text-muted)]
                focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-opacity-20
                focus:border-[var(--border-focus)] border-[var(--border-default)]
                disabled:opacity-50"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            />
            <button
              type="button"
              onClick={() => setShowCPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
              tabIndex={-1}
            >
              {showCPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-lg px-4 py-3 text-sm border"
            style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}
          >
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--brand-500)' }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
