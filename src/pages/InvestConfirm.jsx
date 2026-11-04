import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Alert, Button, Card, Disclaimer, Money, PageHeader } from '../components/ui';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatDateTime, formatPercent } from '../lib/format';
import { useTitle } from '../hooks/useTitle';
import { createInvestment, quoteInvestment } from '../services/api';

export default function InvestConfirm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh, data } = useWorkspace();
  const optionId = params.get('option') || '';
  const amountCents = Number(params.get('amount'));
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [result, setResult] = useState(null);
  useTitle('Confirm investment');
  const suspended = data?.status === 'suspended';

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setError('');
    quoteInvestment(optionId, amountCents)
      .then((next) => {
        if (!cancel) setQuote(next);
      })
      .catch((err) => {
        if (!cancel) setError(err.message || 'The package could not be quoted.');
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [optionId, amountCents]);

  async function onConfirm() {
    setSubmitting(true);
    setError('');
    try {
      const next = await createInvestment(optionId, amountCents);
      setResult(next.investment);
      refresh();
    } catch (err) {
      setError(err.message || 'The investment could not be allocated.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="New investment"
        title="Confirm allocation"
        subtitle="Available funds move into the package when you confirm. Illustrated profit is an estimate and is not a verified trading result."
      />
      <Disclaimer className="mb-5" />
      {loading ? <Card className="h-56 animate-pulse bg-slate-100" /> : null}
      {!loading && result ? (
        <Card className="p-6">
          <CheckCircle2 className="text-positive" />
          <h2 className="mt-3 text-xl font-semibold text-navy">Investment allocated</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            {result.reference} is active until {formatDateTime(result.completesAt)}. When that time is reached, the ledger returns your capital and posts an illustrative profit. That credit is not a verified trading result.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" onClick={() => navigate('/investments')}>View investments</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/')}>Back to dashboard</Button>
          </div>
        </Card>
      ) : null}
      {!loading && !result ? (
        <Card className="p-5 sm:p-6">
          {error ? <Alert tone="danger" className="mb-4">{error}</Alert> : null}
          {!quote?.valid ? (
            <div>
              <p className="font-semibold text-navy">{quote?.message || 'This package is not on the current rate card.'}</p>
              <Link to="/investments" className="mt-4 inline-block text-sm font-semibold text-navy">Choose another package</Link>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Investment amount</dt>
                    <dd className="mt-1 text-xl font-semibold"><Money cents={quote.amountCents} /></dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Trading duration</dt>
                    <dd className="mt-1 text-xl font-semibold text-navy">{quote.option.name} · {quote.option.days} days</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Illustrated total payout</dt>
                    <dd className="mt-1 text-xl font-semibold"><Money cents={quote.payoutCents} /></dd>
                    <p className="mt-1 text-xs text-slate-500">Rate-card “you earn” figure, including your capital. Illustrated rate {formatPercent(quote.profitPercent)}.</p>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Illustrated profit</dt>
                    <dd className="mt-1 text-xl font-semibold"><Money cents={quote.profitCents} tone="positive" /></dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Expected completion</dt>
                    <dd className="mt-1 font-semibold text-navy">{formatDateTime(quote.completesAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Investment status</dt>
                    <dd className="mt-1 font-semibold text-navy">Will be active after confirmation</dd>
                  </div>
                </dl>
                <label className="mt-6 flex items-start gap-3 text-sm leading-6 text-slate-600">
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-ember" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
                  I understand this payout is an illustrative estimate. It is not a guaranteed return and it is not a verified trading result.
                </label>
              </div>
              <div className="rounded-2xl bg-canvas p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Funds check</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Available now</span><Money cents={quote.availableCents} /></div>
                  <div className="flex justify-between"><span className="text-slate-500">This allocation</span><Money cents={-quote.amountCents} signed tone="neutral" /></div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                    <span>Remaining available</span>
                    <Money cents={quote.remainingCents} tone={quote.sufficient ? 'neutral' : 'negative'} />
                  </div>
                </div>
                {!quote.sufficient ? (
                  <Alert tone="warning" className="mt-4">
                    {quote.message} An administrator must deposit the amount on your investment form before you can allocate it.
                  </Alert>
                ) : null}
                <Button type="button" className="mt-4 w-full" disabled={!accepted || !quote.sufficient || suspended} loading={submitting} onClick={onConfirm}>
                  Confirm investment
                </Button>
                <button type="button" className="mt-3 w-full text-sm font-semibold text-slate-500" onClick={() => navigate('/investments')}>
                  Back to packages
                </button>
              </div>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
