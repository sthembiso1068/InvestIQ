import { ShieldCheck, LineChart, Wallet } from 'lucide-react';
import { Logo } from './Logo';

const POINTS = [
  { icon: Wallet, title: 'Personal balances', body: 'Available funds, investments, and profit are read from your ledger.' },
  { icon: LineChart, title: 'Rate-card packages', body: 'Durations and illustrated payouts follow the SV Capital pricing table.' },
  { icon: ShieldCheck, title: 'Separate accounts', body: 'Each client signs in to their own records. Administrators use a separate desk.' },
];

export function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-navy text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -left-16 top-8 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-gold/5 blur-3xl" />
        <div className="relative">
          <Logo className="h-16 w-auto" />
          <p className="mt-14 max-w-md text-4xl font-semibold leading-tight tracking-tight">Your capital. Our expertise.</p>
          <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
            A private account for balances, investment packages, and the transactions behind them.
          </p>
          <ul className="mt-10 space-y-5">
            {POINTS.map((point) => (
              <li key={point.title} className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-gold">
                  <point.icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{point.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-400">{point.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative max-w-md text-xs leading-5 text-slate-400">
          SV Capital demo. This application does not accept real money, execute trades, or provide financial advice. Projected earnings are illustrative estimates, not guaranteed returns or verified trading results.
        </p>
      </section>
      <section className="flex min-h-screen flex-col">
        <div className="bg-navy px-5 py-5 lg:hidden">
          <Logo className="h-12 w-auto" />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-[440px]">{children}</div>
        </div>
      </section>
    </div>
  );
}
