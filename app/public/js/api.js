// Thin JSON client. Every rule lives on the server; this file only moves bytes.

export async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'content-type': 'application/json' },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export const post = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body ?? {}) });

let boardCache = null;

/** The 16 tiles never change, so fetch them once per page load. */
export async function board() {
  if (!boardCache) boardCache = await api('/api/board');
  return boardCache;
}

let circuitCache = null;

export async function circuit() {
  if (!circuitCache) circuitCache = await api('/api/circuit');
  return circuitCache;
}
