import { hashPassword } from './crypto.js';
import { defaultPricing } from './ledger.js';

export const IDS = {
  admin: 'user-admin',
};

function atDaysAgo(days, hour = 10, minute = 15) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
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
  const users = [
    await makeUser(
      {
        id: IDS.admin,
        name: 'Nomsa Dlamini',
        email: 'admin@svcapital.co.za',
        phone: '+27 11 555 0199',
        clientNumber: 'SVC10001',
        role: 'admin',
        createdAt: atDaysAgo(220, 9, 0),
      },
      'Admin@12345',
    ),
  ];

  return {
    version: 4,
    seededAt,
    users,
    sessions: [],
    resets: [],
    investments: [],
    transactions: [],
    auditLog: [],
    pricing: defaultPricing(seededAt),
  };
}
