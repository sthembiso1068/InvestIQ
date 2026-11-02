import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { Alert, Button, Field, inputClass, PasswordField } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTitle } from '../hooks/useTitle';
import { rememberedEmail } from '../services/api';
import { validateLogin } from '../lib/validators';

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
    <AuthShell>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A6D1B]">Welcome back</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy">Sign in to your account</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Use the email and password for your SV Capital account.</p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        {formError ? <Alert tone="danger">{formError}</Alert> : null}
        <Field label="Email address" error={errors.email}>
          <input
            className={inputClass(errors.email)}
            type="email"
            autoComplete="email"
            placeholder="name@email.com"
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
          />
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
              className="h-4 w-4 rounded border-slate-300 text-navy accent-navy"
              checked={form.remember}
              onChange={(event) => update('remember', event.target.checked)}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-semibold text-navy hover:text-[#8A6D1B]">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        New client?{' '}
        <Link to="/register" className="font-semibold text-navy hover:text-[#8A6D1B]">
          Register an account
        </Link>
      </p>
      <div className="mt-8 rounded-2xl border border-dashed border-[#E6D7A2] bg-[#FBF6E4] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5B10]">Administrator</p>
        <div className="mt-3 grid gap-2">
          {SAMPLES.map((sample) => (
            <button
              key={sample.email}
              type="button"
              className="rounded-xl bg-white px-3 py-2 text-left ring-1 ring-[#E6D7A2] hover:ring-gold"
              onClick={() => setForm({ email: sample.email, password: sample.password, remember: true })}
            >
              <span className="block text-sm font-semibold text-navy">{sample.label}</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {sample.hint} · {sample.email}
              </span>
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
