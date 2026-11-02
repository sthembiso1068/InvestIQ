import { useEffect, useMemo, useState } from 'react';
import { PackageTable } from '../../components/PackageTable';
import { Alert, Button, Card, Disclaimer, Field, Modal, PageHeader, inputClass } from '../../components/ui';
import { useWorkspace } from '../../context/WorkspaceContext';
import { formatZAR, parseRandToCents } from '../../lib/format';
import { useTitle } from '../../hooks/useTitle';
import { adminUpdatePricing } from '../../services/api';

function toDraft(pricing) {
  return {
    minimumRand: (pricing.minimumCents / 100).toFixed(2),
    amountsCents: [...pricing.amountsCents],
    options: pricing.options.map((option) => ({
      ...option,
      days: String(option.days),
      profitPercent: String(option.profitPercent),
    })),
    amountInput: '',
  };
}

export default function AdminPackages() {
  const { data, refresh } = useWorkspace();
  const [draft, setDraft] = useState(null);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useTitle('Packages');

  useEffect(() => {
    if (data?.pricing && !draft) setDraft(toDraft(data.pricing));
  }, [data, draft]);

  const preview = useMemo(() => {
    if (!draft) return null;
    const minimumCents = parseRandToCents(draft.minimumRand);
    return {
      minimumCents: minimumCents || 0,
      amountsCents: draft.amountsCents,
      options: draft.options.map((option) => ({
        id: option.id,
        name: option.name || 'Option',
        days: Number(option.days) || 0,
        profitPercent: Number(option.profitPercent) || 0,
      })),
    };
  }, [draft]);

  if (!draft || !preview) return <Card className="h-64 animate-pulse bg-slate-100" />;

  function updateOption(index, field, value) {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => (optionIndex === index ? { ...option, [field]: value } : option)),
    }));
  }

  function addAmount() {
    const cents = parseRandToCents(draft.amountInput);
    setError('');
    if (cents === null) {
      setError('Enter an amount such as 15000.00.');
      return;
    }
    if (draft.amountsCents.includes(cents)) {
      setError('That amount is already on the rate card.');
      return;
    }
    setDraft({ ...draft, amountsCents: [...draft.amountsCents, cents].sort((a, b) => a - b), amountInput: '' });
  }

  async function onSave() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const minimumCents = parseRandToCents(draft.minimumRand);
      const saved = await adminUpdatePricing(
        {
          minimumCents,
          amountsCents: draft.amountsCents,
          options: draft.options.map((option) => ({
            id: option.id,
            name: option.name,
            days: Number(option.days),
            profitPercent: Number(option.profitPercent),
          })),
        },
        reason,
      );
      setReason('');
      setReasonOpen(false);
      setDraft(toDraft(saved));
      setMessage('Rate card saved. Existing investments keep the rate they were opened with.');
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
        title="Investment packages"
        subtitle="Changes apply to new investments. The client screens keep labelling every payout as an illustrative estimate."
        actions={<Button type="button" onClick={() => { setError(''); setReasonOpen(true); }}>Save rate card</Button>}
      />
      <Disclaimer className="mb-4" />
      {message ? <Alert tone="success" className="mb-4">{message}</Alert> : null}
      {error ? <Alert tone="danger" className="mb-4">{error}</Alert> : null}
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <h2 className="font-semibold text-navy">Trading options</h2>
          <div className="mt-4 space-y-3">
            {draft.options.map((option, index) => (
              <div key={option.id} className="grid grid-cols-2 gap-2 rounded-xl bg-canvas p-3 sm:grid-cols-4">
                <input className={inputClass()} aria-label="Option name" value={option.name} onChange={(event) => updateOption(index, 'name', event.target.value)} />
                <input className={inputClass()} aria-label="Days" value={option.days} onChange={(event) => updateOption(index, 'days', event.target.value)} />
                <input className={inputClass()} aria-label="Illustrated profit percent" value={option.profitPercent} onChange={(event) => updateOption(index, 'profitPercent', event.target.value)} />
                <button
                  type="button"
                  className="text-sm font-semibold text-negative"
                  onClick={() => setDraft({ ...draft, options: draft.options.filter((_, optionIndex) => optionIndex !== index) })}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => setDraft({
              ...draft,
              options: [...draft.options, { id: crypto.randomUUID(), name: `Option ${draft.options.length + 1}`, days: String((Number(draft.options.at(-1)?.days) || 0) + 1), profitPercent: draft.options.at(-1)?.profitPercent || '0' }],
            })}
          >
            Add option
          </Button>
          <div className="mt-6">
            <Field label="Minimum investment (ZAR)">
              <input className={inputClass()} value={draft.minimumRand} onChange={(event) => setDraft({ ...draft, minimumRand: event.target.value })} />
            </Field>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700">Listed amounts</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {draft.amountsCents.map((amount) => (
                <button key={amount} type="button" className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-navy" onClick={() => setDraft({ ...draft, amountsCents: draft.amountsCents.filter((item) => item !== amount) })}>
                  {formatZAR(amount)} ×
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input className={inputClass()} placeholder="15000" value={draft.amountInput} onChange={(event) => setDraft({ ...draft, amountInput: event.target.value })} />
              <Button type="button" variant="secondary" onClick={addAmount}>Add</Button>
            </div>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="px-5 pt-5">
            <h2 className="font-semibold text-navy">Preview</h2>
            <p className="mt-1 text-sm text-slate-500">Clients see this table. Payouts include capital. Last updated {data?.pricing?.updatedAt ? new Date(data.pricing.updatedAt).toLocaleString('en-ZA') : '—'}.</p>
          </div>
          <div className="mt-3">
            <PackageTable pricing={preview} selectable={false} />
          </div>
        </Card>
      </div>
      <Modal
        open={reasonOpen}
        title="Save the rate card"
        onClose={() => setReasonOpen(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setReasonOpen(false)}>Cancel</Button>
            <Button type="button" loading={busy} onClick={onSave}>Save and audit</Button>
          </>
        }
      >
        {error ? <Alert tone="danger" className="mb-3">{error}</Alert> : null}
        <Field label="Reason for this change" hint="Required. Existing investments are not recalculated.">
          <textarea className={inputClass()} rows={4} value={reason} onChange={(event) => setReason(event.target.value)} />
        </Field>
      </Modal>
    </div>
  );
}
