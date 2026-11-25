"use client";

import { useId, useRef, useState } from "react";

export type ChartPoint = { date: string; value: number; label: string };

const W = 340;
const H = 190;
const PAD = { top: 14, right: 52, bottom: 26, left: 34 };

const fmtNum = (n: number) => n.toLocaleString("da-DK", { maximumFractionDigits: 1 });
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short" });

/** Pæne aksetal: 3–5 runde trin, der dækker [min, max] */
function niceTicks(min: number, max: number): number[] {
  if (min === max) {
    const pad = Math.max(1, Math.abs(min) * 0.1);
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / 3;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.999; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/**
 * Én serie over tid (fx tungeste sæt pr. pas). Ingen signaturforklaring – titlen siger hvad der vises.
 * Interaktion: sigtekorn + værdi ved pointer eller piletaster; tabelvisning følger under grafen.
 */
export function LineChart({ points, unit, title }: { points: ChartPoint[]; unit: string; title: string }) {
  const [active, setActive] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gradientId = useId();

  const values = points.map((p) => p.value);
  const ticks = niceTicks(Math.min(...values), Math.max(...values));
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const t0 = new Date(points[0].date).getTime();
  const t1 = new Date(points[points.length - 1].date).getTime();
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (iso: string) => PAD.left + (t1 === t0 ? plotW / 2 : ((new Date(iso).getTime() - t0) / (t1 - t0)) * plotW);
  const y = (v: number) => PAD.top + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;

  const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${path} L${x(points[points.length - 1].date).toFixed(1)},${PAD.top + plotH} L${x(points[0].date).toFixed(1)},${PAD.top + plotH} Z`;
  const last = points[points.length - 1];

  function nearest(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(x(p.date) - sx) < Math.abs(x(points[best].date) - sx)) best = i;
    });
    setActive(best);
  }

  const a = active != null ? points[active] : null;
  const ax = a ? x(a.date) : 0;

  return (
    <figure className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-pan-y select-none overflow-visible outline-none focus-visible:outline-2"
        role="img"
        aria-label={`${title}: fra ${fmtNum(points[0].value)} ${unit} (${fmtDate(points[0].date)}) til ${fmtNum(last.value)} ${unit} (${fmtDate(last.date)}). Brug piletasterne for at se hvert punkt.`}
        tabIndex={0}
        onPointerMove={(e) => nearest(e.clientX)}
        onPointerDown={(e) => nearest(e.clientX)}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setActive((i) => Math.min(points.length - 1, (i ?? -1) + 1));
          else if (e.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? points.length) - 1));
          else if (e.key === "Escape") setActive(null);
          else return;
          e.preventDefault();
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--chart-line)" stopOpacity="0.12" />
            <stop offset="1" stopColor="var(--chart-line)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Gitter og y-akse: hårfine, tilbagetrukne */}
        {ticks.map((tv) => (
          <g key={tv}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(tv)} y2={y(tv)} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD.left - 6} y={y(tv)} textAnchor="end" dominantBaseline="middle" className="fill-muted text-[10px] tabular-nums">
              {fmtNum(tv)}
            </text>
          </g>
        ))}
        <text x={PAD.left} y={H - 6} className="fill-muted text-[10px]">
          {fmtDate(points[0].date)}
        </text>
        <text x={W - PAD.right} y={H - 6} textAnchor="end" className="fill-muted text-[10px]">
          {fmtDate(last.date)}
        </text>

        <path d={area} fill={`url(#${gradientId})`} />
        <path d={path} fill="none" stroke="var(--chart-line)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Slutpunkt med ring i fladens farve + direkte etiket (tekstfarve, ikke seriefarve) */}
        <circle cx={x(last.date)} cy={y(last.value)} r={4} fill="var(--chart-line)" stroke="var(--surface)" strokeWidth={2} />
        <text x={x(last.date) + 8} y={y(last.value)} dominantBaseline="middle" className="fill-foreground text-[11px] font-semibold">
          {fmtNum(last.value)} {unit}
        </text>

        {a && (
          <g pointerEvents="none">
            <line x1={ax} x2={ax} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--muted)" strokeWidth={1} />
            <circle cx={ax} cy={y(a.value)} r={5} fill="var(--chart-line)" stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
      </svg>

      {a && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-sm"
          style={{ left: `${(ax / W) * 100}%`, transform: ax > W / 2 ? "translateX(-105%)" : "translateX(5%)" }}
        >
          <span className="block font-bold">{a.label}</span>
          <span className="block text-xs text-muted">{fmtDate(a.date)}</span>
        </div>
      )}
    </figure>
  );
}
