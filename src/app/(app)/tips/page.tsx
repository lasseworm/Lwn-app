import type { Metadata } from "next";
import { BackLink, Card } from "@/components/ui";
import { tipCategoriesDa, tipsDa, type TipCategory } from "@/content/tips";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t.tips.title };

const ORDER: TipCategory[] = ["technique", "training", "recovery", "gym", "motivation"];

export default function TipsPage() {
  return (
    <main className="space-y-6">
      <BackLink href="/hjem" label={t.nav.home} />
      <header>
        <h1 className="text-3xl font-black tracking-tight">{t.tips.title}</h1>
        <p className="mt-2 text-base text-muted">{t.tips.intro}</p>
      </header>

      {/* Hurtig navigation mellem emner */}
      <nav aria-label="Emner" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {ORDER.map((c) => (
          <a key={c} href={`#${c}`} className="shrink-0 rounded-full border border-border px-3 py-2 text-sm font-semibold text-muted">
            {tipCategoriesDa[c]}
          </a>
        ))}
      </nav>

      {ORDER.map((c) => (
        <section key={c} id={c} className="scroll-mt-6 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">{tipCategoriesDa[c]}</h2>
          <ul className="space-y-3">
            {tipsDa
              .filter((tip) => tip.category === c)
              .map((tip) => (
                <li key={tip.id}>
                  <Card>
                    <h3 className="text-xl font-bold">{tip.title}</h3>
                    <p className="mt-1 text-base leading-relaxed">{tip.text}</p>
                  </Card>
                </li>
              ))}
          </ul>
        </section>
      ))}

      <p className="text-sm text-muted">{t.tips.note}</p>
    </main>
  );
}
