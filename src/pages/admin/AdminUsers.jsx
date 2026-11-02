import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Avatar, Card, Money, PageHeader, StatusPill, inputClass } from '../../components/ui';
import { formatDate } from '../../lib/format';
import { useTitle } from '../../hooks/useTitle';
import { adminListUsers } from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [role, setRole] = useState('all');
  useTitle('Users');

  useEffect(() => {
    let cancel = false;
    adminListUsers()
      .then((rows) => {
        if (!cancel) setUsers(rows);
      })
      .catch((err) => {
        if (!cancel) setError(err.message);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      if (status !== 'all' && user.status !== status) return false;
      if (role !== 'all' && user.role !== role) return false;
      if (!query) return true;
      return `${user.name} ${user.email} ${user.phone} ${user.clientNumber}`.toLowerCase().includes(query);
    });
  }, [users, search, status, role]);

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Registered users" subtitle="Search clients, review balances, and open a profile to manage status." />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row">
          <label className="relative block flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputClass()} pl-9`} placeholder="Search name, email, or phone" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <select className={inputClass()} value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status">
            <option value="all">Any status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="closed">Closed</option>
          </select>
          <select className={inputClass()} value={role} onChange={(event) => setRole(event.target.value)} aria-label="Role">
            <option value="all">Any role</option>
            <option value="client">Clients</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
        {error ? <p className="p-5 text-sm text-negative">{error}</p> : null}
        {loading ? <div className="h-48 animate-pulse bg-slate-100" /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Available</th>
                  <th className="px-4 py-3 font-semibold">Invested</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-5 py-3">
                      <Link to={`/admin/users/${user.id}`} className="flex items-center gap-3">
                        <Avatar name={user.name} src={user.avatarDataUrl} size="sm" />
                        <span>
                          <span className="block font-semibold text-navy">{user.name}</span>
                          <span className="text-xs text-slate-500">{user.clientNumber} · {user.role}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block text-navy">{user.email}</span>
                      <span className="text-xs text-slate-500">{user.phone}</span>
                    </td>
                    <td className="px-4 py-3"><Money cents={user.balances.availableCents} /></td>
                    <td className="px-4 py-3"><Money cents={user.balances.investedCents} /></td>
                    <td className="px-4 py-3"><StatusPill status={user.status} /></td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? <p className="px-5 py-8 text-sm text-slate-500">No users match this search.</p> : null}
          </div>
        )}
      </Card>
    </div>
  );
}
