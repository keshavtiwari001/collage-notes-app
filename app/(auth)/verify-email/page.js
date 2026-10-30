'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

const RESEND_COOLDOWN = 60; // seconds

function VerifyEmailContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const userId       = searchParams.get('userId') ?? '';

  const [otp,      setOtp]      = useState(['', '', '', '', '', '']);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [locked,   setLocked]   = useState(false); // max attempts hit

  const inputRefs = useRef([]);

  // Start cooldown timer on mount
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [userId]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.every(d => d !== '') && !loading && !locked) {
      handleVerify(otp.join(''));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  if (!userId) {
    return (
      <div className="px-8 py-8 text-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Invalid verification link.{' '}
          <a href="/register" style={{ color: 'var(--brand-500)' }} className="underline">Register again</a>
        </p>
      </div>
    );
  }

  const handleDigitChange = (index, value) => {
    // Accept only a single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);
    setError('');

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        // Clear current
        const next = [...otp];
        next[index] = '';
        setOtp(next);
      } else if (index > 0) {
        // Move to previous
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    // Focus last filled or last input
    const lastIdx = Math.min(pasted.length, 5);
    inputRefs.current[lastIdx]?.focus();
  };

  const handleVerify = async (code) => {
    if (loading || locked) return;
    setLoading(true);
    setError('');

    try {
      const res  = await fetch('/api/auth/verify-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, otp: code }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) setLocked(true);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setError(data.error || 'Verification failed.');
        return;
      }

      setSuccess('Email verified! Redirecting…');
      setTimeout(() => router.push('/'), 1000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    setLocked(false);

    try {
      const res  = await fetch('/api/auth/resend-verification', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to resend. Please try again.');
        return;
      }

      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setCooldown(RESEND_COOLDOWN);

      // Restart countdown
      const interval = setInterval(() => {
        setCooldown(c => {
          if (c <= 1) { clearInterval(interval); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: 'var(--brand-50, #f0f4ff)' }}
        >
          <Mail size={26} style={{ color: 'var(--brand-500)' }} />
        </div>
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Check your email
        </h1>
        <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
          We sent a 6-digit verification code to your email address. Enter it below to activate your account.
        </p>
      </div>

      {/* OTP Input boxes */}
      <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleDigitChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            disabled={loading || locked || !!success}
            className="w-11 h-13 text-center text-xl font-bold rounded-xl border outline-none
              transition-all duration-150 focus:ring-2 focus:ring-[var(--brand-500)]
              focus:ring-opacity-30 focus:border-[var(--border-focus)]
              disabled:opacity-40"
            style={{
              width: '44px',
              height: '52px',
              backgroundColor: 'var(--bg-input)',
              borderColor:     digit ? 'var(--brand-500)' : 'var(--border-default)',
              color:           'var(--text-primary)',
            }}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm border mb-4 text-center"
          style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}
        >
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div
          className="rounded-lg px-4 py-3 text-sm border mb-4 text-center"
          style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}
        >
          {success}
        </div>
      )}

      {/* Manual verify button (for keyboard users) */}
      {!success && (
        <Button
          className="w-full mb-4"
          size="lg"
          loading={loading}
          disabled={otp.some(d => !d) || locked}
          onClick={() => handleVerify(otp.join(''))}
        >
          Verify email
        </Button>
      )}

      {/* Resend */}
      {!success && !locked && (
        <div className="text-center">
          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            Didn't receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="text-sm font-medium flex items-center gap-1.5 mx-auto transition-opacity
              disabled:opacity-40 disabled:cursor-not-allowed hover:underline"
            style={{ color: 'var(--brand-500)' }}
          >
            <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      )}

      {locked && !success && (
        <div className="text-center">
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            Too many incorrect attempts. Request a new code.
          </p>
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="text-sm font-medium flex items-center gap-1.5 mx-auto hover:underline
              disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: 'var(--brand-500)' }}
          >
            <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send new code'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="px-8 py-8 text-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
