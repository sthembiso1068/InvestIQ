import { useState } from 'react';
import { ApplicationRecord } from '../components/ApplicationRecord';
import { TransactionTable } from '../components/TransactionTable';
import { Alert, Button, Card, Field, inputClass, Money, PageHeader } from '../components/ui';
import { useWorkspace } from '../context/WorkspaceContext';
import { WITHDRAWAL_WAIT_MESSAGE } from '../lib/application';
import { formatZAR, maskAccount, parseRandToCents } from '../lib/format';
import { useTitle } from '../hooks/useTitle';
import { requestWithdrawal } from '../services/api';

export default function Wallet() {
  const { data, loading, refresh } = useWorkspace();
  useTitle('Wallet');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawMessage, setWithdrawMessage] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  if (loading && !data) return <Card className="h-64 animate-pulse bg-slate-100" />;
  if (!data) return null;

  const application = data.profile?.application;
  const suspended = data.status === 'suspended';
  const withdrawals = data.transactions.filter((tx) => tx.type === 'withdrawal');
  const deposits = data.transactions.filter((tx) => tx.type === 'deposit');
  const payout = data.payoutMethods[0];
  const waiting = withdrawals.some((tx) => tx.status === 'pending' || tx.status === 'processing');

  async function onWithdraw(event) {
    event.preventDefault();
    setWithdrawError('');
    setWithdrawMessage('');
    const amountCents = parseRandToCents(withdrawAmount);
    if (amountCents === null) {
      setWithdrawError('Enter an amount such as 500.00.');
      return;
    }
    if (!payout) {
      setWithdrawError('No bank account is saved on this investment form.');
      return;
    }
    setWithdrawLoading(true);
    try {
      await requestWithdrawal({ amountCents, payoutMethodId: payout.id });
      setWithdrawMessage(WITHDRAWAL_WAIT_MESSAGE);
      setWithdrawAmount('');
      refresh();
    } catch (error) {
      setWithdrawError(error.message);
    } finally {
      setWithdrawLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Client tracking"
        title="Wallet"
        subtitle="Your investment form is kept here. Only an administrator can deposit the amount you selected."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ember">Available</p>
          <p className="mt-3 text-3xl font-semibold text-white tabular">{formatZAR(data.balances.availableCents)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Invested</p>
          <Money cents={data.balances.investedCents} className="mt-2 block text-2xl font-semibold" />
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Selected amount</p>
          <Money cents={application?.investmentAmountCents || 0} className="mt-2 block text-2xl font-semibold" />
        </Card>
      </div>

      <ApplicationRecord application={application} title="Investment form" />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5" id="withdraw-panel">
          <h2 className="text-lg font-semibold text-navy">Withdrawal</h2>
          <p className="mt-1 text-sm text-slate-500">
            Available to withdraw: <Money cents={data.balances.availableCents} className="font-semibold" />
          </p>
          {waiting || withdrawMessage ? (
            <Alert tone="warning" className="mt-4">{WITHDRAWAL_WAIT_MESSAGE}</Alert>
          ) : null}
          <form className="mt-4 space-y-4" onSubmit={onWithdraw}>
            {withdrawError ? <Alert tone="danger">{withdrawError}</Alert> : null}
            <Field label="Amount (ZAR)" hint={`Minimum ${formatZAR(data.limits.withdrawalMinCents)}. The amount stays on hold until an administrator decides.`}>
              <input className={inputClass()} inputMode="decimal" placeholder="500.00" value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} />
            </Field>
            <div className="rounded-2xl bg-canvas px-4 py-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Payout account</p>
              {payout ? (
                <p className="mt-2 font-medium text-navy">
                  {payout.bank} · {payout.accountName} · {payout.accountNumberMasked || maskAccount(application?.accountNumber)}
                </p>
              ) : (
                <p className="mt-2 text-slate-500">The bank account from your investment form will be used.</p>
              )}
            </div>
            <Button type="submit" variant="secondary" disabled={suspended} loading={withdrawLoading}>Submit withdrawal</Button>
          </form>
        </Card>
        <Card>
          <h2 className="px-5 pt-5 text-base font-semibold text-navy">Administrator deposits</h2>
          <p className="px-5 pt-1 text-sm text-slate-500">Clients cannot submit a deposit. These entries are posted by an administrator.</p>
          <TransactionTable rows={deposits} emptyTitle="No deposit yet" emptyBody="The selected investment amount appears here after an administrator deposits it." />
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="px-5 pt-5 text-base font-semibold text-navy">Withdrawal requests</h2>
        <TransactionTable rows={withdrawals} emptyTitle="No withdrawal requests" emptyBody="A withdrawal stays here until an administrator approves it." />
      </Card>
    </div>
  );
}
