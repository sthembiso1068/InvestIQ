import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { TransactionTable } from '../components/TransactionTable';
import { Alert, Avatar, Button, Card, Field, inputClass, Money, PageHeader, PasswordField, StatusPill } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { fileToAvatar } from '../lib/image';
import { formatDate, formatZAR } from '../lib/format';
import { validatePassword, validateProfile } from '../lib/validators';
import { useTitle } from '../hooks/useTitle';
import { changePassword, listSessions, revokeOtherSessions, setAvatar, updateProfile } from '../services/api';

export default function Profile() {
  const { user, replaceUser } = useAuth();
  const { data, refresh } = useWorkspace();
  useTitle('Profile');
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', nextPassword: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionMessage, setSessionMessage] = useState('');

  useEffect(() => {
    setForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  }, [user]);

  useEffect(() => {
    let cancel = false;
    listSessions().then((rows) => {
      if (!cancel) setSessions(rows);
    }).catch(() => {});
    return () => {
      cancel = true;
    };
  }, [user, sessionMessage]);

  const balances = data?.balances;
  const investments = data?.investments || [];
  const transactions = (data?.transactions || []).slice(0, 8);

  async function onSave(event) {
    event.preventDefault();
    const next = validateProfile(form);
    setErrors(next);
    setMessage('');
    setFormError('');
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      const account = await updateProfile(form);
      replaceUser(account);
      refresh();
      setMessage('Personal details saved.');
    } catch (error) {
      setFormError(error.message);
      if (error.fields) setErrors(error.fields);
    } finally {
      setSaving(false);
    }
  }

  async function onPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoError('');
    setPhotoLoading(true);
    try {
      const dataUrl = await fileToAvatar(file);
      const account = await setAvatar(dataUrl);
      replaceUser(account);
      refresh();
    } catch (error) {
      setPhotoError(error.message);
    } finally {
      setPhotoLoading(false);
    }
  }

  async function onRemovePhoto() {
    setPhotoLoading(true);
    setPhotoError('');
    try {
      const account = await setAvatar(null);
      replaceUser(account);
    } catch (error) {
      setPhotoError(error.message);
    } finally {
      setPhotoLoading(false);
    }
  }

  async function onPassword(event) {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (passwords.nextPassword !== passwords.confirm) {
      setPasswordError('Passwords do not match.');
      return;
    }
    const rule = validatePassword(passwords.nextPassword).password;
    if (rule) {
      setPasswordError(rule);
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(passwords);
      setPasswords({ currentPassword: '', nextPassword: '', confirm: '' });
      setPasswordMessage('Password updated. Other sessions on this browser were signed out.');
      setSessionMessage('updated');
    } catch (error) {
      setPasswordError(error.fields?.currentPassword || error.fields?.nextPassword || error.message);
    } finally {
      setPasswordLoading(false);
    }
  }

  async function onRevoke() {
    await revokeOtherSessions();
    setSessionMessage(`revoked-${Date.now()}`);
  }

  return (
    <div>
      <PageHeader eyebrow="Account" title="Profile" subtitle="Your personal details, security, and the history stored on this account." />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit p-5 text-center">
          <div className="flex justify-center"><Avatar name={user?.name} src={user?.avatarDataUrl} size="xl" /></div>
          <h2 className="mt-4 text-lg font-semibold text-navy">{user?.name}</h2>
          <p className="text-sm text-slate-500">{user?.clientNumber}</p>
          <div className="mt-3 flex justify-center"><StatusPill status={user?.status || 'active'} /></div>
          <p className="mt-3 text-xs text-slate-500">Registered {formatDate(user?.createdAt)}</p>
          <div className="mt-4 flex flex-col gap-2">
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-navy">
              <Camera size={16} /> {photoLoading ? 'Saving photo…' : 'Upload photo'}
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
            {user?.avatarDataUrl ? (
              <button type="button" className="text-sm font-semibold text-slate-500" onClick={onRemovePhoto}>Remove photo</button>
            ) : null}
          </div>
          {photoError ? <p className="mt-2 text-sm text-negative">{photoError}</p> : null}
          {balances ? (
            <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-left text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Total balance</dt><dd className="font-semibold tabular">{formatZAR(balances.totalCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Available</dt><dd className="font-semibold"><Money cents={balances.availableCents} /></dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Invested</dt><dd className="font-semibold"><Money cents={balances.investedCents} /></dd></div>
            </dl>
          ) : null}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-navy">Personal details</h2>
            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onSave}>
              {message ? <Alert tone="success" className="sm:col-span-2">{message}</Alert> : null}
              {formError ? <Alert tone="danger" className="sm:col-span-2">{formError}</Alert> : null}
              <Field label="Full name" error={errors.name}>
                <input className={inputClass(errors.name)} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </Field>
              <Field label="Email address" error={errors.email}>
                <input className={inputClass(errors.email)} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </Field>
              <Field label="Phone number" error={errors.phone}>
                <input className={inputClass(errors.phone)} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </Field>
              <div className="flex items-end">
                <Button type="submit" loading={saving}>Save details</Button>
              </div>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-navy">Security</h2>
            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onPassword}>
              {passwordMessage ? <Alert tone="success" className="sm:col-span-2">{passwordMessage}</Alert> : null}
              {passwordError ? <Alert tone="danger" className="sm:col-span-2">{passwordError}</Alert> : null}
              <PasswordField label="Current password" autoComplete="current-password" value={passwords.currentPassword} onChange={(value) => setPasswords({ ...passwords, currentPassword: value })} />
              <div />
              <PasswordField label="New password" autoComplete="new-password" value={passwords.nextPassword} onChange={(value) => setPasswords({ ...passwords, nextPassword: value })} />
              <PasswordField label="Confirm new password" autoComplete="new-password" value={passwords.confirm} onChange={(value) => setPasswords({ ...passwords, confirm: value })} />
              <Button type="submit" variant="secondary" loading={passwordLoading}>Change password</Button>
            </form>
            <div className="mt-6 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-navy">Sessions on this browser</h3>
                <button type="button" className="text-sm font-semibold text-navy disabled:opacity-40" disabled={sessions.filter((item) => !item.current).length === 0} onClick={onRevoke}>
                  Sign out other sessions
                </button>
              </div>
              <ul className="mt-3 space-y-2">
                {sessions.map((session) => (
                  <li key={session.id} className="rounded-xl bg-canvas px-3 py-2 text-sm">
                    <span className="font-medium text-navy">{session.current ? 'This session' : 'Other session'}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">Started {formatDate(session.createdAt)} · expires {formatDate(session.expiresAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-base font-semibold text-navy">Investment history</h2>
          <Link to="/investments" className="text-sm font-semibold text-navy">Open investments</Link>
        </div>
        {investments.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">No investments have been recorded on this account.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Package</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Illustrated profit</th>
                  <th className="px-4 py-3 font-semibold">Completion</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-5 py-3">
                      <span className="font-medium text-navy">{item.optionName}</span>
                      <span className="block text-xs text-slate-500">{item.days} days · {item.reference}</span>
                    </td>
                    <td className="px-4 py-3"><Money cents={item.amountCents} /></td>
                    <td className="px-4 py-3"><Money cents={item.illustratedProfitCents} tone="positive" /></td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(item.completesAt)}</td>
                    <td className="px-5 py-3"><StatusPill status={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-base font-semibold text-navy">Transaction history</h2>
          <Link to={user?.role === 'admin' ? '/admin' : '/transactions'} className="text-sm font-semibold text-navy">View ledger</Link>
        </div>
        <TransactionTable rows={transactions} emptyTitle="No transactions yet" emptyBody="Ledger entries for this account will appear here." />
      </Card>
    </div>
  );
}
