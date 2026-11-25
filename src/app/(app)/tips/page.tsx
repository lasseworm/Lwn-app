import type { Metadata } from "next";
import { BackLink, Card } from "@/components/ui";
import { tipsDa } from "@/content/tips";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t.tips.title };

export default function TipsPage() {
  return (
    <main className="space-y-5">
      <BackLink href="/hjem" label={t.nav.home} />
      <header>
        <h1 className="text-3xl font-black tracking-tight">{t.tips.title}</h1>
        <p className="mt-2 text-base text-muted">{t.tips.intro}</p>
      </header>
      <ol className="space-y-3">
        {tipsDa.map((tip, i) => (
          <li key={tip.id}>
            <Card>
              <h2 className="text-xl font-bold">
                <span className="mr-2 text-accent-text">{i + 1}.</span>
                {tip.title}
              </h2>
              <p className="mt-1 text-base leading-relaxed">{tip.text}</p>
            </Card>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted">{t.tips.note}</p>
    </main>
  );
}
