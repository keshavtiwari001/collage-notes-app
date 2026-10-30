import { randomBytes, createHash } from 'node:crypto';
import { connectDB } from '@/lib/mongodb';
import { success, error, badRequest } from '@/lib/apiResponse';
import { withAuthRateLimit } from '@/lib/rateLimit';
import { sanitize, validEmail } from '@/lib/validate';
import { verifyOTP } from '@/lib/otp';
import User from '@/models/User';

// Generic message — never reveal whether email/OTP is valid specifically
const GENERIC_ERR = 'Invalid or expired reset code. Please request a new one.';

export const POST = withAuthRateLimit(async (req) => {
  try {
    await connectDB();

    const body  = await req.json();
    const email = sanitize(body.email ?? '').toLowerCase();
    const otp   = sanitize(body.otp   ?? '').replace(/\s/g, '');

    if (validEmail(email)) return error(GENERIC_ERR, 400);
    if (!/^\d{6}$/.test(otp)) return badRequest('Reset code must be 6 digits.');

    const user = await User.findOne({ email }).select('email emailVerified');
    if (!user) {
      // Artificial delay, then generic error — don't reveal email existence
      await new Promise(r => setTimeout(r, 250 + Math.random() * 150));
      return error(GENERIC_ERR, 400);
    }

    const result = await verifyOTP(user._id, 'password_reset', otp);

    if (!result.valid) {
      const status = result.reason === 'max_attempts' ? 429 : 400;
      return error(GENERIC_ERR, status);
    }

    // OTP valid — generate a one-time reset token (32 random bytes → hex)
    const plainToken  = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(plainToken).digest('hex');
    const expiresAt   = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store ONLY the hash — never the plaintext
    await User.updateOne(
      { _id: user._id },
      { resetToken: hashedToken, resetTokenExpiresAt: expiresAt }
    );

    // Return the plaintext token to the client (one-time use)
    return success({ resetToken: plainToken });

  } catch (err) {
    console.error('[verify-reset-otp]', err.message);
    return error('Something went wrong. Please try again.');
  }
}, 10, 60_000);
