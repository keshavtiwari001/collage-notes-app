import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: {
    type:     String,
    required: true,
    unique:   true,
    trim:     true,
    lowercase: true,
    maxlength: 254,
  },
  passwordHash: {
    type:     String,
    required: true,
  },
  name: {
    type:     String,
    required: true,
    trim:     true,
    maxlength: 100,
  },
  emailVerified: {
    type:    Boolean,
    default: false,
  },
  emailVerifiedAt: {
    type:    Date,
    default: null,
  },
  // Password reset — store hashed token only, never plaintext
  resetToken: {
    type:    String,
    default: null,
  },
  resetTokenExpiresAt: {
    type:    Date,
    default: null,
  },
}, { timestamps: true });

// Never accidentally serialise the password hash
UserSchema.methods.toSafeObject = function () {
  return {
    _id:             this._id,
    email:           this.email,
    name:            this.name,
    emailVerified:   this.emailVerified,
    emailVerifiedAt: this.emailVerifiedAt,
    createdAt:       this.createdAt,
  };
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
