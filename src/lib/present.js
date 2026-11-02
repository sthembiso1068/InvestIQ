export const TRANSACTION_TYPES = [
  { id: 'all', label: 'All activity' },
  { id: 'deposit', label: 'Deposits' },
  { id: 'withdrawal', label: 'Withdrawals' },
  { id: 'investment', label: 'Investments' },
  { id: 'principal_return', label: 'Principal returned' },
  { id: 'profit', label: 'Illustrative profit' },
  { id: 'adjustment', label: 'Adjustments' },
];

export const STATUS_FILTERS = [
  { id: 'all', label: 'Any status' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'approved', label: 'Approved' },
  { id: 'completed', label: 'Completed' },
  { id: 'rejected', label: 'Rejected' },
];

const STATUS_TEXT = {
  pending: 'Pending',
  processing: 'Processing',
  approved: 'Approved',
  completed: 'Completed',
  rejected: 'Rejected',
  posted: 'Posted',
  active: 'Active',
  suspended: 'Suspended',
  closed: 'Closed',
  available: 'Available',
};

export function statusLabel(status) {
  return STATUS_TEXT[status] || status;
}

export function transactionTitle(tx) {
  switch (tx.type) {
    case 'deposit':
      return 'Deposit';
    case 'withdrawal':
      return 'Withdrawal';
    case 'investment':
      return 'Investment allocated';
    case 'principal_return':
      return 'Principal returned';
    case 'profit':
      return 'Illustrative profit';
    case 'adjustment':
      return tx.amountCents < 0 ? 'Balance debit' : 'Balance credit';
    default:
      return 'Transaction';
  }
}

export function transactionDetail(tx) {
  if (tx.type === 'profit') return 'Simulated credit. Not a verified trading result.';
  if (tx.type === 'principal_return') return 'Simulated maturity. Principal returned to available funds.';
  if (tx.type === 'investment') return tx.note || 'Moved from available funds into an active investment.';
  if (tx.adminReason) return tx.adminReason;
  return tx.note || tx.method || 'Demo ledger entry';
}

export function amountPresentation(tx) {
  if (tx.type === 'deposit') {
    return { cents: tx.amountCents, signed: true, tone: tx.status === 'approved' ? 'positive' : 'muted' };
  }
  if (tx.type === 'withdrawal') {
    return { cents: -tx.amountCents, signed: true, tone: tx.status === 'rejected' ? 'muted' : 'negative' };
  }
  if (tx.type === 'investment') return { cents: -tx.amountCents, signed: true, tone: 'neutral' };
  if (tx.type === 'principal_return') return { cents: tx.amountCents, signed: true, tone: 'neutral' };
  if (tx.type === 'profit') return { cents: tx.amountCents, signed: true, tone: 'positive' };
  if (tx.type === 'adjustment') {
    return { cents: tx.amountCents, signed: true, tone: tx.amountCents < 0 ? 'negative' : 'positive' };
  }
  return { cents: tx.amountCents, signed: false, tone: 'neutral' };
}
