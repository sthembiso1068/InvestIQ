export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function formatZAR(cents, { signed = false } = {}) {
  const value = Number(cents) || 0;
  const negative = value < 0;
  const formatted = (Math.abs(value) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = signed && value > 0 ? '+' : negative ? '-' : '';
  return `${sign}R ${formatted}`;
}

export function parseRandToCents(input) {
  const cleaned = String(input ?? '').trim().replace(/[R\s,]/gi, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ''] = cleaned.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatLongDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || 'there';
}

export function byNewest(field = 'createdAt') {
  return (a, b) => new Date(b[field]).getTime() - new Date(a[field]).getTime();
}

export function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return Number.isInteger(number) ? `${number}%` : `${number.toFixed(1)}%`;
}

export function completionLabel(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return 'Completion date pending';
  if (ms <= 0) return 'Completion reached';
  const days = Math.ceil(ms / 86400000);
  if (days === 1) return 'Completes in 1 day';
  return `Completes in ${days} days`;
}

export function progressPercent(startedAt, completesAt) {
  const start = new Date(startedAt).getTime();
  const end = new Date(completesAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.max(0, Math.min(100, ((Date.now() - start) / (end - start)) * 100));
}

export function maskAccount(number) {
  const digits = String(number ?? '').replace(/\D/g, '');
  return `•••• ${digits.slice(-4) || '0000'}`;
}

export function compactZAR(cents) {
  const rand = (Number(cents) || 0) / 100;
  const sign = rand < 0 ? '-' : '';
  const abs = Math.abs(rand);
  if (abs >= 1000) {
    const scaled = abs / 1000;
    const text = scaled >= 10 ? scaled.toFixed(0) : scaled.toFixed(1).replace(/\.0$/, '');
    return `${sign}R ${text}k`;
  }
  return `${sign}R ${abs.toFixed(0)}`;
}
