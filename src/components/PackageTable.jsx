import { cx, formatPercent, formatZAR } from '../lib/format';
import { illustratedPayoutCents, illustratedProfitCents } from '../services/ledger';

export function PackageTable({ pricing, selectedOptionId, selectedAmountCents, onSelect, selectable = true }) {
  const options = [...(pricing?.options || [])].sort((a, b) => a.days - b.days);
  const amounts = [...(pricing?.amountsCents || [])].sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[760px] w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-navy px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gold">
              You invest
            </th>
            {options.map((option) => {
              const selected = option.id === selectedOptionId;
              return (
                <th
                  key={option.id}
                  className={cx('px-4 py-3 text-left', selected ? 'bg-[#ff6a00]/20 text-white' : 'bg-ink text-white')}
                >
                  <span className="block text-xs font-semibold uppercase tracking-wide text-gold">{option.name}</span>
                  <span className="mt-1 block text-sm font-semibold">{option.days} days</span>
                  <span className="mt-0.5 block text-[11px] font-medium text-slate-300">
                    Illustrated profit {formatPercent(option.profitPercent)}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {amounts.map((amount, index) => (
            <tr key={amount}>
              <th
                scope="row"
                className={cx(
                  'sticky left-0 z-10 px-4 py-3 text-left font-semibold text-white',
                  index % 2 ? 'bg-[#16171c]' : 'bg-[#121318]',
                )}
              >
                {formatZAR(amount)}
              </th>
              {options.map((option) => {
                const payout = illustratedPayoutCents(amount, option.profitPercent);
                const profit = illustratedProfitCents(amount, option.profitPercent);
                const selected = option.id === selectedOptionId && amount === selectedAmountCents;
                const column = option.id === selectedOptionId;
                return (
                  <td key={option.id} className={cx('px-2 py-2', index % 2 ? 'bg-white/[0.03]' : 'bg-[#121318]', column && 'bg-[#ff6a00]/10')}>
                    {selectable ? (
                      <button
                        type="button"
                        onClick={() => onSelect?.(option.id, amount)}
                        className={cx(
                          'w-full rounded-xl px-2 py-2 text-left transition hover:bg-white/5',
                          selected && 'bg-ember text-white shadow-sm',
                        )}
                      >
                        <span className={cx('block font-semibold tabular', selected ? 'text-white' : 'text-navy')}>{formatZAR(payout)}</span>
                        <span className={cx('mt-0.5 block text-[11px]', selected ? 'text-white/80' : 'text-slate-500')}>
                          Profit {formatZAR(profit)}
                        </span>
                      </button>
                    ) : (
                      <div className="px-2 py-2">
                        <span className="block font-semibold tabular text-navy">{formatZAR(payout)}</span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">Profit {formatZAR(profit)}</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
