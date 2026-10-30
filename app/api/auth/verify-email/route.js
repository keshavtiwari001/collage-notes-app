import { connectDB } from '@/lib/mongodb';
import { success, error, badRequest } from '@/lib/apiResponse';
import { withAuthRateLimit } from '@/lib/rateLimit';
import { validate, mongoId, required, sanitize } from '@/lib/validate';
import { verifyOTP } from '@/lib/otp';
import { signSession, buildSessionCookieHeader } from '@/lib/session';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export const POST = withAuthRateLimit(async (req) => {
  try {
    await connectDB();

    const body   = await req.json();
    const userId = sanitize(body.userId ?? '');
    const otp    = sanitize(body.otp    ?? '').replace(/\s/g, '');

    const err = validate(
      mongoId(userId, 'User ID'),
      required(otp, 'Verification code'),
    );
    if (err) return badRequest(err);

    if (!/^\d{6}$/.test(otp)) return badRequest('Verification code must be 6 digits');

    // Verify the OTP — lib/otp.js handles all the security checks
    const result = await verifyOTP(userId, 'email_verification', otp);

    if (!result.valid) {
      const messages = {
        not_found:    'No verification code found. Please request a new one.',
        expired:      'This code has expired. Please request a new one.',
        max_attempts: 'Too many incorrect attempts. Please request a new verification code.',
        wrong_code:   'Incorrect code. Please check your email and try again.',
      };
      const status = result.reason === 'max_attempts' ? 429 : 400;
      return error(messages[result.reason] ?? 'Invalid verification code.', status);
    }

    // Fetch user — check if already verified BEFORE updating
    const existingUser = await User.findById(userId);
    if (!existingUser) return error('User not found.', 404);

    if (existingUser.emailVerified) {
      // Already verified — don't re-issue session, redirect them to login
      return error('This email is already verified. Please log in.', 400);
    }

    // Mark user as verified
    existingUser.emailVerified   = true;
    existingUser.emailVerifiedAt = new Date();
    await existingUser.save();

    // Issue session cookie
    const token  = signSession({ userId: existingUser._id.toString(), email: existingUser.email });
    const cookie = buildSessionCookieHeader(token);

    const response = NextResponse.json(
      { message: 'Email verified. Welcome to Academica!', user: existingUser.toSafeObject() },
      { status: 200 }
    );
    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (err) {
    console.error('[verify-email]', err.message);
    return error('Verification failed. Please try again.');
  }
}, 10, 60_000); // 10 attempts per minute per IP (OTP model enforces the real limit)
