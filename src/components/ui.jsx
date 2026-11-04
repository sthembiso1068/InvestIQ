import { useState } from 'react';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import { cx, formatZAR, initials } from '../lib/format';
import { statusLabel } from '../lib/present';

export function Button({ variant = 'primary', loading = false, children, className = '', disabled, ...props }) {
  const variants = {
    primary: 'bg-ember text-white hover:bg-[#ff8a1e]',
    accent: 'bg-gradient-to-r from-[#ff8a1e] to-[#ff5a00] text-white shadow-[0_10px_24px_rgba(255,106,0,0.28)] hover:from-[#ff9a3c] hover:to-[#ff6a12]',
    secondary: 'bg-navy text-white hover:bg-deep',
    outline: 'border border-slate-200 bg-white text-navy hover:bg-slate-50',
    danger: 'bg-negative text-white hover:bg-red-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={16} />}
      {children}
    </button>
  );
}

export function inputClass(error) {
  return cx(
    'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition placeholder:text-slate-400 focus:ring-2',
    error ? 'border-negative focus:border-negative focus:ring-negative/20' : 'border-slate-200 focus:border-ember focus:ring-ember/25',
  );
}

export function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-sm text-negative">{error}</span> : null}
      {!error && hint ? <span className="mt-1.5 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function PasswordField({ label, value, onChange, error, autoComplete, name, placeholder = 'Enter your password' }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} error={error}>
      <span className="relative block">
        <input
          className={cx(inputClass(error), 'pr-11')}
          type={visible ? 'text' : 'password'}
          value={value}
          name={name}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </Field>
  );
}

const ALERTS = {
  info: 'bg-sky-50 text-sky-950 ring-sky-100',
  success: 'bg-emerald-50 text-emerald-950 ring-emerald-100',
  danger: 'bg-red-50 text-red-800 ring-red-100',
  warning: 'bg-amber-50 text-amber-950 ring-amber-100',
  note: 'bg-[#fff4ec] text-[#9a3412] ring-[#ffd7b8]',
};

export function Alert({ tone = 'info', children, className = '' }) {
  return <div className={cx('rounded-2xl px-4 py-3 text-sm ring-1', ALERTS[tone], className)}>{children}</div>;
}

export function Disclaimer({ className = '' }) {
  return (
    <Alert tone="note" className={className}>
      <strong className="font-semibold">Estimate only.</strong> Projected earnings are estimates, not guaranteed returns or verified trading results.
    </Alert>
  );
}

export function Card({ className = '', children }) {
  const painted = /(^|\s)!?bg-/.test(className);
  return (
    <section className={cx('rounded-2xl border-0 shadow-[0_8px_30px_rgba(7,24,39,0.05)]', painted ? '' : 'bg-white', className)}>
      {children}
    </section>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Avatar({ name, src, size = 'md' }) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-3xl',
  };
  if (src) {
    return <img src={src} alt="" className={cx(sizes[size], 'rounded-full object-cover ring-2 ring-white')} />;
  }
  return (
    <span className={cx(sizes[size], 'inline-flex items-center justify-center rounded-full bg-ember font-bold text-white')}>
      {initials(name) || 'SV'}
    </span>
  );
}

const MONEY_TONE = {
  positive: 'text-positive',
  negative: 'text-negative',
  muted: 'text-slate-400',
  neutral: 'text-navy',
  gold: 'text-gold',
  white: 'text-white',
};

export function Money({ cents, signed = false, tone = 'neutral', className = '' }) {
  return <span className={cx('tabular', MONEY_TONE[tone] || MONEY_TONE.neutral, className)}>{formatZAR(cents, { signed })}</span>;
}

const PILL = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  processing: 'bg-sky-50 text-sky-800 ring-sky-200',
  approved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
  active: 'bg-[#fff4ec] text-[#c2410c] ring-[#ffd7b8]',
  suspended: 'bg-red-50 text-red-700 ring-red-200',
  closed: 'bg-slate-100 text-slate-600 ring-slate-200',
  available: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  awaiting: 'bg-[#fff4ec] text-[#c2410c] ring-[#ffd7b8]',
};

export function StatusPill({ status }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1', PILL[status] || PILL.closed)}>
      {statusLabel(status)}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="px-6 py-12 text-center">
      {Icon ? (
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-navy">
          <Icon size={22} />
        </div>
      ) : null}
      <h3 className="mt-4 text-base font-semibold text-navy">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-navy/60" aria-label="Close dialog" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-navy">{title}</h2>
          <button type="button" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-navy" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {footer ? <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={cx('animate-pulse rounded-xl bg-slate-200/80', className)} />;
}

export function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-navy">
      <div className="text-center">
        <img src="/brand/sv-capital-logo.png" alt="SV Capital" className="mx-auto h-14 w-auto" />
        <div className="mx-auto mt-6 h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      </div>
    </div>
  );
}

export function formatMoneyText(cents, options) {
  return formatZAR(cents, options);
}
