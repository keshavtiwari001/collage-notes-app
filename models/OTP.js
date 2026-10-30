import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  hashedOtp: {
    type:     String,
    required: true,
  },
  type: {
    type:     String,
    enum:     ['email_verification', 'password_reset'],
    required: true,
  },
  expiresAt: {
    type:     Date,
    required: true,
  },
  attempts: {
    type:    Number,
    default: 0,
  },
  maxAttempts: {
    type:    Number,
    default: 5,
  },
  usedAt: {
    type:    Date,
    default: null,
  },
}, { timestamps: true });

// Compound index for efficient lookups
OTPSchema.index({ userId: 1, type: 1 });

// TTL index — MongoDB will automatically delete expired documents
// (adds a buffer of 1 hour after expiry for forensics/debugging)
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

export default mongoose.models.OTP || mongoose.model('OTP', OTPSchema);
