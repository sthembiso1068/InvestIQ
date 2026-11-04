import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarRange, Landmark, ShieldCheck } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Alert, Button, Field, inputClass, PasswordField } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTitle } from '../hooks/useTitle';
import { BANKS, GENDERS, INVESTMENT_AMOUNTS, INVESTMENT_OPTIONS, OCCUPATIONS, TITLES } from '../lib/application';
import { cx, formatZAR } from '../lib/format';
import { passwordScore, validateRegistration } from '../lib/validators';
import { DEFAULT_PROFIT_PERCENTS, illustratedPayoutCents } from '../services/ledger';

const EMPTY = {
  title: '',
  firstName: '',
  surname: '',
  gender: '',
  dateOfBirth: '',
  idNumber: '',
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

const STEPS = [
  { id: 'contact', label: 'Contact', fields: ['title', 'firstName', 'surname', 'email', 'phone', 'password', 'confirm'] },
  { id: 'identity', label: 'Identity', fields: ['gender', 'dateOfBirth', 'idNumber'] },
  { id: 'address', label: 'Address', fields: ['address', 'occupation'] },
  { id: 'investment', label: 'Investment', fields: ['investmentAmount', 'optionId', 'investmentDate', 'bankName', 'accountNumber', 'referralName', 'referralNumber'] },
];

const POINTS = [
  { icon: ShieldCheck, title: 'ID number required', body: 'A 13-digit South African ID number is part of the account.' },
  { icon: Landmark, title: 'Administrator deposit', body: 'The amount you select is deposited by an administrator.' },
  { icon: CalendarRange, title: '3 to 7 days', body: 'Options run from R2,000 to R14,000. Payouts on the rate card are estimates.' },
];

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
            <label key={optionValue} className={cx('flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm', selected ? 'border-[#ff6a00] bg-[#fff4ec]' : 'border-slate-200')}>
              <input type="radio" name={name} className="accent-[#ff6a00]" checked={selected} onChange={() => onChange(optionValue)} />
              <span className="font-medium text-ink">{label}</span>
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
  useTitle('Create your account');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const score = passwordScore(form.password);
  const optionIndex = INVESTMENT_OPTIONS.findIndex((option) => option.id === form.optionId);
  const illustrated = form.investmentAmount && optionIndex >= 0
    ? illustratedPayoutCents(Number(form.investmentAmount) * 100, DEFAULT_PROFIT_PERCENTS[optionIndex])
    : null;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function errorsForStep(index, source = form) {
    const all = validateRegistration(source);
    return STEPS[index].fields.reduce((kept, field) => {
      if (all[field]) kept[field] = all[field];
      return kept;
    }, {});
  }

  function continueStep() {
    const next = errorsForStep(step);
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = validateRegistration(form);
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) {
      const failed = STEPS.findIndex((item) => item.fields.some((field) => next[field]));
      if (failed >= 0) setStep(failed);
      return;
    }
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
    <AuthShell
      wide
      kicker="Investor portal"
      title="Open your account"
      accent="today."
      lede="The form records who you are, your ID number, and the amount and option an administrator will deposit."
      points={POINTS}
      note="Projected earnings are estimates, not guaranteed returns."
    >
      <h2 className="text-3xl font-semibold tracking-tight text-ink">Create your account</h2>
      <p className="mt-2 text-sm text-slate-500">
        Already have an account? <Link to="/login" className="font-semibold text-ember">Sign in</Link>
      </p>
      <ol className="mt-6 grid grid-cols-4 gap-2">
        {STEPS.map((item, index) => {
          const active = index === step;
          const done = index < step;
          return (
            <li key={item.id}>
              <button type="button" className="w-full text-left" onClick={() => { if (index < step) setStep(index); }}>
                <span className={cx('mb-2 block h-1 rounded-full', active || done ? 'bg-[#ff6a00]' : 'bg-slate-200')} />
                <span className={cx('text-[11px] font-semibold uppercase tracking-[0.08em]', active ? 'text-ember' : 'text-slate-400')}>
                  {index + 1} {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <form className="mt-6 space-y-5" onSubmit={onSubmit} noValidate>
        {formError ? <Alert tone="danger">{formError}</Alert> : null}
        {step === 0 ? (
          <>
            <ChoiceGroup legend="Title" name="title" options={TITLES} value={form.title} error={errors.title} onChange={(value) => update('title', value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" error={errors.firstName}>
                <input className={inputClass(errors.firstName)} value={form.firstName} autoComplete="given-name" onChange={(event) => update('firstName', event.target.value)} />
              </Field>
              <Field label="Surname" error={errors.surname}>
                <input className={inputClass(errors.surname)} value={form.surname} autoComplete="family-name" onChange={(event) => update('surname', event.target.value)} />
              </Field>
              <Field label="Email address" error={errors.email}>
                <input className={inputClass(errors.email)} type="email" autoComplete="email" placeholder="your@email.co.za" value={form.email} onChange={(event) => update('email', event.target.value)} />
              </Field>
              <Field label="Mobile number" error={errors.phone}>
                <input className={inputClass(errors.phone)} type="tel" autoComplete="tel" placeholder="082 555 0142" value={form.phone} onChange={(event) => update('phone', event.target.value)} />
              </Field>
            </div>
            <PasswordField label="Password" name="new-password" autoComplete="new-password" value={form.password} error={errors.password} onChange={(value) => update('password', value)} />
            <div className="flex gap-1" aria-hidden="true">
              {[0, 1, 2, 3].map((bar) => (
                <span key={bar} className={cx('h-1.5 flex-1 rounded-full', score > bar ? 'bg-[#ff6a00]' : 'bg-slate-200')} />
              ))}
            </div>
            <PasswordField label="Confirm password" name="confirm-password" autoComplete="new-password" value={form.confirm} error={errors.confirm} onChange={(value) => update('confirm', value)} />
          </>
        ) : null}
        {step === 1 ? (
          <>
            <ChoiceGroup legend="Gender" name="gender" options={GENDERS} value={form.gender} error={errors.gender} onChange={(value) => update('gender', value)} />
            <Field label="Date of birth" error={errors.dateOfBirth}>
              <input className={inputClass(errors.dateOfBirth)} type="date" value={form.dateOfBirth} onChange={(event) => update('dateOfBirth', event.target.value)} />
            </Field>
            <Field label="ID number" error={errors.idNumber} hint="13-digit South African ID number. The first six digits must match the date of birth.">
              <input className={inputClass(errors.idNumber)} inputMode="numeric" autoComplete="off" placeholder="9001015800088" value={form.idNumber} onChange={(event) => update('idNumber', event.target.value)} />
            </Field>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <Field label="Address" error={errors.address}>
              <textarea className={inputClass(errors.address)} rows={3} value={form.address} onChange={(event) => update('address', event.target.value)} />
            </Field>
            <ChoiceGroup legend="Occupation" name="occupation" options={OCCUPATIONS} value={form.occupation} error={errors.occupation} onChange={(value) => update('occupation', value)} />
          </>
        ) : null}
        {step === 3 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Investment amount" error={errors.investmentAmount}>
                <select className={inputClass(errors.investmentAmount)} value={form.investmentAmount} onChange={(event) => update('investmentAmount', event.target.value)}>
                  <option value="">Select an amount</option>
                  {INVESTMENT_AMOUNTS.map((amount) => (
                    <option key={amount} value={String(amount)}>{formatZAR(amount * 100)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Investment duration" error={errors.optionId}>
                <select className={inputClass(errors.optionId)} value={form.optionId} onChange={(event) => update('optionId', event.target.value)}>
                  <option value="">Select an option</option>
                  {INVESTMENT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            {illustrated != null ? (
              <p className="rounded-2xl bg-[#fff4ec] px-4 py-3 text-sm text-[#7c2d12]">
                Illustrated payout for this selection: <span className="font-semibold tabular">{formatZAR(illustrated)}</span>. This is an estimate, not a guaranteed return.
              </p>
            ) : null}
            <Field label="Investment date" error={errors.investmentDate}>
              <input className={inputClass(errors.investmentDate)} type="date" value={form.investmentDate} onChange={(event) => update('investmentDate', event.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bank name" error={errors.bankName}>
                <select className={inputClass(errors.bankName)} value={form.bankName} onChange={(event) => update('bankName', event.target.value)}>
                  <option value="">Select a bank</option>
                  {BANKS.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </Field>
              <Field label="Bank account number" error={errors.accountNumber}>
                <input className={inputClass(errors.accountNumber)} inputMode="numeric" value={form.accountNumber} onChange={(event) => update('accountNumber', event.target.value)} />
              </Field>
              <Field label="Referral name" error={errors.referralName}>
                <input className={inputClass(errors.referralName)} value={form.referralName} onChange={(event) => update('referralName', event.target.value)} />
              </Field>
              <Field label="Referral number" error={errors.referralNumber}>
                <input className={inputClass(errors.referralNumber)} type="tel" value={form.referralNumber} onChange={(event) => update('referralNumber', event.target.value)} />
              </Field>
            </div>
          </>
        ) : null}
        <div className="flex items-center justify-between gap-3 pt-2">
          {step > 0 ? (
            <Button type="button" variant="outline" className="rounded-full" onClick={() => setStep((current) => current - 1)}>
              Back
            </Button>
          ) : <span />}
          {step < STEPS.length - 1 ? (
            <Button type="button" variant="accent" className="rounded-full px-6" onClick={continueStep}>
              Continue
            </Button>
          ) : (
            <Button type="submit" variant="accent" className="rounded-full px-6" loading={loading}>
              Create account
            </Button>
          )}
        </div>
      </form>
    </AuthShell>
  );
}
