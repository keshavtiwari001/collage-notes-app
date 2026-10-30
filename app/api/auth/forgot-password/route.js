import { connectDB } from '@/lib/mongodb';
import { success, error } from '@/lib/apiResponse';
import { withAuthRateLimit } from '@/lib/rateLimit';
import { sanitize, validEmail } from '@/lib/validate';
import { invalidateOTPs, createOTP } from '@/lib/otp';
import { sendPasswordResetOTP } from '@/lib/email';
import User from '@/models/User';

// Constant-time response to prevent user enumeration via timing
const SAFE_RESPONSE = {
  message: 'If an account with that email exists, a reset code has been sent.',
};

export const POST = withAuthRateLimit(async (req) => {
  try {
    await connectDB();

    const body  = await req.json();
    const email = sanitize(body.email ?? '').toLowerCase();

    const emailErr = validEmail(email);
    if (emailErr) return error(emailErr, 400);

    const user = await User.findOne({ email }).select('email name emailVerified');

    if (!user || !user.emailVerified) {
      // Artificial delay to match real path timing (prevents timing-based enumeration)
      await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
      return success(SAFE_RESPONSE);
    }

    // Invalidate any existing reset OTPs before creating a new one
    await invalidateOTPs(user._id, 'password_reset');

    try {
      const otp = await createOTP(user._id, 'password_reset');
      await sendPasswordResetOTP(user.email, user.name, otp);
    } catch (otpErr) {
      // Cooldown or email failure — still return safe response
      if (otpErr.code !== 'COOLDOWN') {
        console.error('[forgot-password] OTP/email error:', otpErr.message);
      }
    }

    return success(SAFE_RESPONSE);
  } catch (err) {
    console.error('[forgot-password]', err.message);
    return error('Something went wrong. Please try again.');
  }
}, 5, 60_000);
