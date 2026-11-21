import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t.privacy.title };

// UDKAST – skal gennemgås før ekstern test (Trin 6). Ikke juridisk rådgivning.
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-md space-y-4 px-6 py-10 text-base leading-relaxed">
      <Link href="/" className="text-sm font-semibold text-muted">‹ {t.app.name}</Link>
      <h1 className="text-3xl font-black tracking-tight">{t.privacy.title}</h1>
      <p>LWN er i testfase. Her er kort, hvad vi gemmer, og hvorfor.</p>
      <h2 className="pt-2 text-lg font-bold">Hvad vi gemmer</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Din e-mail (til login) og evt. dit navn.</li>
        <li>Dine træningsvalg: erfaring, mål, antal pas, centre og træningslog.</li>
        <li>Fotos af udstyr, du selv uploader. Fotos af personer må ikke uploades.</li>
      </ul>
      <h2 className="pt-2 text-lg font-bold">Hvor</h2>
      <p>Data opbevares hos Supabase og Vercel i EU-region.</p>
      <h2 className="pt-2 text-lg font-bold">Dine rettigheder</h2>
      <p>Du kan eksportere og slette dine data fra din profil (kommer i en senere version – indtil da kan du skrive til os).</p>
      <h2 className="pt-2 text-lg font-bold">Sundhed</h2>
      <p>LWN giver generel træningsvejledning og er ikke medicinsk rådgivning.</p>
    </main>
  );
}
