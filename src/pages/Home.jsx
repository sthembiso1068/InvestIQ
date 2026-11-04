import { Link } from 'react-router-dom';
import { BadgeCheck, CalendarRange, Landmark } from 'lucide-react';
import { Logo } from '../components/Logo';
import { INVESTMENT_AMOUNTS, INVESTMENT_OPTIONS } from '../lib/application';
import { formatZAR } from '../lib/format';
import { useTitle } from '../hooks/useTitle';
import { DEFAULT_PROFIT_PERCENTS, illustratedPayoutCents } from '../services/ledger';

const FACTS = [
  { label: 'R2,000–R14,000', detail: 'Investment amounts' },
  { label: '5 options', detail: '3 to 7 days' },
  { label: 'Admin deposit', detail: 'Clients do not deposit' },
];

const STEPS = [
  {
    icon: BadgeCheck,
    title: 'Register with your ID number',
    body: 'The form records your name, South African ID number, address, bank account, amount, and option.',
  },
  {
    icon: Landmark,
    title: 'An administrator deposits the amount',
    body: 'The deposit matches the amount on the form. Clients cannot deposit it themselves.',
  },
  {
    icon: CalendarRange,
    title: 'The term runs, then a withdrawal waits',
    body: 'A withdrawal stays waiting until an administrator approves it. You might be contacted.',
  },
];

function payout(amount, percent) {
  return illustratedPayoutCents(amount * 100, percent);
}

export default function Home() {
  useTitle('Investor platform');
  const example = payout(10000, 110);

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Logo className="h-10 w-auto" />
          <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a href="#packages" className="hover:text-white">Packages</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#rates" className="hover:text-white">Rate card</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-white hover:bg-white/5">
              Sign in
            </Link>
            <Link to="/register" className="rounded-full bg-gradient-to-r from-[#ff8a1e] to-[#ff5a00] px-4 py-2.5 text-sm font-semibold text-white">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="pointer-events-none absolute -right-20 top-10 h-[460px] w-[460px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-10 top-28 h-[300px] w-[300px] rounded-full border border-white/10" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ember">
              <span className="h-px w-8 bg-ember" />
              Investor platform
            </p>
            <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
              Your rands, on a term you can{' '}
              <span className="font-serif font-normal italic text-ember">see.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/60">
              Choose an amount from R2,000 to R14,000 and an option of 3 to 7 days. An administrator deposits that amount. The payout shown on the rate card is an estimate.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="rounded-full bg-gradient-to-r from-[#ff8a1e] to-[#ff5a00] px-5 py-3 text-sm font-semibold text-white">
                Open an account
              </Link>
              <a href="#rates" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5">
                View the rate card
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              {FACTS.map((fact) => (
                <div key={fact.label} className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <span className="block text-sm font-semibold">{fact.label}</span>
                  <span className="block text-xs text-white/50">{fact.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-8 z-10 hidden rounded-2xl border border-white/10 bg-[#16171c] px-4 py-3 shadow-2xl sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">Fixed term</p>
              <p className="mt-1 text-sm font-semibold">Amount plus illustrated profit</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-[#121318]/90 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur sm:ml-8 sm:mt-10">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Example from the rate card</p>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">Estimate</span>
              </div>
              <p className="mt-6 text-sm text-white/50">R10,000 · Option 3 · 5 days</p>
              <p className="mt-1 text-4xl font-semibold tabular tracking-tight">{formatZAR(example)}</p>
              <p className="mt-1 text-sm font-medium text-emerald-400">Illustrated payout, not a guaranteed return</p>
              <svg viewBox="0 0 320 110" className="mt-6 h-28 w-full" aria-hidden="true">
                <path d="M8 92 C 70 90, 90 78, 120 70 S 190 40, 230 34 S 280 22, 312 16" fill="none" stroke="#ff8a1e" strokeWidth="3" strokeLinecap="round" />
                <path d="M8 92 C 70 90, 90 78, 120 70 S 190 40, 230 34 S 280 22, 312 16 V 100 H 8 Z" fill="url(#rise)" opacity="0.35" />
                <defs>
                  <linearGradient id="rise" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff8a1e" />
                    <stop offset="100%" stopColor="#ff8a1e" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-white/50">
                <span>Option 1 · 3 days</span>
                <span className="text-center">Option 3 · 5 days</span>
                <span className="text-right">Option 5 · 7 days</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="packages" className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ember">Packages</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Five options. Three to seven days.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
            Each option adds an illustrated profit to the amount you select. The figure under each card is the illustrated payout on R2,000. Larger amounts use the same percentages.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {INVESTMENT_OPTIONS.map((option, index) => (
              <article key={option.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ember">{option.name}</p>
                <p className="mt-3 text-3xl font-semibold">{option.days} days</p>
                <p className="mt-4 text-sm text-white/50">{DEFAULT_PROFIT_PERCENTS[index]}% illustrated profit</p>
                <p className="mt-2 text-sm font-semibold tabular">{formatZAR(payout(2000, DEFAULT_PROFIT_PERCENTS[index]))}</p>
                <p className="text-xs text-white/40">on R2,000</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ember">How it works</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight">The account follows the form you submit.</h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <article key={step.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ff6a00]/15 text-ember">
                    <step.icon size={18} />
                  </span>
                  <span className="text-sm font-semibold text-white/30">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="rates" className="bg-[#f6f4ef] text-navy">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c2410c]">Rate card</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Illustrated payouts</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            A payout on this card is the amount plus the illustrated profit for that option. These figures are estimates. They are not guaranteed returns.
          </p>
          <div className="mt-8 overflow-x-auto rounded-3xl bg-white shadow-[0_16px_50px_rgba(9,9,11,0.06)]">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="bg-[#09090b] text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  {INVESTMENT_OPTIONS.map((option) => (
                    <th key={option.id} className="px-4 py-3 font-semibold">{option.name}<span className="mt-0.5 block text-[11px] font-medium text-white/50">{option.days} days</span></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INVESTMENT_AMOUNTS.map((amount) => (
                  <tr key={amount} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold tabular">{formatZAR(amount * 100)}</td>
                    {DEFAULT_PROFIT_PERCENTS.map((percent) => (
                      <td key={percent} className="px-4 py-3 tabular text-slate-700">{formatZAR(payout(amount, percent))}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Logo className="h-9 w-auto" />
          <p className="max-w-md text-xs leading-5 text-white/40">
            Projected earnings are estimates, not guaranteed returns. An administrator deposits the amount on the investment form.
          </p>
          <Link to="/register" className="text-sm font-semibold text-ember">Create your account</Link>
        </div>
      </footer>
    </div>
  );
}
