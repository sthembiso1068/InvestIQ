import { Logo } from './Logo';

function Rings() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -right-24 top-16 h-[420px] w-[420px] rounded-full border border-white/10" />
      <div className="absolute -right-6 top-32 h-[280px] w-[280px] rounded-full border border-white/10" />
      <div className="absolute -left-24 bottom-0 h-[340px] w-[340px] rounded-full border border-white/[0.07]" />
      <div className="absolute left-1/3 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#ff6a00]/10 blur-3xl" />
    </div>
  );
}

export function AuthShell({
  kicker,
  title,
  accent,
  lede,
  points = [],
  note,
  wide = false,
  children,
}) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-ink text-white lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <Rings />
        <div className="relative">
          <Logo className="h-12 w-auto" />
          <p className="mt-16 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ember">
            <span className="h-px w-8 bg-ember" />
            {kicker}
          </p>
          <h1 className="mt-5 max-w-lg text-5xl font-semibold leading-[1.05] tracking-tight">
            {title}{' '}
            <span className="font-serif text-[1.08em] font-normal italic text-ember">{accent}</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-white/60">{lede}</p>
          {points.length ? (
            <ul className="mt-10 max-w-md space-y-4">
              {points.map((point) => (
                <li key={point.title} className="flex gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5 text-ember">
                    <point.icon size={16} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{point.title}</span>
                    <span className="mt-0.5 block text-sm leading-6 text-white/50">{point.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {note ? <p className="relative max-w-md text-xs leading-5 text-white/40">{note}</p> : null}
      </section>
      <section className="flex min-h-screen flex-col bg-white">
        <div className="bg-ink px-5 py-4 lg:hidden">
          <Logo className="h-10 w-auto" />
        </div>
        <div className={`flex flex-1 justify-center px-5 py-8 sm:px-10 ${wide ? 'items-start lg:py-12' : 'items-center'}`}>
          <div className={wide ? 'w-full max-w-xl' : 'w-full max-w-[440px]'}>
            <div className="mb-8 lg:hidden">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ember">{kicker}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy">
                {title} <span className="font-serif italic text-ember">{accent}</span>
              </h1>
            </div>
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
