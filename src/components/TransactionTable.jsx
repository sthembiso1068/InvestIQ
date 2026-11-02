import { Link } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { formatDateTime } from '../lib/format';
import { amountPresentation, transactionDetail, transactionTitle } from '../lib/present';
import { EmptyState, Money, StatusPill } from './ui';

export function TransactionTable({ rows = [], showClient = false, emptyTitle = 'No transactions yet', emptyBody = 'Deposits, investments, and withdrawals will be listed here.' }) {
  if (!rows.length) {
    return <EmptyState icon={Receipt} title={emptyTitle} body={emptyBody} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-semibold sm:px-5">Date</th>
            {showClient ? <th className="px-4 py-3 font-semibold">Client</th> : null}
            <th className="px-4 py-3 font-semibold">Description</th>
            <th className="px-4 py-3 font-semibold">Reference</th>
            <th className="px-4 py-3 text-right font-semibold">Amount</th>
            <th className="px-4 py-3 font-semibold sm:px-5">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tx) => {
            const amount = amountPresentation(tx);
            return (
              <tr key={tx.id} className="border-t border-slate-100 align-top">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500 sm:px-5">{formatDateTime(tx.createdAt)}</td>
                {showClient ? (
                  <td className="px-4 py-3">
                    <span className="block font-medium text-navy">{tx.userName}</span>
                    <span className="text-xs text-slate-500">{tx.userEmail}</span>
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  <p className="font-medium text-navy">
                    {transactionTitle(tx)}
                    {tx.simulation && (tx.type === 'profit' || tx.type === 'deposit' || tx.type === 'withdrawal') ? (
                      <span className="ml-2 rounded-full bg-[#F8F1D8] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7A5B10]">Demo</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 max-w-xs text-xs leading-5 text-slate-500">{transactionDetail(tx)}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">{tx.reference}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                  <Money cents={amount.cents} signed={amount.signed} tone={amount.tone} />
                </td>
                <td className="px-4 py-3 sm:px-5">
                  <StatusPill status={tx.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ViewAllLink({ to = '/transactions', children = 'View all transactions' }) {
  return (
    <Link to={to} className="text-sm font-semibold text-navy hover:text-[#8A6D1B]">
      {children}
    </Link>
  );
}
