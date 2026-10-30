import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { connectDB } from '@/lib/mongodb';
import { success, error, badRequest } from '@/lib/apiResponse';
import { withAuthRateLimit } from '@/lib/rateLimit';
import { sanitize, validPassword } from '@/lib/validate';
import { invalidateOTPs } from '@/lib/otp';
import User from '@/models/User';

export const POST = withAuthRateLimit(async (req) => {
  try {
    await connectDB();

    const body       = await req.json();
    const resetToken = sanitize(body.resetToken ?? '');
    const newPassword = body.newPassword ?? ''; // do NOT sanitize — preserve special chars

    if (!resetToken) return badRequest('Reset token is required.');

    const pwErr = validPassword(newPassword);
    if (pwErr) return badRequest(pwErr);

    // Hash the incoming token to compare against stored hash
    const hashedToken = createHash('sha256').update(resetToken).digest('hex');

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      resetToken:           hashedToken,
      resetTokenExpiresAt:  { $gt: new Date() },
    });

    if (!user) {
      return error('Invalid or expired reset link. Please request a new password reset.', 400);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token atomically
    await User.updateOne(
      { _id: user._id },
      {
        passwordHash,
        resetToken:          null,
        resetTokenExpiresAt: null,
      }
    );

    // Invalidate all remaining password_reset OTPs for this user
    await invalidateOTPs(user._id, 'password_reset');

    // Do NOT issue a session — require fresh login for security
    return success({
      message: 'Password reset successfully. Please log in with your new password.',
    });

  } catch (err) {
    console.error('[reset-password]', err.message);
    return error('Something went wrong. Please try again.');
  }
}, 5, 60_000);
