export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function isSAPhone(value) {
  return /^(\+27|0)\d{9}$/.test(String(value).replace(/[\s()-]/g, ''));
}

export function validatePassword(password) {
  const errors = {};
  if (!password || password.length < 8) {
    errors.password = 'Use at least 8 characters.';
  } else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Include an uppercase letter, a lowercase letter, and a number.';
  }
  return errors;
}

export function passwordScore(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score += 1;
  return score;
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!String(email || '').trim()) errors.email = 'Enter your email address.';
  else if (!isEmail(email)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export function validateRegistration({ name, email, phone, password, confirm }) {
  const errors = {};
  const cleanName = String(name || '').trim();
  if (cleanName.split(/\s+/).filter(Boolean).length < 2) {
    errors.name = 'Enter your full name.';
  } else if (cleanName.length > 80) {
    errors.name = 'Name must be 80 characters or fewer.';
  }
  if (!String(email || '').trim()) errors.email = 'Enter your email address.';
  else if (!isEmail(email)) errors.email = 'Enter a valid email address.';
  if (!String(phone || '').trim()) errors.phone = 'Enter your phone number.';
  else if (!isSAPhone(phone)) errors.phone = 'Use a South African number, such as 082 555 0142 or +27 82 555 0142.';
  Object.assign(errors, validatePassword(password));
  if (!confirm) errors.confirm = 'Confirm your password.';
  else if (password !== confirm) errors.confirm = 'Passwords do not match.';
  return errors;
}

export function validateProfile({ name, email, phone }) {
  const errors = {};
  const cleanName = String(name || '').trim();
  if (cleanName.split(/\s+/).filter(Boolean).length < 2) errors.name = 'Enter your full name.';
  if (!isEmail(email)) errors.email = 'Enter a valid email address.';
  if (!isSAPhone(phone)) errors.phone = 'Use a South African number, such as +27 82 555 0142.';
  return errors;
}

export function validatePayoutMethod({ bank, accountName, accountNumber, branchCode }) {
  const errors = {};
  if (!bank) errors.bank = 'Choose a bank.';
  if (!String(accountName || '').trim()) errors.accountName = 'Enter the account holder name.';
  const digits = String(accountNumber || '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 16) errors.accountNumber = 'Enter an account number of 8 to 16 digits.';
  if (!/^\d{6}$/.test(String(branchCode || '').trim())) errors.branchCode = 'Enter a 6-digit branch code.';
  return errors;
}
