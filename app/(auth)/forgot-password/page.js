'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, KeyRound, CheckCircle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// ── Password strength (reused from register) ──────────────────────
function getStrength(password) {
  if (!password) return { level: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { level: 1, label: 'Weak',   color: '#ef4444' };
  if (score <= 4) return { level: 2, label: 'Medium', color: '#f59e0b' };
  return              { level: 3, label: 'Strong', color: '#22c55e' };
}

function PasswordStrength({ password }) {
  const { level, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= level ? color : 'var(--border-default)' }} />
        ))}
      </div>
      <p className="text-xs" style={{ color }}>{label}</p>
    </div>
  );
}

const RESEND_COOLDOWN = 60;

// ── Step 1: Email ─────────────────────────────────────────────────
function StepEmail({ onSuccess }) {
  const [email,   setEmail]   = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      onSuccess(email.trim().toLowerCase());
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-8 py-8">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
          style={{ backgroundColor: 'var(--brand-50, #f0f4ff)' }}>
          <KeyRound size={22} style={{ color: 'var(--brand-500)' }} />
        </div>
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Forgot your password?
        </h1>
        <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
          Enter your email and we'll send a reset code if an account exists.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input label="Email" type="email" placeholder="you@example.com"
          value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
          autoComplete="email" autoFocus disabled={loading} />
        {error && (
          <div className="rounded-lg px-4 py-3 text-sm border"
            style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
            {error}
          </div>
        )}
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Send reset code
        </Button>
      </form>

      <p className="mt-5 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Remember your password?{' '}
        <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--brand-500)' }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

// ── Step 2: OTP ───────────────────────────────────────────────────
function StepOTP({ email, onSuccess }) {
  const [otp,      setOtp]      = useState(['', '', '', '', '', '']);
  const [error,    setError]    = useState('');
  const [info,     setInfo]     = useState('A reset code has been sent to your email. It may take a moment to arrive.');
  const [loading,  setLoading]  = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [locked,   setLocked]   = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCooldown(c => { if (c <= 1) { clearInterval(interval); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (otp.every(d => d !== '') && !loading && !locked) {
      handleVerify(otp.join(''));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next  = [...otp]; next[index] = digit; setOtp(next); setError('');
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) { const n = [...otp]; n[index] = ''; setOtp(n); }
      else if (index > 0) inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft'  && index > 0) inputRefs.current[index - 1]?.focus();
    else if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async (code) => {
    if (loading || locked) return;
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) setLocked(true);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setError(data.error || 'Invalid code. Please try again.');
        return;
      }
      onSuccess(data.resetToken);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true); setError(''); setLocked(false);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setCooldown(RESEND_COOLDOWN);
        setInfo('A new code has been sent.');
        const interval = setInterval(() => {
          setCooldown(c => { if (c <= 1) { clearInterval(interval); return 0; } return c - 1; });
        }, 1000);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="px-8 py-8">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
          style={{ backgroundColor: 'var(--brand-50, #f0f4ff)' }}>
          <Mail size={22} style={{ color: 'var(--brand-500)' }} />
        </div>
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Enter reset code
        </h1>
        <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>{info}</p>
      </div>

      <div className="flex justify-center gap-2 mb-5" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input key={i} ref={el => { inputRefs.current[i] = el; }}
            type="text" inputMode="numeric" maxLength={1}
            value={digit} onChange={e => handleDigitChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            disabled={loading || locked}
            className="text-center text-xl font-bold rounded-xl border outline-none
              transition-all duration-150 focus:ring-2 focus:ring-[var(--brand-500)]
              focus:ring-opacity-30 focus:border-[var(--border-focus)] disabled:opacity-40"
            style={{ width: '44px', height: '52px',
              backgroundColor: 'var(--bg-input)',
              borderColor: digit ? 'var(--brand-500)' : 'var(--border-default)',
              color: 'var(--text-primary)' }}
          />
        ))}
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm border mb-4 text-center"
          style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
          {error}
        </div>
      )}

      <Button className="w-full mb-4" size="lg" loading={loading}
        disabled={otp.some(d => !d) || locked}
        onClick={() => handleVerify(otp.join(''))}>
        Verify code
      </Button>

      <div className="text-center">
        <button onClick={handleResend} disabled={cooldown > 0 || resending}
          className="text-sm font-medium flex items-center gap-1.5 mx-auto transition-opacity
            disabled:opacity-40 disabled:cursor-not-allowed hover:underline"
          style={{ color: 'var(--brand-500)' }}>
          <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </div>
  );
}

// ── Step 3: New password ──────────────────────────────────────────
function StepNewPassword({ resetToken, onSuccess }) {
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [showCPw,   setShowCPw]   = useState(false);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reset failed. Please try again.'); return; }
      onSuccess();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pwInputClass = `w-full rounded-lg border px-3 py-2.5 text-sm outline-none pr-10
    transition-all duration-150 placeholder:text-[var(--text-muted)]
    focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-opacity-20
    focus:border-[var(--border-focus)] border-[var(--border-default)] disabled:opacity-50`;
  const pwInputStyle = { backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' };

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Set new password
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>New password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters"
              value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
              autoComplete="new-password" disabled={loading}
              className={pwInputClass} style={pwInputStyle} />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2" tabIndex={-1}
              style={{ color: 'var(--text-muted)' }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <PasswordStrength password={password} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Confirm password</label>
          <div className="relative">
            <input type={showCPw ? 'text' : 'password'} placeholder="Repeat your password"
              value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }}
              autoComplete="new-password" disabled={loading}
              className={pwInputClass} style={pwInputStyle} />
            <button type="button" onClick={() => setShowCPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2" tabIndex={-1}
              style={{ color: 'var(--text-muted)' }}>
              {showCPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm border"
            style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
          Reset password
        </Button>
      </form>
    </div>
  );
}

// ── Step 4: Success ───────────────────────────────────────────────
function StepSuccess() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.push('/login'), 2500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="px-8 py-10 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: '#f0fdf4' }}>
        <CheckCircle size={28} style={{ color: '#16a34a' }} />
      </div>
      <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Password reset!
      </h1>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Your password has been updated. Redirecting to sign in…
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [step,       setStep]       = useState('email');  // email | otp | newpw | success
  const [email,      setEmail]      = useState('');
  const [resetToken, setResetToken] = useState('');

  if (step === 'success') return <StepSuccess />;

  if (step === 'newpw') {
    return (
      <StepNewPassword
        resetToken={resetToken}
        onSuccess={() => setStep('success')}
      />
    );
  }

  if (step === 'otp') {
    return (
      <StepOTP
        email={email}
        onSuccess={(token) => { setResetToken(token); setStep('newpw'); }}
      />
    );
  }

  return (
    <StepEmail
      onSuccess={(confirmedEmail) => { setEmail(confirmedEmail); setStep('otp'); }}
    />
  );
}
