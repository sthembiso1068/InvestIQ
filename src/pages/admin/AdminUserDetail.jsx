import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TransactionTable } from '../../components/TransactionTable';
import { Alert, Avatar, Button, Card, Field, Money, PageHeader, StatusPill, inputClass } from '../../components/ui';
import { useWorkspace } from '../../context/WorkspaceContext';
import { formatDate, formatZAR, parseRandToCents } from '../../lib/format';
import { useTitle } from '../../hooks/useTitle';
import { adminAdjust, adminGetUser, adminSetStatus } from '../../services/api';

export default function AdminUserDetail() {
  const { userId } = useParams();
  const { refresh } = useWorkspace();
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('active');
  const [statusReason, setStatusReason] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [adjust, setAdjust] = useState({ direction: 'credit', amount: '', reason: '' });
  const [adjustMessage, setAdjustMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useTitle('Client profile');

  async function load() {
    const next = await adminGetUser(userId);
    setRecord(next);
    setStatus(next.user.status);
  }

  useEffect(() => {
    let cancel = false;
    adminGetUser(userId)
      .then((next) => {
        if (cancel) return;
        setRecord(next);
        setStatus(next.user.status);
      })
      .catch((err) => {
        if (!cancel) setError(err.message);
      });
    return () => {
      cancel = true;
    };
  }, [userId]);

  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!record) return <Card className="h-64 animate-pulse bg-slate-100" />;
  const { user, balances, investments, transactions } = record;
  const client = user.role === 'client';

  async function onStatus(event) {
    event.preventDefault();
    setBusy(true);
    setStatusMessage('');
    try {
      await adminSetStatus(user.id, status, statusReason);
      setStatusReason('');
      setStatusMessage('Account status updated and written to the audit log.');
      await load();
      refresh();
    } catch (err) {
      setStatusMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onAdjust(event) {
    event.preventDefault();
    setBusy(true);
    setAdjustMessage('');
    const amountCents = parseRandToCents(adjust.amount);
    if (amountCents === null) {
      setAdjustMessage('Enter a valid amount.');
      setBusy(false);
      return;
    }
    try {
      await adminAdjust(user.id, { direction: adjust.direction, amountCents, reason: adjust.reason });
      setAdjust({ direction: 'credit', amount: '', reason: '' });
      setAdjustMessage('Ledger adjustment posted. The balance is the new sum of transactions.');
      await load();
      refresh();
    } catch (err) {
      setAdjustMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Link to="/admin/users" className="text-sm font-semibold text-navy">Back to users</Link>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <Avatar name={user.name} src={user.avatarDataUrl} size="lg" />
        <div>
          <PageHeader eyebrow={user.clientNumber} title={user.name} subtitle={`${user.email} · ${user.phone || 'No phone'} · Registered ${formatDate(user.createdAt)}`} />
        </div>
        <StatusPill status={user.status} />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Total</p><Money cents={balances.totalCents} className="mt-1 block text-xl font-semibold" /></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Available</p><Money cents={balances.availableCents} className="mt-1 block text-xl font-semibold" /></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Invested</p><Money cents={balances.investedCents} className="mt-1 block text-xl font-semibold" /></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Illustrative profit</p><Money cents={balances.profitCents} tone="positive" className="mt-1 block text-xl font-semibold" /></Card>
      </div>

      {client ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold text-navy">Account status</h2>
            <form className="mt-4 space-y-3" onSubmit={onStatus}>
              {statusMessage ? <Alert tone={statusMessage.includes('updated') ? 'success' : 'danger'}>{statusMessage}</Alert> : null}
              <Field label="Status">
                <select className={inputClass()} value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="closed">Closed</option>
                </select>
              </Field>
              <Field label="Reason" hint="Required. Stored in the audit log.">
                <textarea className={inputClass()} rows={3} value={statusReason} onChange={(event) => setStatusReason(event.target.value)} />
              </Field>
              <Button type="submit" loading={busy}>Update status</Button>
            </form>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold text-navy">Ledger adjustment</h2>
            <p className="mt-1 text-sm text-slate-500">Posts a new transaction. It does not edit older records. Available now: {formatZAR(balances.availableCents)}.</p>
            <form className="mt-4 space-y-3" onSubmit={onAdjust}>
              {adjustMessage ? <Alert tone={adjustMessage.includes('posted') ? 'success' : 'danger'}>{adjustMessage}</Alert> : null}
              <Field label="Direction">
                <select className={inputClass()} value={adjust.direction} onChange={(event) => setAdjust({ ...adjust, direction: event.target.value })}>
                  <option value="credit">Credit available funds</option>
                  <option value="debit">Debit available funds</option>
                </select>
              </Field>
              <Field label="Amount (ZAR)">
                <input className={inputClass()} value={adjust.amount} onChange={(event) => setAdjust({ ...adjust, amount: event.target.value })} />
              </Field>
              <Field label="Reason" hint="Required. Stored on the transaction and in the audit log.">
                <textarea className={inputClass()} rows={3} value={adjust.reason} onChange={(event) => setAdjust({ ...adjust, reason: event.target.value })} />
              </Field>
              <Button type="submit" variant="secondary" loading={busy}>Post adjustment</Button>
            </form>
          </Card>
        </div>
      ) : (
        <Alert tone="info" className="mt-4">Administrator accounts do not hold a client ledger.</Alert>
      )}

      <Card className="mt-4 p-5">
        <h2 className="font-semibold text-navy">Investments</h2>
        {investments.length === 0 ? <p className="mt-3 text-sm text-slate-500">No investments recorded.</p> : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {investments.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span>
                  <span className="font-medium text-navy">{item.optionName}</span>
                  <span className="block text-xs text-slate-500">{item.reference} · completes {formatDate(item.completesAt)}</span>
                </span>
                <span className="flex items-center gap-3">
                  <Money cents={item.amountCents} className="font-semibold" />
                  <StatusPill status={item.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="mt-4">
        <h2 className="px-5 pt-5 font-semibold text-navy">Transactions</h2>
        <TransactionTable rows={transactions} emptyTitle="No transactions" emptyBody="This client has no ledger entries." />
      </Card>
    </div>
  );
}
