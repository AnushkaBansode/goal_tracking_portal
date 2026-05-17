/** API base: empty in dev (Vite proxies /api → backend); absolute URL in production builds. */
export const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000');

/**
 * Fetch wrapper with consistent logging and error messages.
 * @param {string} path - e.g. "/api/goals"
 * @param {RequestInit} [options]
 * @returns {Promise<{ ok: boolean, status: number, data: unknown, text: string }>}
 */
export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const method = (options.method || 'GET').toUpperCase();

  if (options.body) {
    try {
      console.log(`[API] ${method} ${url}`, JSON.parse(options.body));
    } catch {
      console.log(`[API] ${method} ${url}`, options.body);
    }
  } else {
    console.log(`[API] ${method} ${url}`);
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch (err) {
    console.error(`[API] Network error — ${method} ${url}:`, err);
    throw new Error(
      err.message === 'Failed to fetch'
        ? 'Cannot reach backend. Start the server: cd backend && npm start'
        : err.message
    );
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
    const message =
      (data && typeof data === 'object' && data.error) ||
      `Request failed (${response.status})`;
    console.error(`[API] ${method} ${url} failed:`, response.status, data);
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  console.log(`[API] ${method} ${url} → ${response.status}`);
  return { ok: true, status: response.status, data, text };
}
