import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Disclaimer, Field, inputClass, PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTitle } from '../hooks/useTitle';
import { resetDemo, updateSettings } from '../services/api';

export default function Settings() {
  const { user, replaceUser } = useAuth();
  useTitle('Settings');
  const [settings, setSettings] = useState(user?.settings || { emailNotices: true, withdrawalAlerts: true });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetText, setResetText] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  async function onSave(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const account = await updateSettings(settings);
      replaceUser(account);
      setMessage('Preferences saved on this browser.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function onReset(event) {
    event.preventDefault();
    if (resetText !== 'RESET') {
      setResetError('Type RESET to restore the administrator account.');
      return;
    }
    setResetting(true);
    setResetError('');
    try {
      await resetDemo();
      window.location.href = '/login';
    } catch (error) {
      setResetError(error.message);
      setResetting(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Account" title="Settings" subtitle="Notifications stay on this device. Password and sessions are managed from your profile." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-navy">Notifications</h2>
          <p className="mt-1 text-sm text-slate-500">These preferences are stored with your profile on this browser.</p>
          <form className="mt-4 space-y-3" onSubmit={onSave}>
            {message ? <Alert tone="success">{message}</Alert> : null}
            <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm">
              <span>
                <span className="block font-medium text-navy">Account notices</span>
                <span className="text-slate-500">Deposit decisions and investment updates.</span>
              </span>
              <input type="checkbox" className="h-4 w-4 accent-ember" checked={settings.emailNotices} onChange={(event) => setSettings({ ...settings, emailNotices: event.target.checked })} />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm">
              <span>
                <span className="block font-medium text-navy">Withdrawal alerts</span>
                <span className="text-slate-500">Status changes on withdrawal requests.</span>
              </span>
              <input type="checkbox" className="h-4 w-4 accent-ember" checked={settings.withdrawalAlerts} onChange={(event) => setSettings({ ...settings, withdrawalAlerts: event.target.checked })} />
            </label>
            <Button type="submit" loading={saving}>Save preferences</Button>
          </form>
          <p className="mt-4 text-sm text-slate-500">
            Change your password or review sessions in <Link to={user?.role === 'admin' ? '/admin/profile' : '/profile'} className="font-semibold text-navy">Profile</Link>.
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="text-base font-semibold text-navy">Stored records</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Records stay in this browser. Resetting removes stored client accounts, restores the administrator account, and signs you out.
          </p>
          <form className="mt-4 space-y-3" onSubmit={onReset}>
            {resetError ? <Alert tone="danger">{resetError}</Alert> : null}
            <Field label="Type RESET to confirm">
              <input className={inputClass()} value={resetText} onChange={(event) => setResetText(event.target.value)} />
            </Field>
            <Button type="submit" variant="danger" loading={resetting}>Restore administrator account</Button>
          </form>
        </Card>
      </div>
      <Disclaimer className="mt-4" />
    </div>
  );
}
