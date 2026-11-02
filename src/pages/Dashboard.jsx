import { Link } from 'react-router-dom';
import { ArrowUpFromLine, Landmark, PiggyBank, Plus, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { AllocationDonut, ProfitChart } from '../components/ProfitChart';
import { TransactionTable, ViewAllLink } from '../components/TransactionTable';
import { Card, Disclaimer, EmptyState, Money, PageHeader, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { completionLabel, firstName, formatDate, formatZAR, greeting, progressPercent } from '../lib/format';
import { transactionDetail, transactionTitle } from '../lib/present';
import { useTitle } from '../hooks/useTitle';

function Stat({ label, cents, hint, icon: Icon, tone = 'neutral', featured = false }) {
  if (featured) {
    return (
      <article className="rounded-2xl bg-navy p-5 text-white shadow-[0_16px_40px_rgba(7,24,39,0.18)]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{label}</p>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-gold">
            <Icon size={18} />
          </span>
        </div>
        <p className="mt-4 text-3xl font-semibold tracking-tight text-gold tabular">{formatZAR(cents)}</p>
        <p className="mt-2 text-sm text-slate-300">{hint}</p>
      </article>
    );
  }
  const toneClass = tone === 'positive' ? 'text-positive' : tone === 'negative' ? 'text-negative' : 'text-navy';
  const iconClass = tone === 'positive' ? 'bg-emerald-50 text-positive' : tone === 'negative' ? 'bg-red-50 text-negative' : 'bg-slate-100 text-navy';
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(7,24,39,0.05)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${iconClass}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className={`mt-4 text-3xl font-semibold tracking-tight tabular ${toneClass}`}>{formatZAR(cents)}</p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </article>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, refresh } = useWorkspace();
  useTitle('Dashboard');

  if (loading && !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36" />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card className="p-6">
        <p className="font-semibold text-navy">The account could not be loaded.</p>
        <p className="mt-1 text-sm text-slate-500">{error.message}</p>
        <button type="button" className="mt-4 text-sm font-semibold text-navy" onClick={refresh}>
          Try again
        </button>
      </Card>
    );
  }

  const balances = data.balances;
  const profitTone = balances.profitCents > 0 ? 'positive' : balances.profitCents < 0 ? 'negative' : 'neutral';
  const ProfitIcon = balances.profitCents < 0 ? TrendingDown : TrendingUp;
  const active = data.investments.filter((item) => item.status === 'active');

  return (
    <div>
      <PageHeader
        eyebrow={`${greeting()}, ${firstName(user?.name)}`}
        title="Your investment account"
        subtitle="Balances below are calculated from your personal ledger. An administrator deposits the amount on your investment form."
        actions={
          <>
            <Link to="/investments" className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-navy">
              <Plus size={16} /> Invest
            </Link>
            <Link to="/wallet?intent=withdraw" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy">
              <ArrowUpFromLine size={16} /> Withdraw
            </Link>
          </>
        }
      />
      <Disclaimer className="mb-5" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat featured label="Total account balance" cents={balances.totalCents} hint="Available funds plus active investments" icon={Landmark} />
        <Stat label="Available balance" cents={balances.availableCents} hint="Ready for a new investment or withdrawal" icon={Wallet} />
        <Stat label="Total invested" cents={balances.investedCents} hint="Currently allocated to active packages" icon={PiggyBank} />
        <Stat label="Total profit or loss" cents={balances.profitCents} hint="Illustrative credits after a package completes" icon={ProfitIcon} tone={profitTone} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5">
            <div>
              <h2 className="text-base font-semibold text-navy">Illustrated profit and loss</h2>
              <p className="text-sm text-slate-500">Cumulative illustrative credits over the last 30 days.</p>
            </div>
          </div>
          <ProfitChart points={data.chart} />
        </Card>
        <Card className="p-5">
          <h2 className="text-base font-semibold text-navy">Portfolio mix</h2>
          <p className="mt-1 text-sm text-slate-500">How the total balance is split.</p>
          <div className="mt-5">
            <AllocationDonut availableCents={balances.availableCents} investedCents={balances.investedCents} />
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Available</span>
              <Money cents={balances.availableCents} />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Invested</span>
              <Money cents={balances.investedCents} />
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-base font-semibold text-navy">Recent transactions</h2>
            <ViewAllLink />
          </div>
          <div className="mt-2">
            <TransactionTable
              rows={data.transactions.slice(0, 6)}
              emptyTitle="No transactions yet"
              emptyBody="An administrator deposits the amount from your investment form. That entry will show here."
            />
          </div>
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-navy">Active investments</h2>
            {active.length === 0 ? (
              <EmptyState icon={PiggyBank} title="No active packages" body="Choose a duration and amount from the rate card when you are ready." action={<Link to="/investments" className="text-sm font-semibold text-navy">Browse packages</Link>} />
            ) : (
              <ul className="mt-4 space-y-4">
                {active.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-navy">{item.optionName}</p>
                        <p className="text-xs text-slate-500">{item.days} trading days · {completionLabel(item.completesAt)}</p>
                      </div>
                      <Money cents={item.amountCents} className="font-semibold" />
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${progressPercent(item.startedAt, item.completesAt)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="text-base font-semibold text-navy">Account activity</h2>
            <ul className="mt-4 space-y-4">
              {data.transactions.slice(0, 5).map((tx) => (
                <li key={tx.id} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <div>
                    <p className="text-sm font-medium text-navy">{transactionTitle(tx)}</p>
                    <p className="text-xs leading-5 text-slate-500">{transactionDetail(tx)}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(tx.createdAt)}</p>
                  </div>
                </li>
              ))}
              {data.transactions.length === 0 ? <li className="text-sm text-slate-500">Activity will show here after the first ledger entry.</li> : null}
            </ul>
          </Card>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400">Client {data.profile?.clientNumber}. Figures use South African Rand.</p>
    </div>
  );
}
