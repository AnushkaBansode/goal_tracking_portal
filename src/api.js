/** API base: empty in dev (Vite proxies /api → backend); absolute URL in production builds. */
export const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE || '');

/**
 * Fetch wrapper with consistent logging and error messages.
 * @param {string} path - e.g. "/api/goals"
 * @param {RequestInit} [options]
 * @returns {Promise<{ ok: boolean, status: number, data: unknown, text: string }>}
 */
export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const method = (options.method || 'GET').toUpperCase();

  console.log(`[API] ${method} ${url}`);

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (err) {
    console.error(`[API] Network error — ${method} ${url}:`, err);
    throw new Error('Cannot reach backend');
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    console.error(`[API] ${method} ${url} failed:`, response.status, data);
    const error = new Error('Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  console.log(`[API] ${method} ${url} → ${response.status}`, data);
  return { ok: true, status: response.status, data, text };
}
