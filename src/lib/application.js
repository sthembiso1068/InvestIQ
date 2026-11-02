export const TITLES = ['Miss', 'Mrs', 'Mr', 'Dr'];
export const GENDERS = ['Male', 'Female', "Don't specify"];
export const OCCUPATIONS = ['Employed', 'Unemployed', 'Self Employed'];
export const INVESTMENT_AMOUNTS = [2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000];
export const INVESTMENT_OPTIONS = [
  { id: 'opt1', name: 'Option 1', days: 3, label: 'OPTION 1 (3 DAYS)' },
  { id: 'opt2', name: 'Option 2', days: 4, label: 'OPTION 2 (4 DAYS)' },
  { id: 'opt3', name: 'Option 3', days: 5, label: 'OPTION 3 (5 DAYS)' },
  { id: 'opt4', name: 'Option 4', days: 6, label: 'OPTION 4 (6 DAYS)' },
  { id: 'opt5', name: 'Option 5', days: 7, label: 'OPTION 5 (7 DAYS)' },
];

export const WITHDRAWAL_WAIT_MESSAGE = 'Waiting for admin to approve. You might be contacted soon.';

export function optionById(id) {
  return INVESTMENT_OPTIONS.find((item) => item.id === id) || null;
}
