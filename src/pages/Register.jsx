import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { Logo } from '../components/Logo';
import { Alert, Button, Field, inputClass, PasswordField } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTitle } from '../hooks/useTitle';
import { GENDERS, INVESTMENT_AMOUNTS, INVESTMENT_OPTIONS, OCCUPATIONS, TITLES } from '../lib/application';
import { cx, formatZAR } from '../lib/format';
import { passwordScore, validateRegistration } from '../lib/validators';

const EMPTY = {
  title: '',
  firstName: '',
  surname: '',
  gender: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  address: '',
  occupation: '',
  investmentAmount: '',
  optionId: '',
  investmentDate: '',
  bankName: '',
  accountNumber: '',
  referralName: '',
  referralNumber: '',
  password: '',
  confirm: '',
};

function ChoiceGroup({ legend, name, options, value, error, onChange }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-700">
        {legend} <span className="text-negative">*</span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const optionValue = option.value ?? option;
          const label = option.label ?? option;
          const selected = value === optionValue;
          return (
            <label key={optionValue} className={cx('flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm', selected ? 'border-gold bg-[#FBF6E4]' : 'border-slate-200')}>
              <input type="radio" name={name} className="accent-navy" checked={selected} onChange={() => onChange(optionValue)} />
              <span className="font-medium text-navy">{label}</span>
            </label>
          );
        })}
      </div>
      {error ? <p className="mt-1 text-sm text-negative">{error}</p> : null}
    </fieldset>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  useTitle('Investment form');
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
      navigate('/wallet', { replace: true });
    } catch (error) {
      setFormError(error.message || 'Registration failed.');
      if (error.fields) setErrors(error.fields);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell wide>
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_16px_40px_rgba(7,24,39,0.08)] ring-1 ring-slate-200">
        <div className="bg-navy px-6 py-8 text-center">
          <Logo className="mx-auto h-16 w-auto" />
          <h1 className="mt-5 text-2xl font-semibold tracking-[0.12em] text-white sm:text-3xl">SV CAPITAL</h1>
          <p className="mt-1 text-sm font-semibold tracking-[0.22em] text-gold">INVESTMENT FORM</p>
        </div>
        <form className="space-y-5 px-5 py-6 sm:px-8" onSubmit={onSubmit} noValidate>
          <p className="text-sm leading-6 text-slate-500">
            Every field is required. An administrator deposits the investment amount you select. You cannot deposit it yourself.
          </p>
          {formError ? <Alert tone="danger">{formError}</Alert> : null}
          <ChoiceGroup legend="1. Title" name="title" options={TITLES} value={form.title} error={errors.title} onChange={(value) => update('title', value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="2. Name" error={errors.firstName}>
              <input className={inputClass(errors.firstName)} value={form.firstName} autoComplete="given-name" onChange={(event) => update('firstName', event.target.value)} />
            </Field>
            <Field label="3. Surname" error={errors.surname}>
              <input className={inputClass(errors.surname)} value={form.surname} autoComplete="family-name" onChange={(event) => update('surname', event.target.value)} />
            </Field>
          </div>
          <ChoiceGroup legend="4. Gender" name="gender" options={GENDERS} value={form.gender} error={errors.gender} onChange={(value) => update('gender', value)} />
          <Field label="5. Date of birth" error={errors.dateOfBirth}>
            <input className={inputClass(errors.dateOfBirth)} type="date" value={form.dateOfBirth} onChange={(event) => update('dateOfBirth', event.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="6. E-mail address" error={errors.email}>
              <input className={inputClass(errors.email)} type="email" autoComplete="email" value={form.email} onChange={(event) => update('email', event.target.value)} />
            </Field>
            <Field label="7. Mobile number" error={errors.phone}>
              <input className={inputClass(errors.phone)} type="tel" autoComplete="tel" placeholder="082 555 0142" value={form.phone} onChange={(event) => update('phone', event.target.value)} />
            </Field>
          </div>
          <Field label="8. Address" error={errors.address}>
            <textarea className={inputClass(errors.address)} rows={3} value={form.address} onChange={(event) => update('address', event.target.value)} />
          </Field>
          <ChoiceGroup legend="9. Occupation" name="occupation" options={OCCUPATIONS} value={form.occupation} error={errors.occupation} onChange={(value) => update('occupation', value)} />
          <ChoiceGroup
            legend="10. Investment amount"
            name="amount"
            options={INVESTMENT_AMOUNTS.map((amount) => ({ value: String(amount), label: formatZAR(amount * 100) }))}
            value={form.investmentAmount}
            error={errors.investmentAmount}
            onChange={(value) => update('investmentAmount', value)}
          />
          <ChoiceGroup
            legend="11. Investment duration"
            name="duration"
            options={INVESTMENT_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
            value={form.optionId}
            error={errors.optionId}
            onChange={(value) => update('optionId', value)}
          />
          <Field label="12. Investment date" error={errors.investmentDate}>
            <input className={inputClass(errors.investmentDate)} type="date" value={form.investmentDate} onChange={(event) => update('investmentDate', event.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="13. Bank name" error={errors.bankName}>
              <input className={inputClass(errors.bankName)} value={form.bankName} onChange={(event) => update('bankName', event.target.value)} />
            </Field>
            <Field label="14. Bank account number" error={errors.accountNumber}>
              <input className={inputClass(errors.accountNumber)} inputMode="numeric" value={form.accountNumber} onChange={(event) => update('accountNumber', event.target.value)} />
            </Field>
            <Field label="15. Referral name" error={errors.referralName}>
              <input className={inputClass(errors.referralName)} value={form.referralName} onChange={(event) => update('referralName', event.target.value)} />
            </Field>
            <Field label="16. Referral number" error={errors.referralNumber}>
              <input className={inputClass(errors.referralNumber)} type="tel" value={form.referralNumber} onChange={(event) => update('referralNumber', event.target.value)} />
            </Field>
          </div>
          <div className="rounded-2xl bg-canvas p-4">
            <p className="text-sm font-semibold text-navy">Account password</p>
            <p className="mt-1 text-sm text-slate-500">You will use this email and password to sign in.</p>
            <div className="mt-4 space-y-4">
              <PasswordField label="Password" name="new-password" autoComplete="new-password" value={form.password} error={errors.password} onChange={(value) => update('password', value)} />
              <div className="flex gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((bar) => (
                  <span key={bar} className={cx('h-1.5 flex-1 rounded-full', score > bar ? 'bg-gold' : 'bg-slate-200')} />
                ))}
              </div>
              <PasswordField label="Confirm password" name="confirm-password" autoComplete="new-password" value={form.confirm} error={errors.confirm} onChange={(value) => update('confirm', value)} />
            </div>
          </div>
          <Button type="submit" className="w-full" loading={loading}>Submit investment form</Button>
        </form>
      </div>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-navy hover:text-[#8A6D1B]">Sign in</Link>
      </p>
    </AuthShell>
  );
}
