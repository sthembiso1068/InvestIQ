/**
 * Mock account API.
 *
 * Screens call these functions only. Balances are derived from the ledger
 * and are never stored as an editable number.
 *
 * Replace the bodies with fetch() calls when a real server is connected.
 * Keep the function names and the returned shapes.
 */
import { byNewest } from '../lib/format.js';
import {
  isEmail,
  isSAPhone,
  validatePassword,
  validatePayoutMethod,
  validateProfile,
  validateRegistration,
} from '../lib/validators.js';
import { hashPassword } from './crypto.js';
import {
  clearToken,
  ensureDb,
  mutate,
  query,
  readToken,
  rememberEmail,
  rememberedEmail,
  resetDatabase,
  toClientUser,
  writeToken,
} from './db.js';
import { buildProfitSeries, quotePackage, summarizeLedger } from './ledger.js';

export class ApiError extends Error {
  constructor(message, { code = 'BAD_REQUEST', fields = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.fields = fields;
  }
}

export const PAYMENT_METHODS = [
  {
    id: 'eft',
    name: 'Bank EFT (demo)',
    detail: 'Use the simulated account details. Nothing is sent to a real bank.',
  },
  {
    id: 'instant',
    name: 'Instant EFT (demo)',
    detail: 'A simulated instant EFT. No payment provider is contacted.',
  },
  {
    id: 'capitec',
    name: 'Capitec Pay (demo)',
    detail: 'A simulated Capitec Pay request. No wallet or bank is debited.',
  },
];

export const BANKS = ['FNB', 'Standard Bank', 'Absa', 'Nedbank', 'Capitec', 'Investec', 'TymeBank'];

export const BANK_DETAILS = {
  bank: 'Demo Bank',
  accountName: 'SV Capital Demo Trust',
  accountNumber: '0000000000',
  branchCode: '000000',
  notice: 'Simulated details. This is not a real bank account and no payment can be received here.',
};

export const LIMITS = {
  depositMinCents: 10000,
  depositMaxCents: 100000000,
  withdrawalMinCents: 10000,
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function reference(prefix) {
  return `SVC-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
}

function requireUser(db) {
  const token = readToken();
  if (!token) throw new ApiError('Please sign in again.', { code: 'AUTH' });
  const session = db.sessions.find((item) => item.id === token);
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
    throw new ApiError('Your session has ended. Sign in again.', { code: 'AUTH' });
  }
  const user = db.users.find((item) => item.id === session.userId);
  if (!user || user.status === 'closed') {
    throw new ApiError('This account is closed.', { code: 'AUTH' });
  }
  return { user, session };
}

function requireActive(user) {
  if (user.status === 'suspended') {
    throw new ApiError('Your account is suspended. You can still view your records.');
  }
}

function requireAdmin(db) {
  const { user, session } = requireUser(db);
  if (user.role !== 'admin') throw new ApiError('Administrator access is required.', { code: 'FORBIDDEN' });
  return { user, session };
}

function balancesFor(db, userId) {
  return summarizeLedger(db.transactions.filter((tx) => tx.userId === userId));
}

function clientTransactions(db, userId) {
  return db.transactions.filter((tx) => tx.userId === userId).sort(byNewest());
}

function clientInvestments(db, userId) {
  return db.investments.filter((item) => item.userId === userId).sort(byNewest('startedAt'));
}

async function passwordMatches(user, password) {
  return (await hashPassword(password, user.salt)) === user.passwordHash;
}

function createSession(userId, remember) {
  const hours = remember ? 24 * 14 : 12;
  return {
    id: crypto.randomUUID(),
    userId,
    remember: Boolean(remember),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + hours * 3600 * 1000).toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 180) : 'This browser',
  };
}

function throwFields(errors) {
  const message = Object.values(errors)[0];
  if (message) throw new ApiError(message, { code: 'VALIDATION', fields: errors });
}

function assertReason(reason) {
  const clean = String(reason || '').trim();
  if (clean.length < 8) {
    throw new ApiError('Enter a reason of at least 8 characters. It is stored in the audit log.', {
      fields: { reason: 'A reason is required for the audit log.' },
    });
  }
  return clean;
}

function writeAudit(db, admin, entry) {
  db.auditLog.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    adminId: admin.id,
    adminName: admin.name,
    ...entry,
  });
}

function assertCents(cents, label = 'amount') {
  if (!Number.isInteger(cents) || cents <= 0) {
    throw new ApiError(`Enter a valid ${label} in rand.`, { fields: { amount: `Enter a valid ${label}.` } });
  }
}

export async function restoreSession() {
  await ensureDb();
  try {
    return await query((db) => {
      const { user } = requireUser(db);
      return toClientUser(user);
    });
  } catch (error) {
    if (error.code === 'AUTH') {
      clearToken();
      return null;
    }
    throw error;
  }
}

export async function login(email, password, remember) {
  await wait(480);
  return mutate(async (db) => {
    const user = db.users.find((item) => item.email === String(email).trim().toLowerCase());
    if (!user || !(await passwordMatches(user, password))) {
      throw new ApiError('Email or password is incorrect.');
    }
    if (user.status === 'closed') throw new ApiError('This account is closed.');
    const session = createSession(user.id, remember);
    db.sessions.push(session);
    user.lastLoginAt = new Date().toISOString();
    writeToken(session.id, remember);
    rememberEmail(user.email, remember);
    return toClientUser(user);
  });
}

export async function logout() {
  const token = readToken();
  clearToken();
  if (!token) return;
  await mutate((db) => {
    db.sessions = db.sessions.filter((item) => item.id !== token);
  });
}

export async function register(input) {
  await wait(520);
  const errors = validateRegistration(input);
  throwFields(errors);
  return mutate(async (db) => {
    const email = input.email.trim().toLowerCase();
    if (db.users.some((item) => item.email === email)) {
      throw new ApiError('An account with this email already exists.', {
        fields: { email: 'An account with this email already exists.' },
      });
    }
    const salt = crypto.randomUUID();
    const user = {
      id: crypto.randomUUID(),
      name: input.name.trim().replace(/\s+/g, ' '),
      email,
      phone: input.phone.trim(),
      clientNumber: `SVC${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'active',
      role: 'client',
      avatarDataUrl: null,
      payoutMethods: [],
      settings: { emailNotices: true, withdrawalAlerts: true },
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      salt,
      passwordHash: await hashPassword(input.password, salt),
    };
    db.users.push(user);
    const session = createSession(user.id, false);
    db.sessions.push(session);
    writeToken(session.id, false);
    return toClientUser(user);
  });
}

export async function requestPasswordReset(email) {
  await wait(420);
  if (!isEmail(email)) throw new ApiError('Enter a valid email address.', { fields: { email: 'Enter a valid email address.' } });
  return mutate(async (db) => {
    const user = db.users.find((item) => item.email === email.trim().toLowerCase());
    if (!user) throw new ApiError('No demo account uses that email address.');
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const salt = crypto.randomUUID();
    db.resets = (db.resets || []).filter((item) => item.userId !== user.id);
    db.resets.push({
      id: crypto.randomUUID(),
      userId: user.id,
      salt,
      codeHash: await hashPassword(code, salt),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      used: false,
    });
    return { email: user.email, demoCode: code, expiresMinutes: 15 };
  });
}

export async function confirmPasswordReset({ email, code, password }) {
  await wait(420);
  const errors = validatePassword(password);
  throwFields(errors);
  return mutate(async (db) => {
    const user = db.users.find((item) => item.email === String(email).trim().toLowerCase());
    const reset = (db.resets || []).find((item) => item.userId === user?.id && !item.used);
    if (!user || !reset || new Date(reset.expiresAt).getTime() < Date.now()) {
      throw new ApiError('That reset code is not valid. Request a new one.');
    }
    const hash = await hashPassword(String(code).trim(), reset.salt);
    if (hash !== reset.codeHash) throw new ApiError('That reset code is not valid.');
    user.salt = crypto.randomUUID();
    user.passwordHash = await hashPassword(password, user.salt);
    reset.used = true;
    db.sessions = db.sessions.filter((item) => item.userId !== user.id);
    clearToken();
    return true;
  });
}

export async function updateProfile(input) {
  await wait(360);
  const errors = validateProfile(input);
  throwFields(errors);
  return mutate((db) => {
    const { user } = requireUser(db);
    const email = input.email.trim().toLowerCase();
    if (db.users.some((item) => item.email === email && item.id !== user.id)) {
      throw new ApiError('Another account already uses that email.', {
        fields: { email: 'Another account already uses that email.' },
      });
    }
    user.name = input.name.trim().replace(/\s+/g, ' ');
    user.email = email;
    user.phone = input.phone.trim();
    return toClientUser(user);
  });
}

export async function changePassword({ currentPassword, nextPassword }) {
  await wait(420);
  const errors = validatePassword(nextPassword);
  if (errors.password) {
    throw new ApiError(errors.password, { fields: { nextPassword: errors.password } });
  }
  return mutate(async (db) => {
    const { user, session } = requireUser(db);
    if (!(await passwordMatches(user, currentPassword))) {
      throw new ApiError('Your current password is incorrect.', {
        fields: { currentPassword: 'Your current password is incorrect.' },
      });
    }
    user.salt = crypto.randomUUID();
    user.passwordHash = await hashPassword(nextPassword, user.salt);
    db.sessions = db.sessions.filter((item) => item.id === session.id || item.userId !== user.id);
    return true;
  });
}

export async function setAvatar(dataUrl) {
  await wait(280);
  return mutate((db) => {
    const { user } = requireUser(db);
    if (dataUrl && (!String(dataUrl).startsWith('data:image/jpeg') || dataUrl.length > 250000)) {
      throw new ApiError('That photo could not be saved. Try a smaller image.');
    }
    user.avatarDataUrl = dataUrl || null;
    return toClientUser(user);
  });
}

export async function listSessions() {
  return query((db) => {
    const { user, session } = requireUser(db);
    return db.sessions
      .filter((item) => item.userId === user.id)
      .sort(byNewest())
      .map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        expiresAt: item.expiresAt,
        current: item.id === session.id,
        userAgent: item.userAgent,
      }));
  });
}

export async function revokeOtherSessions() {
  await wait(280);
  return mutate((db) => {
    const { user, session } = requireUser(db);
    db.sessions = db.sessions.filter((item) => item.userId !== user.id || item.id === session.id);
    return true;
  });
}

export async function updateSettings(settings) {
  await wait(240);
  return mutate((db) => {
    const { user } = requireUser(db);
    user.settings = {
      emailNotices: Boolean(settings.emailNotices),
      withdrawalAlerts: Boolean(settings.withdrawalAlerts),
    };
    return toClientUser(user);
  });
}

export async function getDashboard() {
  await wait(160);
  return query((db) => {
    const { user } = requireUser(db);
    const transactions = clientTransactions(db, user.id);
    return {
      profile: toClientUser(user),
      balances: balancesFor(db, user.id),
      transactions,
      investments: clientInvestments(db, user.id),
      chart: buildProfitSeries(transactions),
      pricing: db.pricing,
      payoutMethods: toClientUser(user).payoutMethods,
      paymentMethods: PAYMENT_METHODS,
      bankDetails: { ...BANK_DETAILS, reference: user.clientNumber },
      limits: LIMITS,
      banks: BANKS,
      status: user.status,
      demo: true,
    };
  });
}

export async function quoteInvestment(optionId, amountCents) {
  await wait(120);
  return query((db) => {
    const { user } = requireUser(db);
    const balances = balancesFor(db, user.id);
    return quotePackage({
      pricing: db.pricing,
      optionId,
      amountCents: Number(amountCents),
      availableCents: balances.availableCents,
    });
  });
}

export async function createInvestment(optionId, amountCents) {
  await wait(480);
  return mutate((db) => {
    const { user } = requireUser(db);
    requireActive(user);
    const balances = balancesFor(db, user.id);
    const quote = quotePackage({
      pricing: db.pricing,
      optionId,
      amountCents: Number(amountCents),
      availableCents: balances.availableCents,
    });
    if (!quote.valid) throw new ApiError(quote.message);
    if (!quote.sufficient) throw new ApiError(quote.message);
    const started = new Date();
    const now = started.toISOString();
    const investment = {
      id: crypto.randomUUID(),
      userId: user.id,
      optionId: quote.option.id,
      optionName: quote.option.name,
      days: quote.option.days,
      amountCents: quote.amountCents,
      profitPercent: quote.profitPercent,
      illustratedProfitCents: quote.profitCents,
      illustratedPayoutCents: quote.payoutCents,
      status: 'active',
      startedAt: now,
      completesAt: new Date(started.getTime() + quote.option.days * 86400000).toISOString(),
      settledAt: null,
      reference: reference('INV'),
      simulation: true,
    };
    db.investments.push(investment);
    db.transactions.push({
      id: crypto.randomUUID(),
      userId: user.id,
      type: 'investment',
      amountCents: investment.amountCents,
      status: 'completed',
      method: '',
      reference: investment.reference,
      note: `${investment.optionName} · ${investment.days} trading days.`,
      adminReason: '',
      investmentId: investment.id,
      payoutMethodId: null,
      simulation: true,
      createdAt: now,
      updatedAt: now,
    });
    return { investment, balances: balancesFor(db, user.id) };
  });
}

export async function requestDeposit({ amountCents, methodId, note }) {
  await wait(420);
  assertCents(amountCents, 'deposit amount');
  return mutate((db) => {
    const { user } = requireUser(db);
    requireActive(user);
    if (amountCents < LIMITS.depositMinCents || amountCents > LIMITS.depositMaxCents) {
      throw new ApiError('Demo deposits must be between R 100.00 and R 1,000,000.00.', { fields: { amount: 'Amount is outside the demo limit.' } });
    }
    const method = PAYMENT_METHODS.find((item) => item.id === methodId);
    if (!method) throw new ApiError('Choose a payment method.', { fields: { method: 'Choose a payment method.' } });
    const now = new Date().toISOString();
    const entry = {
      id: crypto.randomUUID(),
      userId: user.id,
      type: 'deposit',
      amountCents,
      status: 'pending',
      method: method.name,
      reference: reference('DEP'),
      note: note?.trim() || 'Simulated deposit request. No funds have been added.',
      adminReason: '',
      investmentId: null,
      payoutMethodId: null,
      simulation: true,
      createdAt: now,
      updatedAt: now,
    };
    db.transactions.push(entry);
    return { transaction: entry, balances: balancesFor(db, user.id) };
  });
}

export async function requestWithdrawal({ amountCents, payoutMethodId }) {
  await wait(420);
  assertCents(amountCents, 'withdrawal amount');
  return mutate((db) => {
    const { user } = requireUser(db);
    requireActive(user);
    if (amountCents < LIMITS.withdrawalMinCents) {
      throw new ApiError('The minimum demo withdrawal is R 100.00.', { fields: { amount: 'Minimum withdrawal is R 100.00.' } });
    }
    const method = (user.payoutMethods || []).find((item) => item.id === payoutMethodId);
    if (!method) throw new ApiError('Choose a saved withdrawal account.', { fields: { method: 'Choose a saved withdrawal account.' } });
    const balances = balancesFor(db, user.id);
    if (amountCents > balances.availableCents) {
      throw new ApiError('You can only withdraw available funds.', { fields: { amount: 'Amount is higher than your available balance.' } });
    }
    const now = new Date().toISOString();
    const entry = {
      id: crypto.randomUUID(),
      userId: user.id,
      type: 'withdrawal',
      amountCents,
      status: 'pending',
      method: `${method.bank} ${method.accountType} ${toClientUser(user).payoutMethods.find((item) => item.id === method.id).accountNumberMasked}`,
      reference: reference('WDR'),
      note: 'Funds are on hold until this simulated withdrawal is reviewed.',
      adminReason: '',
      investmentId: null,
      payoutMethodId: method.id,
      simulation: true,
      createdAt: now,
      updatedAt: now,
    };
    db.transactions.push(entry);
    return { transaction: entry, balances: balancesFor(db, user.id) };
  });
}

export async function addPayoutMethod(input) {
  await wait(320);
  const errors = validatePayoutMethod(input);
  throwFields(errors);
  return mutate((db) => {
    const { user } = requireUser(db);
    requireActive(user);
    if ((user.payoutMethods || []).length >= 4) {
      throw new ApiError('You can save up to 4 demo withdrawal accounts.');
    }
    user.payoutMethods.push({
      id: crypto.randomUUID(),
      bank: input.bank,
      accountType: input.accountType || 'Cheque',
      accountName: input.accountName.trim(),
      accountNumber: String(input.accountNumber).replace(/\D/g, ''),
      branchCode: input.branchCode.trim(),
      demo: true,
    });
    return toClientUser(user).payoutMethods;
  });
}

export async function removePayoutMethod(methodId) {
  await wait(240);
  return mutate((db) => {
    const { user } = requireUser(db);
    const held = db.transactions.some(
      (tx) => tx.userId === user.id && tx.payoutMethodId === methodId && ['pending', 'processing'].includes(tx.status),
    );
    if (held) throw new ApiError('This account is attached to a withdrawal that is still open.');
    user.payoutMethods = (user.payoutMethods || []).filter((item) => item.id !== methodId);
    return toClientUser(user).payoutMethods;
  });
}

function decorate(db, tx) {
  const owner = db.users.find((item) => item.id === tx.userId);
  return {
    ...tx,
    userName: owner?.name || 'Unknown client',
    userEmail: owner?.email || '',
    clientNumber: owner?.clientNumber || '',
  };
}

export async function adminOverview() {
  await wait(180);
  return query((db) => {
    const { user } = requireAdmin(db);
    const clients = db.users.filter((item) => item.role === 'client');
    const totals = clients.reduce(
      (sum, client) => {
        const balances = balancesFor(db, client.id);
        sum.availableCents += balances.availableCents;
        sum.investedCents += balances.investedCents;
        sum.profitCents += balances.profitCents;
        sum.totalCents += balances.totalCents;
        return sum;
      },
      { availableCents: 0, investedCents: 0, profitCents: 0, totalCents: 0 },
    );
    const clientTx = db.transactions.filter((tx) => clients.some((client) => client.id === tx.userId));
    const sumWhere = (predicate) => clientTx.filter(predicate).reduce((sum, tx) => sum + tx.amountCents, 0);
    const pending = clientTx.filter((tx) => (tx.type === 'deposit' || tx.type === 'withdrawal') && (tx.status === 'pending' || tx.status === 'processing'));
    return {
      profile: toClientUser(user),
      totals,
      clients: clients.length,
      pendingCount: pending.length,
      approvedDepositsCents: sumWhere((tx) => tx.type === 'deposit' && tx.status === 'approved'),
      pendingDepositsCents: sumWhere((tx) => tx.type === 'deposit' && tx.status === 'pending'),
      completedWithdrawalsCents: sumWhere((tx) => tx.type === 'withdrawal' && tx.status === 'completed'),
      openWithdrawalsCents: sumWhere((tx) => tx.type === 'withdrawal' && ['pending', 'processing'].includes(tx.status)),
      recentTransactions: [...clientTx].sort(byNewest()).slice(0, 8).map((tx) => decorate(db, tx)),
      pendingRequests: pending.sort(byNewest()).slice(0, 6).map((tx) => decorate(db, tx)),
      audit: [...db.auditLog].sort(byNewest('at')).slice(0, 6),
      pricing: db.pricing,
      demo: true,
    };
  });
}

export async function adminListUsers() {
  await wait(180);
  return query((db) => {
    requireAdmin(db);
    return db.users
      .slice()
      .sort(byNewest())
      .map((user) => ({
        ...toClientUser(user),
        balances: balancesFor(db, user.id),
        investments: clientInvestments(db, user.id).length,
      }));
  });
}

export async function adminGetUser(userId) {
  await wait(160);
  return query((db) => {
    requireAdmin(db);
    const user = db.users.find((item) => item.id === userId);
    if (!user) throw new ApiError('That client could not be found.');
    return {
      user: toClientUser(user),
      balances: balancesFor(db, user.id),
      investments: clientInvestments(db, user.id),
      transactions: clientTransactions(db, user.id),
    };
  });
}

export async function adminSetStatus(userId, status, reason) {
  await wait(360);
  const cleanReason = assertReason(reason);
  if (!['active', 'suspended', 'closed'].includes(status)) throw new ApiError('Choose a valid account status.');
  return mutate((db) => {
    const { user: admin } = requireAdmin(db);
    if (admin.id === userId) throw new ApiError('You cannot change your own account status.');
    const user = db.users.find((item) => item.id === userId);
    if (!user || user.role === 'admin') throw new ApiError('That client could not be updated.');
    const previous = user.status;
    user.status = status;
    if (status === 'closed') db.sessions = db.sessions.filter((item) => item.userId !== user.id);
    writeAudit(db, admin, {
      action: 'user.status',
      targetType: 'user',
      targetId: user.id,
      targetLabel: user.email,
      reason: cleanReason,
      detail: `Status changed from ${previous} to ${status}.`,
    });
    return toClientUser(user);
  });
}

export async function adminAdjust(userId, { direction, amountCents, reason }) {
  await wait(420);
  const cleanReason = assertReason(reason);
  assertCents(amountCents, 'adjustment');
  return mutate((db) => {
    const { user: admin } = requireAdmin(db);
    const user = db.users.find((item) => item.id === userId && item.role === 'client');
    if (!user) throw new ApiError('That client could not be updated.');
    const signed = direction === 'debit' ? -amountCents : amountCents;
    if (direction === 'debit' && amountCents > balancesFor(db, user.id).availableCents) {
      throw new ApiError('This debit is larger than the available balance.');
    }
    if (direction !== 'credit' && direction !== 'debit') throw new ApiError('Choose credit or debit.');
    const now = new Date().toISOString();
    const entry = {
      id: crypto.randomUUID(),
      userId: user.id,
      type: 'adjustment',
      amountCents: signed,
      status: 'approved',
      method: 'Administrator adjustment',
      reference: reference('ADJ'),
      note: cleanReason,
      adminReason: cleanReason,
      investmentId: null,
      payoutMethodId: null,
      simulation: true,
      createdAt: now,
      updatedAt: now,
    };
    db.transactions.push(entry);
    writeAudit(db, admin, {
      action: 'ledger.adjustment',
      targetType: 'transaction',
      targetId: entry.id,
      targetLabel: entry.reference,
      reason: cleanReason,
      detail: `${direction === 'debit' ? 'Debited' : 'Credited'} the available balance.`,
    });
    return { transaction: entry, balances: balancesFor(db, user.id) };
  });
}

export async function adminListRequests() {
  await wait(160);
  return query((db) => {
    requireAdmin(db);
    const rows = db.transactions
      .filter((tx) => tx.type === 'deposit' || tx.type === 'withdrawal')
      .sort(byNewest())
      .map((tx) => decorate(db, tx));
    return {
      deposits: rows.filter((tx) => tx.type === 'deposit'),
      withdrawals: rows.filter((tx) => tx.type === 'withdrawal'),
    };
  });
}

const TRANSITIONS = {
  deposit: { pending: ['approved', 'rejected'] },
  withdrawal: { pending: ['processing', 'rejected'], processing: ['completed', 'rejected'] },
};

export async function adminDecide(transactionId, status, reason) {
  await wait(420);
  const cleanReason = assertReason(reason);
  return mutate((db) => {
    const { user: admin } = requireAdmin(db);
    const tx = db.transactions.find((item) => item.id === transactionId);
    if (!tx || (tx.type !== 'deposit' && tx.type !== 'withdrawal')) {
      throw new ApiError('That request could not be found.');
    }
    const allowed = TRANSITIONS[tx.type][tx.status] || [];
    if (!allowed.includes(status)) throw new ApiError('This request has already been finalised.');
    tx.status = status;
    tx.adminReason = cleanReason;
    tx.updatedAt = new Date().toISOString();
    writeAudit(db, admin, {
      action: `${tx.type}.${status}`,
      targetType: 'transaction',
      targetId: tx.id,
      targetLabel: tx.reference,
      reason: cleanReason,
      detail: `${tx.type} marked ${status}.`,
    });
    return decorate(db, tx);
  });
}

export async function adminUpdatePricing(nextPricing, reason) {
  await wait(420);
  const cleanReason = assertReason(reason);
  return mutate((db) => {
    const { user: admin } = requireAdmin(db);
    const options = (nextPricing.options || []).map((option) => ({
      id: option.id || crypto.randomUUID(),
      name: String(option.name || '').trim(),
      days: Number(option.days),
      profitPercent: Number(option.profitPercent),
    }));
    if (!options.length || options.length > 8) throw new ApiError('Keep between 1 and 8 trading options.');
    const daySet = new Set();
    for (const option of options) {
      if (!option.name) throw new ApiError('Every option needs a name.');
      if (!Number.isInteger(option.days) || option.days < 1 || option.days > 60) {
        throw new ApiError('Trading periods must be whole days from 1 to 60.');
      }
      if (daySet.has(option.days)) throw new ApiError('Each option needs a different trading period.');
      daySet.add(option.days);
      if (!Number.isFinite(option.profitPercent) || option.profitPercent < 0 || option.profitPercent > 500) {
        throw new ApiError('Illustrated profit rates must be between 0% and 500%.');
      }
    }
    const minimumCents = Number(nextPricing.minimumCents);
    if (!Number.isInteger(minimumCents) || minimumCents < 10000) {
      throw new ApiError('The minimum investment must be at least R 100.00.');
    }
    const amounts = [...new Set((nextPricing.amountsCents || []).map(Number))].sort((a, b) => a - b);
    if (!amounts.length || amounts.some((amount) => !Number.isInteger(amount) || amount < minimumCents)) {
      throw new ApiError('Every listed amount must be at least the minimum investment.');
    }
    const previous = db.pricing.options.map((option) => `${option.name} ${option.profitPercent}%`).join(', ');
    db.pricing = {
      minimumCents,
      amountsCents: amounts,
      options: options.sort((a, b) => a.days - b.days),
      updatedAt: new Date().toISOString(),
      updatedBy: admin.name,
    };
    writeAudit(db, admin, {
      action: 'pricing.updated',
      targetType: 'pricing',
      targetId: 'rate-card',
      targetLabel: 'Investment rate card',
      reason: cleanReason,
      detail: `Previous illustrated rates: ${previous}.`,
    });
    return db.pricing;
  });
}

export async function adminAudit() {
  await wait(140);
  return query((db) => {
    requireAdmin(db);
    return [...db.auditLog].sort(byNewest('at'));
  });
}

export async function resetDemo() {
  await resetDatabase();
}

export { rememberedEmail };
