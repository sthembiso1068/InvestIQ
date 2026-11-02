import { buildSeed } from './seed.js';
import { maskAccount } from '../lib/format.js';

const DB_KEY = 'svcapital.db.v1';
const TOKEN_KEY = 'svcapital.token';
const EMAIL_KEY = 'svcapital.email';
export const DB_VERSION = 4;

let memory = null;
let loading = null;

function browserStore(kind) {
  try {
    if (typeof window === 'undefined') return null;
    return kind === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

function memoryStore() {
  if (!globalThis.__svMemory) globalThis.__svMemory = new Map();
  const map = globalThis.__svMemory;
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  };
}

function store() {
  return browserStore('local') || memoryStore();
}

function persist() {
  try {
    store().setItem(DB_KEY, JSON.stringify(memory));
  } catch {
    const error = new Error('This browser could not save the account records.');
    error.code = 'STORAGE';
    throw error;
  }
}

export function readToken() {
  const local = browserStore('local');
  const session = browserStore('session');
  return local?.getItem(TOKEN_KEY) || session?.getItem(TOKEN_KEY) || memoryStore().getItem(TOKEN_KEY);
}

export function writeToken(token, remember) {
  clearToken();
  const target = browserStore(remember ? 'local' : 'session') || memoryStore();
  target.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  browserStore('local')?.removeItem(TOKEN_KEY);
  browserStore('session')?.removeItem(TOKEN_KEY);
  memoryStore().removeItem(TOKEN_KEY);
}

export function rememberedEmail() {
  return browserStore('local')?.getItem(EMAIL_KEY) || '';
}

export function rememberEmail(email, remember) {
  const local = browserStore('local');
  if (!local) return;
  if (remember) local.setItem(EMAIL_KEY, email);
  else local.removeItem(EMAIL_KEY);
}

export function toClientUser(user) {
  if (!user) return null;
  const { passwordHash, salt, payoutMethods, ...rest } = user;
  return {
    ...rest,
    payoutMethods: (payoutMethods || []).map((method) => ({
      id: method.id,
      bank: method.bank,
      accountType: method.accountType,
      accountName: method.accountName,
      accountNumberMasked: maskAccount(method.accountNumber),
      branchCode: method.branchCode,
    })),
  };
}

function settle(db) {
  let changed = false;
  const now = Date.now();
  for (const investment of db.investments) {
    if (investment.status !== 'active') continue;
    if (new Date(investment.completesAt).getTime() > now) continue;
    const settledAt = new Date().toISOString();
    investment.status = 'completed';
    investment.settledAt = settledAt;
    db.transactions.push({
      id: crypto.randomUUID(),
      userId: investment.userId,
      type: 'principal_return',
      amountCents: investment.amountCents,
      status: 'completed',
      method: '',
      reference: `SVC-PRI-${Math.floor(100000 + Math.random() * 900000)}`,
      note: 'Principal returned to available funds.',
      adminReason: '',
      investmentId: investment.id,
      payoutMethodId: null,
      simulation: true,
      createdAt: settledAt,
      updatedAt: settledAt,
    });
    db.transactions.push({
      id: crypto.randomUUID(),
      userId: investment.userId,
      type: 'profit',
      amountCents: investment.illustratedProfitCents,
      status: 'completed',
      method: '',
      reference: `SVC-PRF-${Math.floor(100000 + Math.random() * 900000)}`,
      note: 'Illustrative profit credited at maturity. Not a verified trading result.',
      adminReason: '',
      investmentId: investment.id,
      payoutMethodId: null,
      simulation: true,
      createdAt: settledAt,
      updatedAt: settledAt,
    });
    changed = true;
  }
  return changed;
}

export async function ensureDb() {
  if (memory) return memory;
  if (loading) return loading;
  loading = (async () => {
    const raw = store().getItem(DB_KEY);
    if (raw) {
      try {
        memory = JSON.parse(raw);
      } catch {
        memory = null;
      }
    }
    if (!memory || memory.version !== DB_VERSION) {
      memory = await buildSeed();
      persist();
    }
    if (settle(memory)) persist();
    return memory;
  })();
  try {
    return await loading;
  } finally {
    loading = null;
  }
}

function notifyAuthLoss(error) {
  if (error?.code === 'AUTH' && typeof window !== 'undefined') {
    clearToken();
    window.dispatchEvent(new Event('svcapital:auth-lost'));
  }
}

export async function query(fn) {
  const db = await ensureDb();
  if (settle(db)) persist();
  try {
    return await fn(db);
  } catch (error) {
    notifyAuthLoss(error);
    throw error;
  }
}

export async function mutate(fn) {
  const db = await ensureDb();
  if (settle(db)) persist();
  const snapshot = JSON.stringify(db);
  try {
    const result = await fn(db);
    persist();
    return result;
  } catch (error) {
    memory = JSON.parse(snapshot);
    notifyAuthLoss(error);
    throw error;
  }
}

export async function resetDatabase() {
  memory = await buildSeed();
  persist();
  clearToken();
  return memory;
}
