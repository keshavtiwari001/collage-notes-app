import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession, COOKIE_NAME } from './session';

/**
 * Returns the verified session payload from the current request context,
 * or null if not authenticated / session is invalid.
 *
 * Safe to call from Route Handlers, Server Components, and Server Actions.
 * Never trusts any client-supplied userId.
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/**
 * Like getSession(), but redirects to /login if not authenticated.
 * Use in Server Components / Server Actions that require auth.
 * Returns the session payload (guaranteed non-null).
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

/**
 * Redirect authenticated users away from auth pages (login, register, etc.)
 * Use at the top of /login, /register pages.
 */
export async function redirectIfAuthenticated(destination = '/') {
  const session = await getSession();
  if (session) redirect(destination);
}
