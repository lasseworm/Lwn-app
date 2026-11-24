"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, House, LayoutGrid } from "lucide-react";
import { t } from "@/i18n";

// Flere punkter (Program, Fremgang, Profil) tilføjes i de næste trin.
const items = [
  { href: "/hjem", label: t.nav.home, icon: House },
  { href: "/center", label: t.nav.center, icon: Dumbbell },
  { href: "/katalog", label: t.nav.catalog, icon: LayoutGrid },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Hovedmenu"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                  active ? "text-accent-text" : "text-muted"
                }`}
              >
                <Icon aria-hidden size={24} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
