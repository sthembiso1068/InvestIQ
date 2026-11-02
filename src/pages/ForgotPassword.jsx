import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { Alert, Button, Field, inputClass, PasswordField } from '../components/ui';
import { useTitle } from '../hooks/useTitle';
import { confirmPasswordReset, requestPasswordReset } from '../services/api';
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
    <AuthShell>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A6D1B]">Account recovery</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy">Reset your password</h1>
      {step === 'request' ? (
        <form className="mt-8 space-y-4" onSubmit={requestCode} noValidate>
          <p className="text-sm leading-6 text-slate-500">Enter the email on your account. The reset code will appear on this screen.</p>
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <Field label="Email address">
            <input className={inputClass()} type="email" autoComplete="email" value={email} placeholder="name@email.com" onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Button type="submit" className="w-full" loading={loading}>
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
          <Button type="submit" className="w-full" loading={loading}>
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
        <Link to="/login" className="font-semibold text-navy hover:text-[#8A6D1B]">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
