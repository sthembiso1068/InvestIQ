import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { Alert, Button, Field, inputClass, PasswordField } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTitle } from '../hooks/useTitle';
import { cx } from '../lib/format';
import { passwordScore, validateRegistration } from '../lib/validators';

const EMPTY = { name: '', email: '', phone: '', password: '', confirm: '' };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  useTitle('Register');
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const score = passwordScore(form.password);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = validateRegistration(form);
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (error) {
      setFormError(error.message || 'Registration failed.');
      if (error.fields) setErrors(error.fields);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A6D1B]">New client</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy">Create your account</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Your account starts with a zero balance. Only you can see its records.</p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        {formError ? <Alert tone="danger">{formError}</Alert> : null}
        <Field label="Full name" error={errors.name}>
          <input className={inputClass(errors.name)} value={form.name} autoComplete="name" placeholder="Thabo Mokoena" onChange={(event) => update('name', event.target.value)} />
        </Field>
        <Field label="Email address" error={errors.email}>
          <input className={inputClass(errors.email)} type="email" autoComplete="email" placeholder="name@email.com" value={form.email} onChange={(event) => update('email', event.target.value)} />
        </Field>
        <Field label="Phone number" error={errors.phone} hint="South African mobile or landline.">
          <input className={inputClass(errors.phone)} type="tel" autoComplete="tel" placeholder="+27 82 555 0142" value={form.phone} onChange={(event) => update('phone', event.target.value)} />
        </Field>
        <PasswordField label="Password" name="new-password" autoComplete="new-password" value={form.password} error={errors.password} onChange={(value) => update('password', value)} />
        <div className="flex gap-1" aria-hidden="true">
          {[0, 1, 2, 3].map((bar) => (
            <span key={bar} className={cx('h-1.5 flex-1 rounded-full', score > bar ? 'bg-gold' : 'bg-slate-200')} />
          ))}
        </div>
        <PasswordField label="Confirm password" name="confirm-password" autoComplete="new-password" value={form.confirm} error={errors.confirm} onChange={(value) => update('confirm', value)} />
        <Button type="submit" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-navy hover:text-[#8A6D1B]">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
