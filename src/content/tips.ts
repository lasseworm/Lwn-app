/**
 * Tips & tricks (byggeplan skærm 9): korte overskrifter med meget kort tekst.
 * UDKAST – gennemgås før ekstern test. Generel træningsvejledning, ikke medicinsk rådgivning.
 * Struktureret pr. sprog, så flere sprog kan tilføjes senere.
 */
export type Tip = { id: string; title: string; text: string };

export const tipsDa: Tip[] = [
  {
    id: "technique-first",
    title: "Teknik før vægt",
    text: "Lær bevægelsen med en let vægt. Vægten skal nok stige, når teknikken sidder – det sørger progressionen for.",
  },
  {
    id: "tempo",
    title: "Roligt tempo",
    text: "Sænk vægten på 2–3 sekunder, og løft den kontrolleret. Undgå at svinge eller kaste vægten.",
  },
  {
    id: "mind-muscle",
    title: "Mærk musklen",
    text: "Tænk på den muskel, du træner, mens du løfter. Det hjælper dig med at mærke, at det er den, der gør arbejdet.",
  },
  {
    id: "range",
    title: "Brug hele bevægelsen",
    text: "Gå så langt i bevægelsen, som du kan kontrollere uden ubehag. Små, hurtige halve gentagelser giver typisk mindre udbytte.",
  },
  {
    id: "breathing",
    title: "Pust ud, når det er tungt",
    text: "Pust ud i den tunge del af løftet og ind i den lette. Hold ikke vejret gennem hele sættet.",
  },
  {
    id: "reps-in-reserve",
    title: "Stop med lidt i overskud",
    text: "Afslut sættet, når du har cirka 1–2 gode gentagelser tilbage. Du behøver ikke presse dig helt til grænsen for at blive stærkere.",
  },
  {
    id: "rest",
    title: "Pause mellem sæt",
    text: "Hold 1–2 minutters pause mellem sættene – lidt længere på de store øvelser som benpres og brystpres.",
  },
  {
    id: "consistency",
    title: "Regelmæssighed slår alt",
    text: "Det vigtigste er at komme afsted. To pas om ugen, hver uge, giver mere end fire pas i én uge og så en lang pause.",
  },
  {
    id: "recovery",
    title: "Musklerne bygges, når du hviler",
    text: "Søvn og mad er en del af træningen. Sov godt, og få protein fordelt over dagens måltider.",
  },
  {
    id: "soreness-vs-pain",
    title: "Ømhed er normalt – smerte er ikke",
    text: "Lidt ømhed dagen efter er helt normalt, især i starten. Skarp eller vedvarende smerte er et signal om at stoppe og søge professionel vurdering.",
  },
];

/** Dagens tip: skifter én gang i døgnet, samme for alle */
export function tipOfTheDay(date: Date, tips: Tip[] = tipsDa): Tip {
  const day = Math.floor(date.getTime() / 86_400_000);
  return tips[day % tips.length];
}
