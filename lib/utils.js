/**
 * Convert TipTap JSON to plain text (for TXT export and search)
 */
export function tiptapToText(json) {
  if (!json || !json.content) return '';
  const walk = (nodes) =>
    nodes.map(node => {
      if (node.type === 'text') return node.text || '';
      if (node.content) return walk(node.content);
      return '';
    }).flat().join('');
  return walk(json.content);
}

/**
 * Truncate a string to a max length
 */
export function truncate(str, max = 80) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

/**
 * Format a date to a readable string
 */
export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

/**
 * Debounce a function
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate a friendly error message from an API response
 */
export async function apiError(res) {
  try {
    const data = await res.json();
    return data.error || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}
