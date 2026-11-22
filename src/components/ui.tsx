import Link from "next/link";
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
    <div className={`rounded-3xl border border-border bg-surface p-5 ${className}`}>{children}</div>
  );
}

export function SampleBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
      {label}
    </span>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline font-black tracking-tight ${className}`}>
      LWN<span className="text-accent">.</span>
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  verified: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  disputed: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
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
  "block min-h-14 w-full rounded-2xl border border-border bg-surface px-4 text-base outline-none focus:border-accent";
