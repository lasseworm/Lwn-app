import Image from "next/image";
import Link from "next/link";
import logoLightText from "../../public/brand/lwn-logo-transparent.png";
import logoDarkText from "../../public/brand/lwn-logo-dark-text.png";
import type { ComponentProps, ReactNode } from "react";

const base =
  "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold transition active:scale-[0.99] disabled:opacity-60";

const variants = {
  primary: "bg-accent text-accent-foreground hover:brightness-105",
  secondary: "bg-surface text-foreground border border-border hover:bg-background",
  dark: "bg-brand text-brand-foreground hover:opacity-90",
};

type Variant = keyof typeof variants;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 ${className}`}>{children}</div>
  );
}

export function SampleBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-dashed border-muted px-2.5 py-0.5 text-xs font-semibold text-muted">
      {label}
    </span>
  );
}

const LOGO_ALT = "LWN – Learn. Workout. Never Quit.";

/**
 * Billedlogo. Logoets "LWN" er hvidt; i lys tilstand vises en variant med mørk tekst,
 * så det kan læses på lys baggrund. Skiftet sker med CSS (prefers-color-scheme).
 */
export function Logo({
  className = "h-11",
  eager = false,
  onDark = false,
}: {
  className?: string;
  eager?: boolean;
  /** Altid hvid tekst – til flader, der er mørke i både lys og mørk tilstand (fx forsidens hero). */
  onDark?: boolean;
}) {
  const common = { loading: eager ? ("eager" as const) : undefined, sizes: "160px" };
  if (onDark) {
    return (
      <span className={`inline-flex shrink-0 ${className}`}>
        <Image src={logoLightText} alt={LOGO_ALT} {...common} className="h-full w-auto" />
      </span>
    );
  }
  return (
    <span className={`inline-flex shrink-0 ${className}`}>
      <Image src={logoDarkText} alt={LOGO_ALT} {...common} className="h-full w-auto dark:hidden" />
      <Image src={logoLightText} alt={LOGO_ALT} {...common} className="hidden h-full w-auto dark:block" />
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  // Bekræftet = orange (brandfarven), afventer = neutral, omstridt = rød
  pending: "border-border bg-background text-muted",
  verified: "border-accent/50 bg-accent/15 text-accent-text",
  disputed: "border-danger/40 bg-danger/10 text-danger",
  removed: "border-border bg-background text-muted",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        STATUS_STYLES[status] ?? STATUS_STYLES.pending
      }`}
    >
      {label}
    </span>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center text-sm font-semibold text-muted">
      ‹ {label}
    </Link>
  );
}

export const inputClass =
  "block min-h-14 w-full rounded-2xl border border-border bg-surface px-4 text-base outline-none focus:border-accent-text";
