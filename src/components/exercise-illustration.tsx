import { anchor, FLOOR_Y, solve, type Joints, type PoseSpec, type Prop, type Pt } from "@/content/illustrations/geometry";
import { illustrations } from "@/content/illustrations";
import { t } from "@/i18n";

/** MIDLERTIDIG stregtegning af en øvelse i to trin (start → slut). Kun til test. */
export function ExerciseIllustration({ slug, className = "" }: { slug: string | null | undefined; className?: string }) {
  const ill = slug ? illustrations[slug] : undefined;
  if (!ill) return null;
  return (
    <figure className={`rounded-2xl bg-background p-2 ${className}`}>
      <div className="grid grid-cols-2 gap-2">
        <Frame pose={ill.start} props={ill.props} label={t.illustration.start} />
        <Frame pose={ill.end} props={ill.props} label={t.illustration.end} />
      </div>
      <figcaption className="sr-only">{t.illustration.caption}</figcaption>
    </figure>
  );
}

const pts = (p: Pt[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

function Frame({ pose, props, label }: { pose: PoseSpec; props: Prop[]; label: string }) {
  const j = solve(pose);
  return (
    <div>
      <svg viewBox="0 0 100 100" className="block aspect-square w-full" role="img" aria-label={label}>
        <line x1="2" y1={FLOOR_Y} x2="98" y2={FLOOR_Y} stroke="var(--border)" strokeWidth="1.5" />
        {/* Udstyr bag figuren */}
        <g stroke="var(--muted)" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {props.map((p, i) => (
            <PropShape key={i} p={p} j={j} layer="back" />
          ))}
        </g>
        <Figure j={j} />
        {/* Vægte og håndtag foran figuren */}
        <g strokeLinecap="round">
          {props.map((p, i) => (
            <PropShape key={i} p={p} j={j} layer="front" />
          ))}
        </g>
      </svg>
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>
    </div>
  );
}

function Figure({ j }: { j: Joints }) {
  return (
    <g stroke="var(--foreground)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {j.legs.map((l, i) => (
        <polyline key={`l${i}`} points={pts(l.toe ? [l.hp, l.kn, l.an, l.toe] : [l.hp, l.kn, l.an])} opacity={i > 0 ? 0.55 : 1} />
      ))}
      <line x1={j.hip[0]} y1={j.hip[1]} x2={j.neck[0]} y2={j.neck[1]} />
      {j.arms.map((a, i) => (
        <polyline key={`a${i}`} points={pts([a.sh, a.el, a.ha])} opacity={i > 0 && j.legs.length === 1 ? 0.55 : 1} />
      ))}
      <circle cx={j.head[0]} cy={j.head[1]} r="5.5" fill="var(--background)" />
    </g>
  );
}

function PropShape({ p, j, layer }: { p: Prop; j: Joints; layer: "back" | "front" }) {
  const front = p.k === "dumbbell" || p.k === "plate" || p.k === "handle" || p.k === "pad";
  if ((layer === "front") !== front) return null;
  switch (p.k) {
    case "line":
      return <polyline points={pts(p.pts)} strokeWidth={p.w ?? 2} />;
    case "rect":
      return <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="1.5" fill="var(--muted)" stroke="none" />;
    case "cable": {
      const [x, y] = anchor(j, p.at);
      return (
        <g>
          <line x1={p.from[0]} y1={p.from[1]} x2={x} y2={y} strokeWidth="1" strokeDasharray="2 1.5" />
          <circle cx={p.from[0]} cy={p.from[1]} r="2.5" fill="var(--muted)" />
        </g>
      );
    }
    case "dumbbell": {
      const [x, y] = anchor(j, p.at);
      return (
        <g fill="var(--accent)" stroke="none">
          <rect x={x - 6} y={y - 1.2} width="12" height="2.4" rx="1" />
          <rect x={x - 7} y={y - 3.5} width="3" height="7" rx="1" />
          <rect x={x + 4} y={y - 3.5} width="3" height="7" rx="1" />
        </g>
      );
    }
    case "plate": {
      const [x, y] = anchor(j, p.at);
      return <circle cx={x} cy={y} r={p.r ?? 6} fill="var(--accent)" fillOpacity="0.85" stroke="none" />;
    }
    case "handle": {
      const [x, y] = anchor(j, p.at);
      return <circle cx={x} cy={y} r="2.5" fill="var(--accent)" stroke="none" />;
    }
    case "pad": {
      const [x, y] = anchor(j, p.at);
      return <circle cx={x} cy={y} r="3.5" fill="var(--muted)" fillOpacity="0.8" stroke="none" />;
    }
  }
}
