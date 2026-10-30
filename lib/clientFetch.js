/**
 * A wrapper around fetch() for client-side data calls.
 * Automatically redirects to /login if the server returns 401
 * (e.g. session expired or cookie missing).
 *
 * Drop-in replacement for fetch() in client components.
 */
export async function clientFetch(url, options = {}) {
  const response = await fetch(url, options);

  if (response.status === 401) {
    // Session expired or invalid — redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    // Return the response so callers don't crash on the redirect
    return response;
  }

  return response;
}
