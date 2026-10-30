import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { error, badRequest } from '@/lib/apiResponse';
import { withAuthRateLimit } from '@/lib/rateLimit';
import { sanitize, validate, validEmail, required } from '@/lib/validate';
import { signSession, buildSessionCookieHeader } from '@/lib/session';
import User from '@/models/User';

export const POST = withAuthRateLimit(async (req) => {
  try {
    await connectDB();

    const body     = await req.json();
    const email    = sanitize(body.email    ?? '').toLowerCase();
    const password = body.password ?? ''; // do NOT sanitize — preserves special chars

    const err = validate(
      validEmail(email),
      required(password, 'Password'),
    );
    if (err) return badRequest(err);

    // Look up user — always run bcrypt compare even if not found to prevent timing attacks
    const user = await User.findOne({ email });

    // Generic message — never reveal whether email exists
    const GENERIC = 'Invalid email or password.';

    if (!user) {
      // Run a dummy compare to equalise timing
      await bcrypt.compare(password, '$2b$12$dummyhashfortimingprotectiononly..........');
      return error(GENERIC, 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) return error(GENERIC, 401);

    // Email not verified — tell client to redirect to verification
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error:             'Please verify your email before logging in.',
          needsVerification: true,
          userId:            user._id.toString(),
        },
        { status: 403 }
      );
    }

    // All good — issue session
    const token  = signSession({ userId: user._id.toString(), email: user.email });
    const cookie = buildSessionCookieHeader(token);

    const response = NextResponse.json(
      { user: user.toSafeObject() },
      { status: 200 }
    );
    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (err) {
    console.error('[login]', err.message);
    return error('Login failed. Please try again.');
  }
}, 10, 60_000); // 10 attempts per minute per IP
