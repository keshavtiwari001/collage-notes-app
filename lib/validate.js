import mongoose from 'mongoose';

// Strip HTML tags and trim
export function sanitize(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/<[^>]*>/g, '').trim();
}

// Validators — return error string or null
export function required(value, fieldName = 'Field') {
  const v = typeof value === 'string' ? value.trim() : value;
  if (!v && v !== 0) return `${fieldName} is required`;
  return null;
}

export function maxLength(value, n, fieldName = 'Field') {
  if (typeof value === 'string' && value.trim().length > n)
    return `${fieldName} must be ${n} characters or fewer`;
  return null;
}

export function mongoId(value, fieldName = 'ID') {
  if (!mongoose.isValidObjectId(value))
    return `${fieldName} is not a valid identifier`;
  return null;
}

// Collect multiple validation errors, return first or null
export function validate(...checks) {
  for (const err of checks) {
    if (err) return err;
  }
  return null;
}

// Email format check
export function validEmail(value, fieldName = 'Email') {
  if (!value || typeof value !== 'string') return `${fieldName} is required`;
  const trimmed = value.trim();
  // RFC 5322 simplified — catches most invalid emails
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return `${fieldName} must be a valid email address`;
  return null;
}

// Password strength: min 8 chars, 1 uppercase, 1 lowercase, 1 digit
export function validPassword(value, fieldName = 'Password') {
  if (!value || typeof value !== 'string') return `${fieldName} is required`;
  if (value.length < 8)          return `${fieldName} must be at least 8 characters`;
  if (!/[A-Z]/.test(value))      return `${fieldName} must contain at least one uppercase letter`;
  if (!/[a-z]/.test(value))      return `${fieldName} must contain at least one lowercase letter`;
  if (!/[0-9]/.test(value))      return `${fieldName} must contain at least one number`;
  return null;
}
