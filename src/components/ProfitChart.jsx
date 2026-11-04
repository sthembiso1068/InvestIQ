import { compactZAR, formatDate } from '../lib/format';

export function ProfitChart({ points = [] }) {
  if (!points.length) {
    return <p className="px-5 py-16 text-center text-sm text-slate-500">Profit history will appear after an investment matures.</p>;
  }

  const width = 640;
  const height = 220;
  const padL = 44;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const values = points.map((point) => point.profitCents);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const displayMax = max === min ? max + 1 : max;
  const span = displayMax - min;
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? padL + innerW / 2 : padL + (index / (points.length - 1)) * innerW;
    const y = padT + ((displayMax - point.profitCents) / span) * innerH;
    return [x, y];
  });
  const line = coords.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${coords.at(-1)[0].toFixed(1)},${padT + innerH} L${coords[0][0].toFixed(1)},${padT + innerH} Z`;
  const flat = max === 0 && min === 0;
  const ticks = [displayMax, (displayMax + min) / 2, min].filter((value, index, list) => list.findIndex((item) => item === value) === index);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Illustrated profit and loss over 30 days">
        {ticks.map((tick) => {
          const y = padT + ((displayMax - tick) / span) * innerH;
          return (
            <g key={tick}>
              <line x1={padL} x2={width - padR} y1={y} y2={y} stroke="rgba(255,255,255,0.1)" />
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="11" fill="rgba(255,255,255,0.45)">
                {compactZAR(tick)}
              </text>
            </g>
          );
        })}
        <path d={area} fill="#ff6a00" opacity="0.18" />
        <path d={line} fill="none" stroke="#ff6a00" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <text x={padL} y={height - 8} fontSize="11" fill="rgba(255,255,255,0.45)">
          {formatDate(points[0].date)}
        </text>
        <text x={width - padR} y={height - 8} textAnchor="end" fontSize="11" fill="rgba(255,255,255,0.45)">
          {formatDate(points.at(-1).date)}
        </text>
      </svg>
      {flat ? (
        <p className="px-5 pb-4 text-center text-sm text-slate-500">No illustrative profit has been credited on this account yet.</p>
      ) : null}
    </div>
  );
}

export function AllocationDonut({ availableCents = 0, investedCents = 0 }) {
  const total = availableCents + investedCents;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const invested = total === 0 ? 0 : (investedCents / total) * circumference;
  const available = total === 0 ? 0 : circumference - invested;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="12" />
        {total > 0 ? (
          <>
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="12"
              strokeDasharray={`${available} ${circumference - available}`}
              strokeDashoffset={-invested}
              transform="rotate(-90 60 60)"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#ff6a00"
              strokeWidth="12"
              strokeDasharray={`${invested} ${circumference - invested}`}
              strokeLinecap="butt"
              transform="rotate(-90 60 60)"
            />
          </>
        ) : null}
      </svg>
      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2 text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full bg-white/40" /> Available
        </p>
        <p className="flex items-center gap-2 text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full bg-gold" /> Invested
        </p>
        {total === 0 ? <p className="text-xs text-slate-400">No funds recorded yet.</p> : null}
      </div>
    </div>
  );
}
