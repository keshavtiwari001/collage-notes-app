import nodemailer from 'nodemailer';

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

const FROM = () => process.env.EMAIL_FROM || 'Academica <no-reply@academica.app>';

// ── Shared HTML wrapper ─────────────────────────────────────────
function htmlWrapper(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; background:#f8f9fb; font-family:'Helvetica Neue',Arial,sans-serif; color:#18181b; }
    .wrap { max-width:480px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e4e4e7; }
    .header { background:#3b6ef6; padding:32px 40px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:22px; font-weight:700; letter-spacing:-0.3px; }
    .body { padding:36px 40px; }
    .body p { margin:0 0 16px; font-size:15px; line-height:1.6; color:#3f3f46; }
    .otp-box { background:#f4f4f5; border-radius:10px; padding:20px; text-align:center; margin:24px 0; }
    .otp-code { font-size:36px; font-weight:700; letter-spacing:10px; color:#18181b; font-family:'Courier New',monospace; }
    .otp-note { font-size:13px; color:#71717a; margin-top:8px; }
    .footer { padding:20px 40px; border-top:1px solid #e4e4e7; text-align:center; }
    .footer p { font-size:12px; color:#a1a1aa; margin:0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header"><h1>Academica</h1></div>
    <div class="body">${bodyHtml}</div>
    <div class="footer"><p>If you didn't request this, you can safely ignore this email.</p></div>
  </div>
</body>
</html>`;
}

// ── Send verification OTP ───────────────────────────────────────
export async function sendVerificationOTP(to, name, otp) {
  const html = htmlWrapper('Verify your email — Academica', `
    <p>Hi <strong>${escHtml(name)}</strong>,</p>
    <p>Welcome to Academica! Please verify your email address using the code below:</p>
    <div class="otp-box">
      <div class="otp-code">${escHtml(otp)}</div>
      <div class="otp-note">This code expires in 15 minutes.</div>
    </div>
    <p>Enter this code on the verification page to activate your account.</p>
  `);

  try {
    const transport = createTransport();
    await transport.sendMail({
      from:    FROM(),
      to,
      subject: 'Verify your Academica account',
      html,
      text: `Hi ${name},\n\nYour Academica verification code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you didn't create an account, ignore this email.`,
    });
  } catch (err) {
    console.error('[email] Failed to send verification OTP:', err.message);
    throw new Error('Failed to send verification email. Please try again.');
  }
}

// ── Send password reset OTP ─────────────────────────────────────
export async function sendPasswordResetOTP(to, name, otp) {
  const html = htmlWrapper('Reset your password — Academica', `
    <p>Hi <strong>${escHtml(name)}</strong>,</p>
    <p>We received a request to reset your Academica password. Use the code below:</p>
    <div class="otp-box">
      <div class="otp-code">${escHtml(otp)}</div>
      <div class="otp-note">This code expires in 15 minutes.</div>
    </div>
    <p>Enter this code on the password reset page to choose a new password.</p>
    <p>If you didn't request a password reset, your account is safe — just ignore this email.</p>
  `);

  try {
    const transport = createTransport();
    await transport.sendMail({
      from:    FROM(),
      to,
      subject: 'Reset your Academica password',
      html,
      text: `Hi ${name},\n\nYour Academica password reset code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, ignore this email.`,
    });
  } catch (err) {
    console.error('[email] Failed to send password reset OTP:', err.message);
    throw new Error('Failed to send password reset email. Please try again.');
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
