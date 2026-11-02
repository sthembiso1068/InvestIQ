import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, PageHeader, inputClass } from '../../components/ui';
import { formatDateTime } from '../../lib/format';
import { useTitle } from '../../hooks/useTitle';
import { adminAudit } from '../../services/api';

export default function AdminAudit() {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  useTitle('Audit log');

  useEffect(() => {
    adminAudit().then(setEntries).catch((err) => setError(err.message));
  }, []);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) => `${entry.action} ${entry.adminName} ${entry.reason} ${entry.targetLabel} ${entry.detail}`.toLowerCase().includes(query));
  }, [entries, search]);

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Audit log"
        subtitle="Status changes, request decisions, balance adjustments, and rate-card edits are recorded with a reason."
      />
      <Card>
        <div className="border-b border-slate-100 p-4">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputClass()} pl-9`} placeholder="Search action, client, or reason" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
        </div>
        {error ? <p className="p-5 text-sm text-negative">{error}</p> : null}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Administrator</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Target</th>
                <th className="px-5 py-3 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr key={entry.id} className="border-t border-slate-100 align-top">
                  <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDateTime(entry.at)}</td>
                  <td className="px-4 py-3 font-medium text-navy">{entry.adminName}</td>
                  <td className="px-4 py-3 text-navy">{entry.action}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-navy">{entry.targetLabel}</span>
                    <span className="block text-xs text-slate-500">{entry.detail}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{entry.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <p className="px-5 py-8 text-sm text-slate-500">No audit entries match this search.</p> : null}
        </div>
      </Card>
    </div>
  );
}
