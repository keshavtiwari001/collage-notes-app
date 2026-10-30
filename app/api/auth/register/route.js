import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { success, error, badRequest } from '@/lib/apiResponse';
import { withAuthRateLimit } from '@/lib/rateLimit';
import { sanitize, validate, required, maxLength, validEmail, validPassword } from '@/lib/validate';
import { createOTP } from '@/lib/otp';
import { sendVerificationOTP } from '@/lib/email';
import User from '@/models/User';

export const POST = withAuthRateLimit(async (req) => {
  try {
    await connectDB();

    const body = await req.json();
    const name  = sanitize(body.name  ?? '');
    const email = sanitize(body.email ?? '').toLowerCase();
    const password = body.password ?? '';  // do NOT sanitize password — preserve special chars

    // Validate
    const err = validate(
      required(name,  'Name'),
      maxLength(name, 100, 'Name'),
      validEmail(email),
      validPassword(password),
    );
    if (err) return badRequest(err);

    // Confirm password match (also checked client-side, but always enforce server-side)
    const confirmPassword = body.confirmPassword ?? '';
    if (password !== confirmPassword) return badRequest('Passwords do not match');

    // Duplicate email check
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return error('An account with this email already exists. Please log in or use a different email.', 409);
    }

    // Hash password — 12 rounds is recommended minimum
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({ name, email, passwordHash, emailVerified: false });

    // Generate and send OTP
    let emailSent = true;
    try {
      const otp = await createOTP(user._id, 'email_verification');
      await sendVerificationOTP(email, name, otp);
    } catch (emailErr) {
      // User is created — don't rollback. They can use resend.
      emailSent = false;
      console.error('[register] OTP/email error:', emailErr.message);
    }

    return success({
      message: emailSent
        ? 'Account created. Please check your email for a verification code.'
        : 'Account created. We could not send the verification email — please use the resend option.',
      userId: user._id.toString(),
      emailSent,
    }, 201);

  } catch (err) {
    console.error('[register] Unexpected error:', err.message);
    return error('Registration failed. Please try again.');
  }
}, 5, 60_000); // 5 registrations per minute per IP
