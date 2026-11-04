import { formatZAR } from '../lib/format';
import { WITHDRAWAL_WAIT_MESSAGE } from '../lib/application';
import { Card, Money } from './ui';

function formatId(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 13) return value || '—';
  return `${digits.slice(0, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`;
}

function Row({ label, value }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-navy">{value || '—'}</dd>
    </div>
  );
}

export function ApplicationRecord({ application, title = 'Client record' }) {
  if (!application) {
    return (
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-navy">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">This account has no investment form on file.</p>
      </Card>
    );
  }

  const funded = application.fundingStatus === 'deposited';

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-navy">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">Details captured on the SV Capital investment form.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${funded ? 'bg-emerald-50 text-positive' : 'bg-amber-50 text-amber-800'}`}>
          {funded ? 'Deposited by administrator' : 'Waiting for administrator deposit'}
        </span>
      </div>
      <dl className="mt-2">
        <Row label="Title" value={application.title} />
        <Row label="Name" value={application.firstName} />
        <Row label="Surname" value={application.surname} />
        <Row label="Gender" value={application.gender} />
        <Row label="Date of birth" value={application.dateOfBirth} />
        <Row label="ID number" value={formatId(application.idNumber)} />
        <Row label="Address" value={application.address} />
        <Row label="Occupation" value={application.occupation} />
        <Row label="Investment amount" value={formatZAR(application.investmentAmountCents)} />
        <Row label="Investment duration" value={`${application.optionName} (${application.days} days)`} />
        <Row label="Investment date" value={application.investmentDate} />
        <Row label="Bank name" value={application.bankName} />
        <Row label="Bank account number" value={application.accountNumber} />
        <Row label="Referral name" value={application.referralName} />
        <Row label="Referral number" value={application.referralNumber} />
      </dl>
      <p className="mt-4 text-sm text-slate-600">
        {funded
          ? <>An administrator deposited <Money cents={application.investmentAmountCents} className="font-semibold" /> for this investment.</>
          : <>An administrator still needs to deposit <Money cents={application.investmentAmountCents} className="font-semibold" />. Clients cannot deposit this amount themselves.</>}
      </p>
    </Card>
  );
}

export { WITHDRAWAL_WAIT_MESSAGE };
