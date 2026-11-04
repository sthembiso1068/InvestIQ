import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Alert, Button, Field, inputClass, PasswordField } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTitle } from '../hooks/useTitle';
import { rememberedEmail } from '../services/api';
import { validateLogin } from '../lib/validators';
import { cx } from '../lib/format';

const SAMPLES = [
  { label: 'Administrator', email: 'admin@svcapital.co.za', password: 'Admin@12345', hint: 'Nomsa Dlamini' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  useTitle('Sign in');
  const [form, setForm] = useState({ email: rememberedEmail(), password: '', remember: Boolean(rememberedEmail()) });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = validateLogin(form);
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      const account = await login(form.email, form.password, form.remember);
      navigate(account.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (error) {
      setFormError(error.message || 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      kicker="Investor platform"
      title="Welcome back to your"
      accent="account."
      lede="Sign in to see the amount on your form, the option you selected, and the ledger behind it."
      note="Projected earnings are estimates, not guaranteed returns. An administrator deposits the amount on the investment form."
    >
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ember">
        <LockKeyhole size={14} />
        Secure access
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Sign in to your account</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">Enter the email and password for your account.</p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        {formError ? <Alert tone="danger">{formError}</Alert> : null}
        <Field label="Email address" error={errors.email}>
          <span className="relative block">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={cx(inputClass(errors.email), 'pl-10')}
              type="email"
              autoComplete="email"
              placeholder="your@email.co.za"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
            />
          </span>
        </Field>
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          value={form.password}
          error={errors.password}
          onChange={(value) => update('password', value)}
        />
        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 accent-[#ff6a00]"
              checked={form.remember}
              onChange={(event) => update('remember', event.target.checked)}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-semibold text-ink hover:text-ember">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" variant="accent" className="w-full rounded-full py-3" loading={loading}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        New client?{' '}
        <Link to="/register" className="font-semibold text-ember">
          Create your account
        </Link>
      </p>
      <div className="mt-8 border-t border-slate-100 pt-5">
        {SAMPLES.map((sample) => (
          <button
            key={sample.email}
            type="button"
            className="text-left text-sm text-slate-500 hover:text-ink"
            onClick={() => setForm({ email: sample.email, password: sample.password, remember: true })}
          >
            <span className="font-semibold text-ink">{sample.label}</span>
            <span className="mt-0.5 block text-xs">{sample.hint} · {sample.email}</span>
          </button>
        ))}
      </div>
    </AuthShell>
  );
}
