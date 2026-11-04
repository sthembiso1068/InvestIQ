import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PiggyBank } from 'lucide-react';
import { PackageTable } from '../components/PackageTable';
import { Button, Card, Disclaimer, EmptyState, Money, PageHeader, StatusPill } from '../components/ui';
import { useWorkspace } from '../context/WorkspaceContext';
import { completionLabel, cx, formatDateTime, formatPercent, formatZAR, progressPercent } from '../lib/format';
import { illustratedPayoutCents } from '../services/ledger';
import { useTitle } from '../hooks/useTitle';

export default function Investments() {
  const { data, loading } = useWorkspace();
  useTitle('My Investments');
  const pricing = data?.pricing;
  const [selectedOptionId, setSelectedOptionId] = useState('opt1');
  const [selectedAmountCents, setSelectedAmountCents] = useState(null);

  const option = useMemo(
    () => pricing?.options?.find((item) => item.id === selectedOptionId) || pricing?.options?.[0],
    [pricing, selectedOptionId],
  );

  if (loading && !data) return <Card className="h-64 animate-pulse bg-slate-100" />;
  if (!pricing) return null;

  const payout = selectedAmountCents && option ? illustratedPayoutCents(selectedAmountCents, option.profitPercent) : 0;
  const investments = data.investments || [];

  return (
    <div className="pb-28">
      <PageHeader
        eyebrow="Portfolio"
        title="My investments"
        subtitle="Active packages stay allocated until the trading period ends. New packages use the current rate card."
      />
      <Disclaimer className="mb-5" />

      <div className="grid gap-4">
        {investments.length === 0 ? (
          <Card>
            <EmptyState icon={PiggyBank} title="No investments on this account" body="When you confirm a package, the amount moves from available funds into the investment. An administrator must deposit your selected amount before funds are available." />
          </Card>
        ) : (
          investments.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.reference}</p>
                  <h2 className="mt-1 text-lg font-semibold text-navy">
                    {item.optionName} · {item.days} trading days
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Started {formatDateTime(item.startedAt)} · Expected completion {formatDateTime(item.completesAt)}
                  </p>
                </div>
                <StatusPill status={item.status} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Investment amount</p>
                  <Money cents={item.amountCents} className="mt-1 block text-lg font-semibold" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Illustrated payout</p>
                  <Money cents={item.illustratedPayoutCents} className="mt-1 block text-lg font-semibold" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Illustrated profit</p>
                  <Money cents={item.illustratedProfitCents} tone="positive" className="mt-1 block text-lg font-semibold" />
                </div>
              </div>
              {item.status === 'active' ? (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>{completionLabel(item.completesAt)}</span>
                    <span>{Math.round(progressPercent(item.startedAt, item.completesAt))}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${progressPercent(item.startedAt, item.completesAt)}%` }} />
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Maturity posted the principal back to available funds and credited the illustrative profit. That credit is not a verified trading result.
                </p>
              )}
            </Card>
          ))
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-navy">Choose a package</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Minimum investment {formatZAR(pricing.minimumCents)}. The large figure is the illustrated total payout, which includes your capital. The smaller figure is illustrated profit only. Status for a package you have not bought is Available.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {pricing.options.map((item) => {
            const selected = item.id === (option?.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedOptionId(item.id)}
                className={cx(
                  'rounded-2xl border bg-white p-4 text-left shadow-sm transition',
                  selected ? 'border-ember ring-2 ring-ember/30' : 'border-slate-200 hover:border-slate-300',
                )}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ember">{item.name}</span>
                <span className="mt-2 block text-2xl font-semibold text-navy">{item.days} days</span>
                <span className="mt-1 block text-sm text-slate-500">Illustrated profit {formatPercent(item.profitPercent)}</span>
                <span className="mt-3 inline-flex"><StatusPill status="available" /></span>
              </button>
            );
          })}
        </div>
        <Card className="mt-4 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-slate-500">
            <span>Swipe sideways to compare every duration. Select a cell to review it.</span>
          </div>
          <PackageTable
            pricing={pricing}
            selectedOptionId={option?.id}
            selectedAmountCents={selectedAmountCents}
            onSelect={(optionId, amount) => {
              setSelectedOptionId(optionId);
              setSelectedAmountCents(amount);
            }}
          />
          <p className="px-4 py-3 text-xs leading-5 text-slate-500">
            These payouts match the SV Capital rate card and are illustrative estimates. They are not guaranteed returns and they are not verified trading results. Historical investments keep the rate from the day they were opened.
          </p>
        </Card>
      </div>

      {selectedAmountCents && option ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-navy/95 px-4 py-4 backdrop-blur lg:left-72">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                {option.name} · {option.days} trading days · Available
              </p>
              <p className="mt-1 text-sm text-white sm:text-base">
                Invest <span className="font-semibold text-gold tabular">{formatZAR(selectedAmountCents)}</span>
                <span className="text-slate-300"> · illustrated payout </span>
                <span className="font-semibold text-gold tabular">{formatZAR(payout)}</span>
              </p>
            </div>
            <Link to={`/investments/confirm?option=${option.id}&amount=${selectedAmountCents}`}>
              <Button type="button">Review investment</Button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
