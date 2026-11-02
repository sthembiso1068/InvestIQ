import { BANKS } from './application.js';

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

function requiredText(value, message, max = 120) {
  const clean = String(value || '').trim();
  if (!clean) return message;
  if (clean.length > max) return `Use ${max} characters or fewer.`;
  return '';
}

function isPastDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() <= today.getTime() && date.getFullYear() > 1900;
}

function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

export function validateRegistration(input) {
  const errors = {};
  const {
    title, firstName, surname, gender, dateOfBirth, email, phone, address, occupation,
    investmentAmount, optionId, investmentDate, bankName, accountNumber, referralName, referralNumber,
    password, confirm,
  } = input;
  if (!['Miss', 'Mrs', 'Mr', 'Dr'].includes(title)) errors.title = 'Select a title.';
  const nameError = requiredText(firstName, 'Enter your name.', 40);
  if (nameError) errors.firstName = nameError;
  const surnameError = requiredText(surname, 'Enter your surname.', 40);
  if (surnameError) errors.surname = surnameError;
  if (!['Male', 'Female', "Don't specify"].includes(gender)) errors.gender = 'Select a gender.';
  if (!isPastDate(dateOfBirth)) errors.dateOfBirth = 'Enter a valid date of birth.';
  if (!String(email || '').trim()) errors.email = 'Enter your email address.';
  else if (!isEmail(email)) errors.email = 'Enter a valid email address.';
  if (!String(phone || '').trim()) errors.phone = 'Enter your mobile number.';
  else if (!isSAPhone(phone)) errors.phone = 'Use a South African number, such as 082 555 0142.';
  const addressError = requiredText(address, 'Enter your address.', 180);
  if (addressError) errors.address = addressError;
  if (!['Employed', 'Unemployed', 'Self Employed'].includes(occupation)) errors.occupation = 'Select an occupation.';
  const amount = Number(investmentAmount);
  if (![2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000].includes(amount)) {
    errors.investmentAmount = 'Select an investment amount.';
  }
  if (!['opt1', 'opt2', 'opt3', 'opt4', 'opt5'].includes(optionId)) errors.optionId = 'Select an investment duration.';
  if (!isDate(investmentDate)) errors.investmentDate = 'Enter the investment date.';
  if (!BANKS.includes(bankName)) errors.bankName = 'Select a bank.';
  const digits = String(accountNumber || '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 16) errors.accountNumber = 'Enter an account number of 8 to 16 digits.';
  const referralError = requiredText(referralName, 'Enter the referral name.', 80);
  if (referralError) errors.referralName = referralError;
  if (!String(referralNumber || '').trim()) errors.referralNumber = 'Enter the referral number.';
  else if (!isSAPhone(referralNumber)) errors.referralNumber = 'Use a South African referral number.';
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
