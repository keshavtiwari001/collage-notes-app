import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME  = '__session';
const MAX_AGE_SECS = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET env var is not set');
  return secret;
}

/**
 * Signs a payload object → base64url string "data.sig"
 * The payload is JSON-encoded then base64url-encoded, then HMAC'd.
 */
export function signSession(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig  = createHmac('sha256', getSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

/**
 * Verifies a signed session token.
 * Returns the payload object, or null if invalid/tampered.
 */
export function verifySession(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  try {
    const expectedSig = createHmac('sha256', getSecret()).update(data).digest('base64url');
    // Constant-time comparison to prevent timing attacks
    const sigBuf      = Buffer.from(sig,         'base64url');
    const expectedBuf = Buffer.from(expectedSig, 'base64url');
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf))  return null;
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Builds the Set-Cookie header string for the session.
 */
export function buildSessionCookieHeader(token) {
  const isProduction = process.env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${MAX_AGE_SECS}`,
    'Path=/',
  ];
  if (isProduction) parts.push('Secure');
  return parts.join('; ');
}

/**
 * Builds the Set-Cookie header that clears the session.
 */
export function buildClearCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`;
}

/**
 * Reads and verifies the session cookie from a Request object.
 * For use in Route Handlers where you have the request object.
 */
export function getSessionFromRequest(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const token = match.slice(COOKIE_NAME.length + 1);
  return verifySession(token);
}

export { COOKIE_NAME };
