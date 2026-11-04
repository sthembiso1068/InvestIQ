import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Alert, Button, Field, inputClass, PasswordField } from '../components/ui';
import { useTitle } from '../hooks/useTitle';
import { confirmPasswordReset, requestPasswordReset } from '../services/api';
import { cx } from '../lib/format';
import { validatePassword } from '../lib/validators';

export default function ForgotPassword() {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  useTitle('Reset password');

  async function requestCode(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await requestPasswordReset(email);
      setResetCode(result.resetCode);
      setEmail(result.email);
      setStep('confirm');
    } catch (err) {
      setError(err.message || 'The reset could not be started.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmReset(event) {
    event.preventDefault();
    setError('');
    setFieldError('');
    if (password !== confirm) {
      setFieldError('Passwords do not match.');
      return;
    }
    const passwordError = validatePassword(password).password;
    if (passwordError) {
      setFieldError(passwordError);
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset({ email, code, password });
      setStep('done');
    } catch (err) {
      setError(err.message || 'The password could not be reset.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      kicker="Password reset"
      title="Reset your"
      accent="password."
      lede="Use the email on the account. The reset code is shown on the next screen so you can choose a new password."
      note="Projected earnings are estimates, not guaranteed returns."
    >
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ember">
        <KeyRound size={14} />
        Password reset
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Reset your password</h2>
      {step === 'request' ? (
        <form className="mt-8 space-y-4" onSubmit={requestCode} noValidate>
          <p className="text-sm leading-6 text-slate-500">Enter the email on your account. The reset code appears on the next screen.</p>
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <Field label="Email address">
            <span className="relative block">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className={cx(inputClass(), 'pl-10')} type="email" autoComplete="email" value={email} placeholder="your@email.co.za" onChange={(event) => setEmail(event.target.value)} />
            </span>
          </Field>
          <Button type="submit" variant="accent" className="w-full rounded-full py-3" loading={loading}>
            Send reset code
          </Button>
        </form>
      ) : null}
      {step === 'confirm' ? (
        <form className="mt-8 space-y-4" onSubmit={confirmReset} noValidate>
          <Alert tone="warning">
            Your reset code is <span className="font-semibold tabular">{resetCode}</span>. It expires in 15 minutes.
          </Alert>
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <Field label="Reset code">
            <input className={inputClass()} inputMode="numeric" value={code} placeholder="6-digit code" onChange={(event) => setCode(event.target.value)} />
          </Field>
          <PasswordField label="New password" autoComplete="new-password" value={password} error={fieldError} onChange={setPassword} />
          <PasswordField label="Confirm new password" autoComplete="new-password" value={confirm} onChange={setConfirm} />
          <Button type="submit" variant="accent" className="w-full rounded-full py-3" loading={loading}>
            Update password
          </Button>
        </form>
      ) : null}
      {step === 'done' ? (
        <Alert tone="success" className="mt-8">
          Your password has been updated. Sign in with the new password.
        </Alert>
      ) : null}
      <p className="mt-6 text-sm text-slate-500">
        <Link to="/login" className="font-semibold text-ink hover:text-ember">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
