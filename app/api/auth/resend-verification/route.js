import { connectDB } from '@/lib/mongodb';
import { success, error, badRequest } from '@/lib/apiResponse';
import { withAuthRateLimit } from '@/lib/rateLimit';
import { validate, mongoId, sanitize } from '@/lib/validate';
import { createOTP, invalidateOTPs } from '@/lib/otp';
import { sendVerificationOTP } from '@/lib/email';
import User from '@/models/User';

export const POST = withAuthRateLimit(async (req) => {
  try {
    await connectDB();

    const body   = await req.json();
    const userId = sanitize(body.userId ?? '');

    const err = validate(mongoId(userId, 'User ID'));
    if (err) return badRequest(err);

    // Look up user
    const user = await User.findById(userId)
      .select('email name emailVerified')
      .lean();
    if (!user) {
      // Don't reveal whether the userId exists — return same message
      return success({ message: 'If this account exists and is unverified, a new code has been sent.' });
    }

    if (user.emailVerified) {
      // Don't reveal verification status to a potential attacker with a guessed userId
      return success({ message: 'If this account exists and is unverified, a new code has been sent.' });
    }

    // Invalidate previous OTPs before creating new one
    await invalidateOTPs(userId, 'email_verification');

    // createOTP throws with code 'COOLDOWN' if too soon
    let otp;
    try {
      otp = await createOTP(userId, 'email_verification');
    } catch (cooldownErr) {
      if (cooldownErr.code === 'COOLDOWN') {
        return error(cooldownErr.message, 429);
      }
      throw cooldownErr;
    }

    await sendVerificationOTP(user.email, user.name, otp);

    return success({ message: 'A new verification code has been sent to your email.' });

  } catch (err) {
    console.error('[resend-verification]', err.message);
    return error('Failed to resend verification code. Please try again.');
  }
}, 4, 60_000); // 4 resends per minute per IP
