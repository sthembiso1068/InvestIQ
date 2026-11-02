import { hashPassword } from './crypto.js';
import { defaultPricing, illustratedPayoutCents, illustratedProfitCents, summarizeLedger } from './ledger.js';

export const IDS = {
  thabo: 'user-thabo',
  lerato: 'user-lerato',
  admin: 'user-admin',
};

function atDaysAgo(days, hour = 10, minute = 15) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}

function plusDays(iso, days) {
  return new Date(new Date(iso).getTime() + days * 86400000).toISOString();
}

function tx(partial) {
  return {
    simulation: true,
    note: '',
    adminReason: '',
    method: '',
    investmentId: null,
    payoutMethodId: null,
    updatedAt: partial.createdAt,
    ...partial,
  };
}

function assertBalances(transactions, userId, expected, label) {
  const summary = summarizeLedger(transactions.filter((item) => item.userId === userId));
  for (const [key, value] of Object.entries(expected)) {
    if (summary[key] !== value) {
      throw new Error(`${label} ${key} expected ${value} and calculated ${summary[key]}.`);
    }
  }
}

async function makeUser(partial, password) {
  const salt = crypto.randomUUID();
  return {
    phone: '',
    status: 'active',
    role: 'client',
    avatarDataUrl: null,
    payoutMethods: [],
    settings: { emailNotices: true, withdrawalAlerts: true },
    lastLoginAt: null,
    salt,
    passwordHash: await hashPassword(password, salt),
    ...partial,
  };
}

export async function buildSeed() {
  const seededAt = new Date().toISOString();
  const thaboStart = atDaysAgo(1, 10, 0);
  const leratoStart = hoursAgo(6);

  const thaboProfit = illustratedProfitCents(200000, 66);
  const thaboPayout = illustratedPayoutCents(200000, 66);
  const leratoProfit = illustratedProfitCents(200000, 66);
  const leratoPayout = illustratedPayoutCents(200000, 66);

  const users = [
    await makeUser(
      {
        id: IDS.thabo,
        name: 'Thabo Mokoena',
        email: 'thabo@example.com',
        phone: '+27 82 555 0142',
        clientNumber: 'SVC10428',
        createdAt: atDaysAgo(48, 8, 30),
        payoutMethods: [
          {
            id: 'pay-thabo-fnb',
            bank: 'FNB',
            accountType: 'Cheque',
            accountName: 'Thabo Mokoena',
            accountNumber: '62004521876',
            branchCode: '250655',
            demo: true,
          },
        ],
      },
      'Demo@12345',
    ),
    await makeUser(
      {
        id: IDS.lerato,
        name: 'Lerato Khumalo',
        email: 'lerato@example.com',
        phone: '+27 71 444 2290',
        clientNumber: 'SVC10429',
        createdAt: atDaysAgo(15, 16, 10),
        payoutMethods: [
          {
            id: 'pay-lerato-cap',
            bank: 'Capitec',
            accountType: 'Savings',
            accountName: 'Lerato Khumalo',
            accountNumber: '1788334201',
            branchCode: '470010',
            demo: true,
          },
        ],
      },
      'Demo@12345',
    ),
    await makeUser(
      {
        id: IDS.admin,
        name: 'Nomsa Dlamini',
        email: 'admin@svcapital.demo',
        phone: '+27 11 555 0199',
        clientNumber: 'SVC10001',
        role: 'admin',
        createdAt: atDaysAgo(220, 9, 0),
      },
      'Admin@12345',
    ),
  ];

  const investments = [
    {
      id: 'inv-thabo-open',
      userId: IDS.thabo,
      optionId: 'opt1',
      optionName: 'Option 1',
      days: 3,
      amountCents: 200000,
      profitPercent: 66,
      illustratedProfitCents: thaboProfit,
      illustratedPayoutCents: thaboPayout,
      status: 'active',
      startedAt: thaboStart,
      completesAt: plusDays(thaboStart, 3),
      settledAt: null,
      reference: 'SVC-INV-191002',
      simulation: true,
    },
    {
      id: 'inv-lerato-open',
      userId: IDS.lerato,
      optionId: 'opt1',
      optionName: 'Option 1',
      days: 3,
      amountCents: 200000,
      profitPercent: 66,
      illustratedProfitCents: leratoProfit,
      illustratedPayoutCents: leratoPayout,
      status: 'active',
      startedAt: leratoStart,
      completesAt: plusDays(leratoStart, 3),
      settledAt: null,
      reference: 'SVC-INV-204118',
      simulation: true,
    },
  ];

  const transactions = [
    tx({
      id: 'tx-thabo-dep-1',
      userId: IDS.thabo,
      type: 'deposit',
      amountCents: 1000000,
      status: 'approved',
      method: 'Bank EFT (demo)',
      reference: 'SVC-DEP-240181',
      note: 'Simulated opening deposit.',
      adminReason: 'Demo proof of payment matched the simulated reference.',
      createdAt: atDaysAgo(4, 9, 12),
      updatedAt: atDaysAgo(4, 11, 5),
    }),
    tx({
      id: 'tx-thabo-inv-1',
      userId: IDS.thabo,
      type: 'investment',
      amountCents: 200000,
      status: 'completed',
      reference: 'SVC-INV-191002',
      note: 'Option 1 · 3 trading days.',
      investmentId: 'inv-thabo-open',
      createdAt: thaboStart,
    }),
    tx({
      id: 'tx-lerato-dep-1',
      userId: IDS.lerato,
      type: 'deposit',
      amountCents: 600000,
      status: 'approved',
      method: 'Capitec Pay (demo)',
      reference: 'SVC-DEP-300441',
      note: 'Simulated first deposit.',
      adminReason: 'Demo deposit approved.',
      createdAt: atDaysAgo(8, 12, 5),
      updatedAt: atDaysAgo(8, 12, 40),
    }),
    tx({
      id: 'tx-lerato-inv-1',
      userId: IDS.lerato,
      type: 'investment',
      amountCents: 200000,
      status: 'completed',
      reference: 'SVC-INV-204118',
      note: 'Option 1 · 3 trading days.',
      investmentId: 'inv-lerato-open',
      createdAt: leratoStart,
    }),
    tx({
      id: 'tx-lerato-dep-pending',
      userId: IDS.lerato,
      type: 'deposit',
      amountCents: 400000,
      status: 'pending',
      method: 'Instant EFT (demo)',
      reference: 'SVC-DEP-310902',
      note: 'Awaiting administrator review. No funds have been added.',
      createdAt: atDaysAgo(1, 17, 25),
    }),
  ];

  assertBalances(
    transactions,
    IDS.thabo,
    { availableCents: 800000, investedCents: 200000, profitCents: 0, totalCents: 1000000 },
    'Thabo',
  );
  assertBalances(
    transactions,
    IDS.lerato,
    { availableCents: 400000, investedCents: 200000, profitCents: 0, totalCents: 600000 },
    'Lerato',
  );

  const auditLog = [
    {
      id: 'audit-1',
      at: atDaysAgo(4, 11, 5),
      adminId: IDS.admin,
      adminName: 'Nomsa Dlamini',
      action: 'deposit.approved',
      targetType: 'transaction',
      targetId: 'tx-thabo-dep-1',
      targetLabel: 'SVC-DEP-240181',
      reason: 'Demo proof of payment matched the simulated reference.',
      detail: 'Credited R 10,000.00 to available funds.',
    },
    {
      id: 'audit-2',
      at: atDaysAgo(8, 12, 40),
      adminId: IDS.admin,
      adminName: 'Nomsa Dlamini',
      action: 'deposit.approved',
      targetType: 'transaction',
      targetId: 'tx-lerato-dep-1',
      targetLabel: 'SVC-DEP-300441',
      reason: 'Demo deposit approved.',
      detail: 'Credited R 6,000.00 to available funds.',
    },
  ];

  return {
    version: 2,
    demo: true,
    seededAt,
    users,
    sessions: [],
    resets: [],
    investments,
    transactions,
    auditLog,
    pricing: defaultPricing(seededAt),
  };
}
