import type { Metadata } from "next";
import Link from "next/link";
import { Card, SampleBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { muscleName, t } from "@/i18n";

export const metadata: Metadata = { title: t.catalog.title };

const CATEGORY_ORDER = ["machine", "multi", "free_weight", "accessory", "cardio"];

export default async function CatalogPage() {
  const supabase = await createClient();
  const { data: types, error } = await supabase
    .from("machine_types")
    .select("slug, name, category, is_multipurpose, primary_muscles, is_sample")
    .order("name");

  if (error) throw new Error(error.message);

  const groups = CATEGORY_ORDER.map((c) => ({
    category: c,
    items: (types ?? []).filter((m) => m.category === c),
  })).filter((g) => g.items.length > 0);

  const anySample = types?.some((m) => m.is_sample);

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight">{t.catalog.title}</h1>
        <p className="mt-2 text-base text-muted">{t.catalog.intro}</p>
        {anySample && (
          <p className="mt-3 flex items-start gap-2 text-sm text-muted">
            <SampleBadge label={t.catalog.sampleBadge} />
            {t.catalog.sampleNotice}
          </p>
        )}
      </header>

      {groups.map((g) => (
        <section key={g.category}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted">
            {t.categories[g.category] ?? g.category}
          </h2>
          <Card className="p-0">
            <ul className="divide-y divide-border">
              {g.items.map((m) => (
                <li key={m.slug}>
                  <Link href={`/katalog/${m.slug}`} className="flex min-h-16 items-center justify-between gap-3 px-5 py-3">
                    <span>
                      <span className="block text-base font-semibold">{m.name}</span>
                      <span className="block text-sm text-muted">
                        {m.is_multipurpose
                          ? t.catalog.multipurpose
                          : (m.primary_muscles ?? []).map(muscleName).join(", ")}
                      </span>
                    </span>
                    <span aria-hidden className="text-muted">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ))}
    </main>
  );
}
