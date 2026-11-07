import { hashPassword } from './crypto.js';
import { defaultPricing } from './ledger.js';

export const IDS = {
  admin: 'user-admin',
};

export const OWNER_EMAIL = 'kylegovender033@gmail.com';
const OWNER_PASSWORD = 'Greymayo01';

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

export async function ensureOwnerAdmin(db) {
  if (db.ownerAdminEmail === OWNER_EMAIL) return false;
  let user = db.users.find((item) => item.email === OWNER_EMAIL);
  if (!user) user = db.users.find((item) => item.id === IDS.admin);
  if (user) {
    user.email = OWNER_EMAIL;
    user.role = 'admin';
    user.status = 'active';
    if (!user.name || user.name === 'Nomsa Dlamini') user.name = 'Administrator';
    if (user.phone === '+27 11 555 0199') user.phone = '';
    user.salt = crypto.randomUUID();
    user.passwordHash = await hashPassword(OWNER_PASSWORD, user.salt);
  } else {
    db.users.unshift(
      await makeUser(
        {
          id: IDS.admin,
          name: 'Administrator',
          email: OWNER_EMAIL,
          phone: '',
          clientNumber: 'SVC10001',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
        OWNER_PASSWORD,
      ),
    );
  }
  db.ownerAdminEmail = OWNER_EMAIL;
  return true;
}

export async function buildSeed() {
  const seededAt = new Date().toISOString();
  const users = [
    await makeUser(
      {
        id: IDS.admin,
        name: 'Administrator',
        email: OWNER_EMAIL,
        phone: '',
        clientNumber: 'SVC10001',
        role: 'admin',
        createdAt: atDaysAgo(1, 9, 0),
      },
      OWNER_PASSWORD,
    ),
  ];

  return {
    version: 4,
    ownerAdminEmail: OWNER_EMAIL,
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
