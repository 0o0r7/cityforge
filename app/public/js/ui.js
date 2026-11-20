// Small presentation helpers shared by every view.

const SEAT_COLORS = ['#ff9f45', '#79c0ff', '#7dd3a0', '#c9a2ff'];

export function esc(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
}

export const seatColor = (index) => SEAT_COLORS[index % SEAT_COLORS.length];
export const seatName = (index, names) => (names?.[index] ? String(names[index]) : `P${index + 1}`);

export const money = (value) => Number(value ?? 0).toLocaleString('en-US');

export function short(value, size = 12) {
  if (!value) return '—';
  const text = String(value);
  return text.length <= size + 8 ? text : `${text.slice(0, size)}…${text.slice(-6)}`;
}

export function toast(message, kind = '') {
  const host = document.getElementById('toasts');
  if (!host) return;
  const node = document.createElement('div');
  node.className = `toast ${kind}`.trim();
  node.textContent = message;
  host.append(node);
  setTimeout(() => node.remove(), 3600);
}
