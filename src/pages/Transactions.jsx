import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { TransactionTable } from '../components/TransactionTable';
import { Card, PageHeader, inputClass } from '../components/ui';
import { useWorkspace } from '../context/WorkspaceContext';
import { STATUS_FILTERS, TRANSACTION_TYPES } from '../lib/present';
import { useTitle } from '../hooks/useTitle';

export default function Transactions() {
  const { data, loading } = useWorkspace();
  useTitle('Transactions');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const source = data?.transactions || [];
    const query = search.trim().toLowerCase();
    return source.filter((tx) => {
      if (type !== 'all' && tx.type !== type) return false;
      if (status !== 'all' && tx.status !== status) return false;
      if (!query) return true;
      return `${tx.reference} ${tx.note || ''} ${tx.method || ''} ${tx.adminReason || ''}`.toLowerCase().includes(query);
    });
  }, [data, type, status, search]);

  return (
    <div>
      <PageHeader
        eyebrow="Ledger"
        title="Transactions"
        subtitle="Every entry that affects this account. Balances are the sum of these records, not a number you can edit."
      />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <label className="relative block flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputClass()} pl-9`} placeholder="Search reference or note" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <select className={inputClass()} value={type} onChange={(event) => setType(event.target.value)} aria-label="Transaction type">
            {TRANSACTION_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <select className={inputClass()} value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status">
            {STATUS_FILTERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </div>
        {loading && !data ? <div className="h-48 animate-pulse bg-slate-100" /> : (
          <TransactionTable
            rows={rows}
            emptyTitle={data?.transactions?.length ? 'No matching transactions' : 'No transactions yet'}
            emptyBody={data?.transactions?.length ? 'Try another filter or clear the search.' : 'Your ledger is empty. A simulated deposit is the usual first entry.'}
          />
        )}
      </Card>
    </div>
  );
}
