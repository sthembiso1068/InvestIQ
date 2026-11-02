import { Link } from 'react-router-dom';
import { Card, Money, PageHeader } from '../../components/ui';
import { TransactionTable } from '../../components/TransactionTable';
import { useWorkspace } from '../../context/WorkspaceContext';
import { formatDateTime, formatZAR } from '../../lib/format';
import { useTitle } from '../../hooks/useTitle';

function Metric({ label, value, hint }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-navy">{value}</p>
      {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
    </Card>
  );
}

export default function AdminOverview() {
  const { data, loading } = useWorkspace();
  useTitle('Admin overview');
  if (loading && !data) return <Card className="h-64 animate-pulse bg-slate-100" />;
  if (!data?.totals) return null;
  const { totals } = data;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Platform overview"
        subtitle="Client balances are summed from each personal ledger. Approving a request is the way funds move."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Registered clients" value={data.clients} hint="Administrator accounts are excluded" />
        <Metric label="Open requests" value={data.pendingCount} hint="Pending deposits and open withdrawals" />
        <Card className="bg-navy p-5 text-white sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Platform balances</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-300">Available</p>
              <p className="text-2xl font-semibold text-gold tabular">{formatZAR(totals.availableCents)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-300">Invested</p>
              <p className="text-2xl font-semibold tabular">{formatZAR(totals.investedCents)}</p>
            </div>
          </div>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Approved deposits</p>
          <Money cents={data.approvedDepositsCents} className="mt-2 block text-xl font-semibold" tone="positive" />
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Pending deposits</p>
          <Money cents={data.pendingDepositsCents} className="mt-2 block text-xl font-semibold" />
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Completed withdrawals</p>
          <Money cents={data.completedWithdrawalsCents} className="mt-2 block text-xl font-semibold" tone="negative" />
        </Card>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="font-semibold text-navy">Requests needing attention</h2>
            <Link to="/admin/requests" className="text-sm font-semibold text-navy">Open queue</Link>
          </div>
          <TransactionTable rows={data.pendingRequests} showClient emptyTitle="Queue is clear" emptyBody="New deposit and withdrawal requests will appear here." />
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-navy">Recent audit log</h2>
            <Link to="/admin/audit" className="text-sm font-semibold text-navy">View log</Link>
          </div>
          <ul className="mt-4 space-y-3">
            {data.audit.map((entry) => (
              <li key={entry.id} className="border-b border-slate-100 pb-3 text-sm last:border-0">
                <p className="font-medium text-navy">{entry.action} · {entry.targetLabel}</p>
                <p className="text-slate-500">{entry.reason}</p>
                <p className="text-xs text-slate-400">{entry.adminName} · {formatDateTime(entry.at)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="mt-4">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="font-semibold text-navy">Latest client transactions</h2>
        </div>
        <TransactionTable rows={data.recentTransactions} showClient />
      </Card>
    </div>
  );
}
