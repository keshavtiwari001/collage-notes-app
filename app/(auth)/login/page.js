'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from         = searchParams.get('from') || '/';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }

    setLoading(true);
    setError('');

    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Unverified email — redirect to verify page
        if (res.status === 403 && data.needsVerification) {
          router.push(`/verify-email?userId=${encodeURIComponent(data.userId)}`);
          return;
        }
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      // Success — navigate to original destination or dashboard
      router.push(from === '/login' ? '/' : from);
      router.refresh(); // ensure server components re-render with new session
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
          Sign in to Academica
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Welcome back. Enter your credentials to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(''); }}
          autoComplete="email"
          autoFocus
          disabled={loading}
        />

        {/* Password with show/hide */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs hover:underline"
              style={{ color: 'var(--brand-500)' }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Your password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password"
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
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Don't have an account?{' '}
        <Link href="/register" className="font-medium hover:underline" style={{ color: 'var(--brand-500)' }}>
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="px-8 py-8 text-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
