import { randomInt, createHash, timingSafeEqual } from 'node:crypto';
import { connectDB } from './mongodb';
import OTP from '../models/OTP';

const OTP_EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS       = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

// ── Core helpers ─────────────────────────────────────────────────

/** Returns a cryptographically random 6-digit OTP string */
export function generateOTP() {
  // randomInt(min, max) is inclusive of min, exclusive of max
  return String(randomInt(100000, 1000000)).padStart(6, '0');
}

/** Returns the SHA-256 hex hash of a plaintext OTP */
export function hashOTP(plainOtp) {
  return createHash('sha256').update(String(plainOtp)).digest('hex');
}

// ── Database operations ──────────────────────────────────────────

/**
 * Creates a new OTP record for a user.
 * Checks resend cooldown first.
 * Returns { otp: string (plaintext), cooldownRemaining: number }
 * If cooldown is active, throws an error.
 */
export async function createOTP(userId, type) {
  await connectDB();

  // Check resend cooldown — find most recent OTP of this type
  const recent = await OTP.findOne({ userId, type })
    .sort({ createdAt: -1 })
    .lean();

  if (recent) {
    const elapsed = Date.now() - new Date(recent.createdAt).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const remainingSecs = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      throw Object.assign(
        new Error(`Please wait ${remainingSecs} second${remainingSecs !== 1 ? 's' : ''} before requesting a new code.`),
        { code: 'COOLDOWN', remainingSecs }
      );
    }
  }

  const plainOtp  = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await OTP.create({
    userId,
    hashedOtp:   hashOTP(plainOtp),
    type,
    expiresAt,
    attempts:    0,
    maxAttempts: MAX_ATTEMPTS,
    usedAt:      null,
  });

  // Return plaintext OTP — caller must send it via email and never persist it
  return plainOtp;
}

/**
 * Verifies a plaintext OTP for a user.
 * Finds the latest unused, non-expired OTP of the given type.
 * Increments attempt counter on every call (valid or not).
 * Marks usedAt on success.
 *
 * Returns one of:
 *   { valid: true }
 *   { valid: false, reason: 'not_found' }
 *   { valid: false, reason: 'expired' }
 *   { valid: false, reason: 'max_attempts' }
 *   { valid: false, reason: 'wrong_code' }
 */
export async function verifyOTP(userId, type, plainOtp) {
  await connectDB();

  // Find the most recent OTP for this user+type that hasn't been used
  const record = await OTP.findOne({
    userId,
    type,
    usedAt: null,
  }).sort({ createdAt: -1 });

  if (!record) return { valid: false, reason: 'not_found' };

  // Check expiry
  if (new Date() > record.expiresAt) {
    return { valid: false, reason: 'expired' };
  }

  // Check attempt limit before incrementing
  if (record.attempts >= record.maxAttempts) {
    return { valid: false, reason: 'max_attempts' };
  }

  // Increment attempts
  record.attempts += 1;

  // Verify hash using timing-safe comparison
  const hashed      = hashOTP(plainOtp);
  const hashBuf     = Buffer.from(hashed,            'hex');
  const storedBuf   = Buffer.from(record.hashedOtp,  'hex');
  const hashesMatch = hashBuf.length === storedBuf.length &&
                      timingSafeEqual(hashBuf, storedBuf);
  if (!hashesMatch) {
    // Check if this increment hit the limit
    if (record.attempts >= record.maxAttempts) {
      await record.save();
      return { valid: false, reason: 'max_attempts' };
    }
    await record.save();
    return { valid: false, reason: 'wrong_code' };
  }

  // Valid — mark as used
  record.usedAt = new Date();
  await record.save();

  return { valid: true };
}

/**
 * Invalidates all unused OTPs of a given type for a user.
 * Call this before creating a new OTP (resend flow) or after
 * a successful password reset.
 */
export async function invalidateOTPs(userId, type) {
  await connectDB();
  await OTP.updateMany(
    { userId, type, usedAt: null },
    { $set: { usedAt: new Date() } }
  );
}

/**
 * Returns seconds remaining on the resend cooldown, or 0 if no cooldown.
 */
export async function getResendCooldown(userId, type) {
  await connectDB();
  const recent = await OTP.findOne({ userId, type })
    .sort({ createdAt: -1 })
    .lean();

  if (!recent) return 0;
  const elapsed = Date.now() - new Date(recent.createdAt).getTime();
  if (elapsed >= RESEND_COOLDOWN_MS) return 0;
  return Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
}
