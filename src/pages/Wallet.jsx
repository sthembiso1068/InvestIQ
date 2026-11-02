import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Copy, Landmark } from 'lucide-react';
import { TransactionTable } from '../components/TransactionTable';
import { Alert, Button, Card, Disclaimer, Field, inputClass, Money, PageHeader } from '../components/ui';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatZAR, parseRandToCents } from '../lib/format';
import { useTitle } from '../hooks/useTitle';
import { addPayoutMethod, removePayoutMethod, requestDeposit, requestWithdrawal } from '../services/api';
import { validatePayoutMethod } from '../lib/validators';

const EMPTY_METHOD = { bank: 'FNB', accountType: 'Cheque', accountName: '', accountNumber: '', branchCode: '' };

export default function Wallet() {
  const { data, loading, refresh } = useWorkspace();
  const [params] = useSearchParams();
  const intent = params.get('intent');
  useTitle('Wallet');
  const [depositAmount, setDepositAmount] = useState('');
  const [methodId, setMethodId] = useState('eft');
  const [depositNote, setDepositNote] = useState('');
  const [depositError, setDepositError] = useState('');
  const [depositMessage, setDepositMessage] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payoutId, setPayoutId] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawMessage, setWithdrawMessage] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [showMethod, setShowMethod] = useState(false);
  const [methodForm, setMethodForm] = useState(EMPTY_METHOD);
  const [methodErrors, setMethodErrors] = useState({});
  const [methodLoading, setMethodLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!intent) return;
    document.getElementById(intent === 'withdraw' ? 'withdraw-panel' : 'deposit-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [intent]);

  useEffect(() => {
    if (!payoutId && data?.payoutMethods?.[0]) setPayoutId(data.payoutMethods[0].id);
  }, [data, payoutId]);

  if (loading && !data) return <Card className="h-64 animate-pulse bg-slate-100" />;
  if (!data) return null;

  const suspended = data.status === 'suspended';
  const deposits = data.transactions.filter((tx) => tx.type === 'deposit');
  const withdrawals = data.transactions.filter((tx) => tx.type === 'withdrawal');
  const selectedMethod = data.paymentMethods.find((item) => item.id === methodId);

  async function onDeposit(event) {
    event.preventDefault();
    setDepositError('');
    setDepositMessage('');
    const amountCents = parseRandToCents(depositAmount);
    if (amountCents === null) {
      setDepositError('Enter an amount such as 2500.00.');
      return;
    }
    setDepositLoading(true);
    try {
      const result = await requestDeposit({ amountCents, methodId, note: depositNote });
      setDepositMessage(`${result.transaction.reference} is pending. An administrator must approve this simulated deposit before it is added to your available balance.`);
      setDepositAmount('');
      setDepositNote('');
      refresh();
    } catch (error) {
      setDepositError(error.message);
    } finally {
      setDepositLoading(false);
    }
  }

  async function onWithdraw(event) {
    event.preventDefault();
    setWithdrawError('');
    setWithdrawMessage('');
    const amountCents = parseRandToCents(withdrawAmount);
    if (amountCents === null) {
      setWithdrawError('Enter an amount such as 500.00.');
      return;
    }
    if (!payoutId) {
      setWithdrawError('Save a demo withdrawal account first.');
      return;
    }
    setWithdrawLoading(true);
    try {
      const result = await requestWithdrawal({ amountCents, payoutMethodId: payoutId });
      setWithdrawMessage(`${result.transaction.reference} is pending. ${formatZAR(amountCents)} is on hold and has been removed from your available balance until the request is completed or rejected.`);
      setWithdrawAmount('');
      refresh();
    } catch (error) {
      setWithdrawError(error.message);
    } finally {
      setWithdrawLoading(false);
    }
  }

  async function onAddMethod(event) {
    event.preventDefault();
    const next = validatePayoutMethod(methodForm);
    setMethodErrors(next);
    if (Object.keys(next).length) return;
    setMethodLoading(true);
    try {
      await addPayoutMethod(methodForm);
      setMethodForm(EMPTY_METHOD);
      setShowMethod(false);
      refresh();
    } catch (error) {
      setMethodErrors({ form: error.message });
    } finally {
      setMethodLoading(false);
    }
  }

  async function onRemove(id) {
    try {
      await removePayoutMethod(id);
      if (payoutId === id) setPayoutId('');
      refresh();
    } catch (error) {
      setWithdrawError(error.message);
    }
  }

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(data.bankDetails.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Funds"
        title="Wallet"
        subtitle="Deposits stay pending until an administrator approves them. Withdrawals can only use your available balance."
      />
      <Disclaimer className="mb-5" />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="bg-navy p-4 text-white">
          <p className="text-xs uppercase tracking-[0.14em] text-gold">Available</p>
          <p className="mt-2 text-2xl font-semibold text-gold tabular">{formatZAR(data.balances.availableCents)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Invested</p>
          <Money cents={data.balances.investedCents} className="mt-2 block text-2xl font-semibold" />
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total balance</p>
          <Money cents={data.balances.totalCents} className="mt-2 block text-2xl font-semibold" />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5" id="deposit-panel">
          <div className="flex items-center gap-2">
            <Landmark className="text-navy" size={18} />
            <h2 className="text-lg font-semibold text-navy">Demo deposit</h2>
          </div>
          <form className="mt-4 space-y-4" onSubmit={onDeposit}>
            {depositError ? <Alert tone="danger">{depositError}</Alert> : null}
            {depositMessage ? <Alert tone="success">{depositMessage}</Alert> : null}
            <Field label="Amount (ZAR)" hint={`Between ${formatZAR(data.limits.depositMinCents)} and ${formatZAR(data.limits.depositMaxCents)}.`} error={null}>
              <input className={inputClass()} inputMode="decimal" placeholder="2500.00" value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} />
            </Field>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Payment method</legend>
              <div className="grid gap-2">
                {data.paymentMethods.map((method) => (
                  <label key={method.id} className={`rounded-xl border px-3 py-3 text-sm ${methodId === method.id ? 'border-gold bg-[#FBF6E4]' : 'border-slate-200'}`}>
                    <span className="flex items-start gap-2">
                      <input type="radio" name="pay" className="mt-1 accent-navy" checked={methodId === method.id} onChange={() => setMethodId(method.id)} />
                      <span>
                        <span className="block font-semibold text-navy">{method.name}</span>
                        <span className="mt-0.5 block text-slate-500">{method.detail}</span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            {selectedMethod ? (
              <div className="rounded-2xl bg-navy p-4 text-sm text-slate-200">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Simulated payment details</p>
                <dl className="mt-3 space-y-1">
                  <div className="flex justify-between gap-4"><dt>Bank</dt><dd>{data.bankDetails.bank}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Account name</dt><dd>{data.bankDetails.accountName}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Account number</dt><dd className="tabular">{data.bankDetails.accountNumber}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Branch</dt><dd className="tabular">{data.bankDetails.branchCode}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Reference</dt><dd className="font-semibold text-gold">{data.bankDetails.reference}</dd></div>
                </dl>
                <p className="mt-3 text-xs leading-5 text-slate-400">{data.bankDetails.notice}</p>
                <button type="button" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold" onClick={copyReference}>
                  <Copy size={14} /> {copied ? 'Reference copied' : 'Copy reference'}
                </button>
              </div>
            ) : null}
            <Field label="Note" hint="Optional. This stays on the demo request.">
              <input className={inputClass()} value={depositNote} placeholder="Simulated proof of payment" onChange={(event) => setDepositNote(event.target.value)} />
            </Field>
            <Button type="submit" disabled={suspended} loading={depositLoading}>Submit demo deposit request</Button>
          </form>
        </Card>

        <Card className="p-5" id="withdraw-panel">
          <h2 className="text-lg font-semibold text-navy">Demo withdrawal</h2>
          <p className="mt-1 text-sm text-slate-500">Available to withdraw: <Money cents={data.balances.availableCents} className="font-semibold" /></p>
          <form className="mt-4 space-y-4" onSubmit={onWithdraw}>
            {withdrawError ? <Alert tone="danger">{withdrawError}</Alert> : null}
            {withdrawMessage ? <Alert tone="success">{withdrawMessage}</Alert> : null}
            <Field label="Amount (ZAR)" hint={`Minimum ${formatZAR(data.limits.withdrawalMinCents)}. Pending requests keep the funds on hold.`}>
              <input className={inputClass()} inputMode="decimal" placeholder="500.00" value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Saved withdrawal account</p>
              <div className="space-y-2">
                {data.payoutMethods.length === 0 ? <p className="text-sm text-slate-500">Add a demo bank account before requesting a withdrawal.</p> : null}
                {data.payoutMethods.map((method) => (
                  <label key={method.id} className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-3 text-sm ${payoutId === method.id ? 'border-gold bg-[#FBF6E4]' : 'border-slate-200'}`}>
                    <span className="flex gap-2">
                      <input type="radio" name="payout" className="mt-1 accent-navy" checked={payoutId === method.id} onChange={() => setPayoutId(method.id)} />
                      <span>
                        <span className="block font-semibold text-navy">{method.bank} {method.accountType}</span>
                        <span className="block text-slate-500">{method.accountName} · {method.accountNumberMasked}</span>
                        <span className="text-xs text-slate-400">Demo account · branch {method.branchCode}</span>
                      </span>
                    </span>
                    <button type="button" className="text-xs font-semibold text-negative" onClick={() => onRemove(method.id)}>Remove</button>
                  </label>
                ))}
              </div>
              <button type="button" className="mt-3 text-sm font-semibold text-navy" onClick={() => setShowMethod((current) => !current)}>
                {showMethod ? 'Close form' : 'Add withdrawal account'}
              </button>
              {showMethod ? (
                <div className="mt-3 space-y-3 rounded-2xl bg-canvas p-3">
                  {methodErrors.form ? <Alert tone="danger">{methodErrors.form}</Alert> : null}
                  <Field label="Bank" error={methodErrors.bank}>
                    <select className={inputClass(methodErrors.bank)} value={methodForm.bank} onChange={(event) => setMethodForm({ ...methodForm, bank: event.target.value })}>
                      {data.banks.map((bank) => <option key={bank}>{bank}</option>)}
                    </select>
                  </Field>
                  <Field label="Account type">
                    <select className={inputClass()} value={methodForm.accountType} onChange={(event) => setMethodForm({ ...methodForm, accountType: event.target.value })}>
                      <option>Cheque</option>
                      <option>Savings</option>
                    </select>
                  </Field>
                  <Field label="Account holder" error={methodErrors.accountName}>
                    <input className={inputClass(methodErrors.accountName)} value={methodForm.accountName} onChange={(event) => setMethodForm({ ...methodForm, accountName: event.target.value })} />
                  </Field>
                  <Field label="Account number" error={methodErrors.accountNumber}>
                    <input className={inputClass(methodErrors.accountNumber)} value={methodForm.accountNumber} onChange={(event) => setMethodForm({ ...methodForm, accountNumber: event.target.value })} />
                  </Field>
                  <Field label="Branch code" error={methodErrors.branchCode}>
                    <input className={inputClass(methodErrors.branchCode)} value={methodForm.branchCode} onChange={(event) => setMethodForm({ ...methodForm, branchCode: event.target.value })} />
                  </Field>
                  <Button type="button" variant="secondary" loading={methodLoading} onClick={onAddMethod}>Save demo account</Button>
                </div>
              ) : null}
            </div>
            <Button type="submit" variant="secondary" disabled={suspended} loading={withdrawLoading}>Submit demo withdrawal</Button>
          </form>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="px-5 pt-5 text-base font-semibold text-navy">Deposit requests</h2>
          <TransactionTable rows={deposits} emptyTitle="No deposit requests" emptyBody="Submit a simulated deposit to see it listed as pending." />
        </Card>
        <Card>
          <h2 className="px-5 pt-5 text-base font-semibold text-navy">Withdrawal requests</h2>
          <TransactionTable rows={withdrawals} emptyTitle="No withdrawal requests" emptyBody="Withdrawals from available funds will be listed here with their status." />
        </Card>
      </div>
    </div>
  );
}
