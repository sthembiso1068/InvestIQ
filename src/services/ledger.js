/** Ledger math for the mock account service. Balances are never stored. */

const SCREENSHOT_PAYOUTS = [
  [2000, [3320, 3760, 4200, 4640, 5080]],
  [3000, [4980, 5640, 6300, 6960, 7620]],
  [4000, [6640, 7520, 8400, 9280, 10160]],
  [5000, [8300, 9400, 10500, 11600, 12700]],
  [6000, [9960, 11280, 12600, 13920, 15240]],
  [7000, [11620, 13160, 14700, 16240, 17780]],
  [8000, [13280, 15040, 16800, 18560, 20320]],
  [9000, [14940, 16920, 18900, 20880, 22860]],
  [10000, [16600, 18800, 21000, 23200, 25400]],
  [11000, [18260, 20680, 23100, 25520, 27940]],
  [12000, [19920, 22560, 25200, 27840, 30480]],
  [13000, [21580, 24440, 27300, 30160, 33020]],
  [14000, [23240, 26320, 29400, 32480, 35560]],
];

export const DEFAULT_PROFIT_PERCENTS = [66, 88, 110, 132, 154];

export function percentOfCents(cents, percent) {
  const basisPoints = Math.round(Number(percent) * 100);
  return Math.round((Number(cents) * basisPoints) / 10000);
}

export function illustratedProfitCents(amountCents, profitPercent) {
  return percentOfCents(amountCents, profitPercent);
}

export function illustratedPayoutCents(amountCents, profitPercent) {
  return Number(amountCents) + illustratedProfitCents(amountCents, profitPercent);
}

export function defaultPricing(updatedAt = new Date().toISOString()) {
  return {
    minimumCents: 200000,
    amountsCents: SCREENSHOT_PAYOUTS.map(([amount]) => amount * 100),
    options: [
      { id: 'opt1', name: 'Option 1', days: 3, profitPercent: 66 },
      { id: 'opt2', name: 'Option 2', days: 4, profitPercent: 88 },
      { id: 'opt3', name: 'Option 3', days: 5, profitPercent: 110 },
      { id: 'opt4', name: 'Option 4', days: 6, profitPercent: 132 },
      { id: 'opt5', name: 'Option 5', days: 7, profitPercent: 154 },
    ],
    updatedAt,
    updatedBy: 'AFR Capital rate card',
  };
}

export function verifyRateCard() {
  SCREENSHOT_PAYOUTS.forEach(([amount, payouts]) => {
    payouts.forEach((payout, index) => {
      const got = illustratedPayoutCents(amount * 100, DEFAULT_PROFIT_PERCENTS[index]);
      if (got !== payout * 100) {
        throw new Error(`Rate card mismatch for R${amount}, option ${index + 1}. Expected ${payout}.`);
      }
    });
  });
}

function zero() {
  return { available: 0, invested: 0, profit: 0 };
}

export function transactionEffect(tx) {
  const amount = Number(tx.amountCents) || 0;
  switch (tx.type) {
    case 'deposit':
      return tx.status === 'approved' ? { available: amount, invested: 0, profit: 0 } : zero();
    case 'withdrawal':
      return ['pending', 'processing', 'completed'].includes(tx.status)
        ? { available: -Math.abs(amount), invested: 0, profit: 0 }
        : zero();
    case 'investment':
      return { available: -Math.abs(amount), invested: Math.abs(amount), profit: 0 };
    case 'principal_return':
      return { available: Math.abs(amount), invested: -Math.abs(amount), profit: 0 };
    case 'profit':
      return { available: Math.abs(amount), invested: 0, profit: Math.abs(amount) };
    case 'adjustment':
      return tx.status === 'approved' ? { available: amount, invested: 0, profit: 0 } : zero();
    default:
      return zero();
  }
}

export function summarizeLedger(transactions) {
  const totals = { available: 0, invested: 0, profit: 0 };
  for (const tx of transactions) {
    const effect = transactionEffect(tx);
    totals.available += effect.available;
    totals.invested += effect.invested;
    totals.profit += effect.profit;
  }
  return {
    availableCents: totals.available,
    investedCents: totals.invested,
    profitCents: totals.profit,
    totalCents: totals.available + totals.invested,
  };
}

export function quotePackage({ pricing, optionId, amountCents, availableCents, now = new Date() }) {
  const option = pricing.options.find((item) => item.id === optionId);
  if (!option) return { valid: false, message: 'That trading period is not on the rate card.' };
  if (!pricing.amountsCents.includes(amountCents)) {
    return { valid: false, message: 'Choose an amount from the current rate card.' };
  }
  if (amountCents < pricing.minimumCents) {
    return { valid: false, message: 'This amount is below the minimum investment.' };
  }
  const profitCents = illustratedProfitCents(amountCents, option.profitPercent);
  const completesAt = new Date(now.getTime() + option.days * 86400000).toISOString();
  const sufficient = availableCents >= amountCents;
  return {
    valid: true,
    option,
    amountCents,
    profitPercent: option.profitPercent,
    profitCents,
    payoutCents: amountCents + profitCents,
    completesAt,
    availableCents,
    remainingCents: availableCents - amountCents,
    sufficient,
    message: sufficient ? '' : 'Your available balance does not cover this investment.',
  };
}

export function buildProfitSeries(transactions, days = 30) {
  const profits = transactions.filter((tx) => tx.type === 'profit');
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const points = [];
  for (let index = 0; index < days; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);
    const profitCents = profits
      .filter((tx) => new Date(tx.createdAt).getTime() <= end.getTime())
      .reduce((sum, tx) => sum + tx.amountCents, 0);
    points.push({ date: day.toISOString(), profitCents });
  }
  return points;
}

verifyRateCard();
