import { tooManyRequests } from './apiResponse';

const store = new Map(); // ip -> { count, resetAt }
const LIMIT  = 60;       // requests
const WINDOW = 60_000;   // 1 minute in ms

function getIp(req) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

function check(ip) {
  const now  = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW });
    return null; // ok
  }

  if (entry.count >= LIMIT) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return tooManyRequests(retryAfter);
  }

  entry.count++;
  return null; // ok
}

// Cleanup stale entries every 5 minutes to avoid memory leaks
if (typeof globalThis._rlCleanup === 'undefined') {
  globalThis._rlCleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(ip);
    }
  }, 300_000);
}

/**
 * Wrap a route handler with rate limiting.
 * Usage: export const GET = withRateLimit(async (req) => { ... });
 */
export function withRateLimit(handler) {
  return async function (req, ctx) {
    const ip  = getIp(req);
    const err = check(ip);
    if (err) return err;
    return handler(req, ctx);
  };
}

// ── Stricter rate limiter for auth routes ────────────────────────
// Separate store per limit config to avoid key collisions
const authStores = new Map(); // key: "limit:window" -> Map of ip -> {count, resetAt}

function makeAuthStore(key) {
  if (!authStores.has(key)) authStores.set(key, new Map());
  return authStores.get(key);
}

function checkStrict(ip, limit, windowMs) {
  const storeKey = `${limit}:${windowMs}`;
  const store    = makeAuthStore(storeKey);
  const now      = Date.now();
  const entry    = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return tooManyRequests(retryAfter);
  }
  entry.count++;
  return null;
}

// Cleanup auth stores too
if (typeof globalThis._rlAuthCleanup === 'undefined') {
  globalThis._rlAuthCleanup = setInterval(() => {
    const now = Date.now();
    for (const store of authStores.values()) {
      for (const [ip, entry] of store.entries()) {
        if (now > entry.resetAt) store.delete(ip);
      }
    }
  }, 300_000);
}

/**
 * Strict rate limiter for auth endpoints.
 * Default: 5 requests per minute per IP.
 */
export function withAuthRateLimit(handler, limit = 5, windowMs = 60_000) {
  return async function (req, ctx) {
    const ip  = getIp(req);
    const err = checkStrict(ip, limit, windowMs);
    if (err) return err;
    return handler(req, ctx);
  };
}
