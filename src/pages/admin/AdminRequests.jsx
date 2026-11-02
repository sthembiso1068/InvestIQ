import { useEffect, useState } from 'react';
import { Alert, Button, Card, Field, Modal, PageHeader, inputClass } from '../../components/ui';
import { TransactionTable } from '../../components/TransactionTable';
import { useWorkspace } from '../../context/WorkspaceContext';
import { formatZAR } from '../../lib/format';
import { useTitle } from '../../hooks/useTitle';
import { adminDecide, adminListRequests } from '../../services/api';

const ACTIONS = {
  deposit: {
    pending: [
      { status: 'approved', label: 'Approve', variant: 'primary' },
      { status: 'rejected', label: 'Reject', variant: 'danger' },
    ],
  },
  withdrawal: {
    pending: [
      { status: 'processing', label: 'Mark processing', variant: 'secondary' },
      { status: 'rejected', label: 'Reject', variant: 'danger' },
    ],
    processing: [
      { status: 'completed', label: 'Mark completed', variant: 'primary' },
      { status: 'rejected', label: 'Reject', variant: 'danger' },
    ],
  },
};

export default function AdminRequests() {
  const { refresh } = useWorkspace();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('deposits');
  const [openOnly, setOpenOnly] = useState(true);
  const [decision, setDecision] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useTitle('Requests');

  async function load() {
    setData(await adminListRequests());
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const source = tab === 'deposits' ? data?.deposits || [] : data?.withdrawals || [];
  const rows = openOnly ? source.filter((tx) => tx.status === 'pending' || tx.status === 'processing') : source;

  async function onConfirm() {
    setBusy(true);
    setError('');
    try {
      await adminDecide(decision.tx.id, decision.status, reason);
      setDecision(null);
      setReason('');
      await load();
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Deposit and withdrawal requests"
        subtitle="Every decision needs a reason. Rejecting a withdrawal releases the hold on available funds."
      />
      {error && !decision ? <Alert tone="danger" className="mb-4">{error}</Alert> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {['deposits', 'withdrawals'].map((item) => (
          <button key={item} type="button" className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === item ? 'bg-navy text-white' : 'bg-white text-navy ring-1 ring-slate-200'}`} onClick={() => setTab(item)}>
            {item === 'deposits' ? 'Deposits' : 'Withdrawals'}
          </button>
        ))}
        <button type="button" className="rounded-full px-4 py-2 text-sm font-semibold text-navy ring-1 ring-slate-200" onClick={() => setOpenOnly((current) => !current)}>
          {openOnly ? 'Showing open requests' : 'Showing all requests'}
        </button>
      </div>
      <Card>
        {!data ? <div className="h-48 animate-pulse bg-slate-100" /> : (
          <div>
            <TransactionTable rows={rows} showClient emptyTitle="Nothing in this queue" emptyBody="Open requests will show here for approval." />
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {rows.map((tx) => {
                const actions = ACTIONS[tx.type]?.[tx.status] || [];
                if (!actions.length) return null;
                return (
                  <li key={`${tx.id}-actions`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                    <span className="text-slate-600">{tx.userName} · {tx.reference} · {formatZAR(tx.amountCents)}</span>
                    <span className="flex gap-2">
                      {actions.map((action) => (
                        <Button key={action.status} type="button" variant={action.variant} onClick={() => { setDecision({ tx, status: action.status, label: action.label }); setReason(''); setError(''); }}>
                          {action.label}
                        </Button>
                      ))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Card>
      <Modal
        open={Boolean(decision)}
        title={decision ? `${decision.label} ${decision.tx.reference}` : ''}
        onClose={() => setDecision(null)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setDecision(null)}>Cancel</Button>
            <Button type="button" loading={busy} onClick={onConfirm}>Confirm and write audit log</Button>
          </>
        }
      >
        {decision ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              {decision.tx.userName} · {decision.tx.type} · {formatZAR(decision.tx.amountCents)} · new status {decision.status}.
            </p>
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <Field label="Reason" hint="At least 8 characters. This is stored on the request and in the audit log.">
              <textarea className={inputClass()} rows={4} value={reason} onChange={(event) => setReason(event.target.value)} />
            </Field>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
