/**
 * Tips & tricks (byggeplan skærm 9): korte overskrifter med meget kort tekst.
 * UDKAST – gennemgås før ekstern test. Generel træningsvejledning, ikke medicinsk rådgivning.
 * Struktureret pr. sprog, så flere sprog kan tilføjes senere.
 */
export type TipCategory = "technique" | "training" | "recovery" | "gym" | "motivation";

export type Tip = { id: string; category: TipCategory; title: string; text: string };

export const tipCategoriesDa: Record<TipCategory, string> = {
  technique: "Teknik",
  training: "Træning",
  recovery: "Restitution",
  gym: "I centret",
  motivation: "Motivation",
};

export const tipsDa: Tip[] = [
  // ------------------------------------------------------------------ Teknik
  {
    id: "technique-first",
    category: "technique",
    title: "Teknik før vægt",
    text: "Lær bevægelsen med en let vægt. Vægten skal nok stige, når teknikken sidder – det sørger progressionen for.",
  },
  {
    id: "tempo",
    category: "technique",
    title: "Roligt tempo",
    text: "Sænk vægten på 2–3 sekunder, og løft den kontrolleret. Undgå at svinge eller kaste vægten.",
  },
  {
    id: "mind-muscle",
    category: "technique",
    title: "Mærk musklen",
    text: "Tænk på den muskel, du træner, mens du løfter. Det hjælper dig med at mærke, at det er den, der gør arbejdet.",
  },
  {
    id: "range",
    category: "technique",
    title: "Brug hele bevægelsen",
    text: "Gå så langt i bevægelsen, som du kan kontrollere uden ubehag. Små, hurtige halve gentagelser giver typisk mindre udbytte.",
  },
  {
    id: "breathing",
    category: "technique",
    title: "Pust ud, når det er tungt",
    text: "Pust ud i den tunge del af løftet og ind i den lette. Hold ikke vejret gennem hele sættet.",
  },
  {
    id: "adjust-machine",
    category: "technique",
    title: "Indstil maskinen hver gang",
    text: "Justér sæde og puder, før du starter – også selvom du brugte maskinen sidst. Den rigtige indstilling gør øvelsen både sikrere og mere effektiv. Se vejledningen til maskinen.",
  },
  {
    id: "stable-start",
    category: "technique",
    title: "Find en stabil startposition",
    text: "Sid eller stå stabilt med fødderne i gulvet og ryggen mod ryglænet, før du begynder at løfte.",
  },
  {
    id: "no-lockout",
    category: "technique",
    title: "Lås ikke leddene",
    text: "Stræk arme og ben næsten helt ud, men undgå at låse albuer og knæ i yderstillingen. Så bliver belastningen i musklerne.",
  },
  {
    id: "neutral-back",
    category: "technique",
    title: "Hold ryggen neutral",
    text: "Hold ryggen i sin naturlige stilling – hverken rund eller svajet. Det gælder især i benpres, roning og rygøvelser.",
  },
  {
    id: "control-return",
    category: "technique",
    title: "Kontrollér vejen tilbage",
    text: "Lad ikke vægten falde ned i stakken. Den rolige vej tilbage er en vigtig del af øvelsen – ikke en pause.",
  },
  {
    id: "grip",
    category: "technique",
    title: "Fast, men afslappet greb",
    text: "Hold fast i håndtagene uden at klemme hårdere end nødvendigt. Et krampagtigt greb spænder nakke og skuldre unødigt op.",
  },

  // ------------------------------------------------------------------ Træning
  {
    id: "reps-in-reserve",
    category: "training",
    title: "Stop med lidt i overskud",
    text: "Afslut sættet, når du har cirka 1–2 gode gentagelser tilbage. Du behøver ikke presse dig helt til grænsen for at blive stærkere.",
  },
  {
    id: "rest",
    category: "training",
    title: "Pause mellem sæt",
    text: "Hold 1–2 minutters pause mellem sættene – lidt længere på de store øvelser som benpres og brystpres.",
  },
  {
    id: "warm-up",
    category: "training",
    title: "Varm op",
    text: "Start med et par minutters let kondition og et let sæt af den første øvelse. Du kan slå opvarmningssæt til under Profil.",
  },
  {
    id: "big-first",
    category: "training",
    title: "Store øvelser først",
    text: "Programmet starter med øvelser, der bruger mange muskler på én gang. Hold rækkefølgen, så du laver dem, mens du har mest energi.",
  },
  {
    id: "small-steps",
    category: "training",
    title: "Små skridt er fremgang",
    text: "Én gentagelse mere eller ét vægttrin op er fremgang. Over uger og måneder bliver de små skridt til meget.",
  },
  {
    id: "use-alternatives",
    category: "training",
    title: "Erstat i stedet for at springe over",
    text: "Kan du ikke lide en øvelse, så brug \"Find alternativ\" i stedet for at springe den over. Så bliver musklen stadig trænet.",
  },
  {
    id: "log-honestly",
    category: "training",
    title: "Registrér ærligt",
    text: "Notér de gentagelser, du faktisk lavede med god teknik. Så rammer progressionen rigtigt næste gang.",
  },
  {
    id: "plateau",
    category: "training",
    title: "Når det går tungt",
    text: "Alle har dage, hvor det ikke går fremad. Tryk \"Progression virkede ikke\", så gentager du dit sidste gode niveau næste gang.",
  },
  {
    id: "rest-days",
    category: "training",
    title: "Hviledage mellem pas",
    text: "Musklerne har brug for tid til at komme sig. Hold gerne en hviledag mellem to fuldkropspas – især i starten.",
  },
  {
    id: "after-break",
    category: "training",
    title: "Efter en pause",
    text: "Har du holdt pause, så start lidt lettere og byg op igen. Appen foreslår selv en lettere vægt efter mere end to uger.",
  },
  {
    id: "cardio",
    category: "training",
    title: "Kondition er et godt supplement",
    text: "Gang, cykling eller roning et par gange om ugen supplerer styrketræningen godt – for både hjerte og humør.",
  },

  // ------------------------------------------------------------------ Restitution
  {
    id: "recovery",
    category: "recovery",
    title: "Musklerne bygges, når du hviler",
    text: "Søvn og mad er en del af træningen. Sov godt, og få protein fordelt over dagens måltider.",
  },
  {
    id: "soreness-vs-pain",
    category: "recovery",
    title: "Ømhed er normalt – smerte er ikke",
    text: "Lidt ømhed dagen efter er helt normalt, især i starten. Skarp eller vedvarende smerte er et signal om at stoppe og søge professionel vurdering.",
  },
  {
    id: "water",
    category: "recovery",
    title: "Drik vand",
    text: "Hav en vandflaske med, og tag en tår mellem sættene.",
  },
  {
    id: "eat-before",
    category: "recovery",
    title: "Spis lidt inden",
    text: "Et let måltid 1–3 timer før træning giver energi. Undgå at træne helt sulten, hvis du let bliver svimmel.",
  },
  {
    id: "protein",
    category: "recovery",
    title: "Protein fra flere kilder",
    text: "Mejeriprodukter, æg, fisk, kød, bønner og linser giver alle protein. Fordel det over dagens måltider.",
  },
  {
    id: "sleep",
    category: "recovery",
    title: "Sov nok",
    text: "De fleste voksne har det bedst med 7–9 timers søvn. Det hjælper både restitution, energi og motivation.",
  },
  {
    id: "sick",
    category: "recovery",
    title: "Hold pause, når du er syg",
    text: "Har du feber eller føler dig syg, så bliv hjemme. Kom tilbage, når du er rask – progressionen venter på dig.",
  },

  // ------------------------------------------------------------------ I centret
  {
    id: "wipe",
    category: "gym",
    title: "Tør maskinen af",
    text: "Tør sæde og håndtag af efter brug. Det sætter dine træningskammerater pris på.",
  },
  {
    id: "rack-weights",
    category: "gym",
    title: "Læg vægtene på plads",
    text: "Sæt håndvægte og skiver tilbage efter brug, så næste person kan finde dem – og ingen falder over dem.",
  },
  {
    id: "share-machine",
    category: "gym",
    title: "Del maskinen",
    text: "Er maskinen optaget, så spørg, om I kan skiftes mellem sættene, eller tryk \"Maskinen er optaget\" for at finde et alternativ.",
  },
  {
    id: "ask-staff",
    category: "gym",
    title: "Spørg personalet",
    text: "Er du i tvivl om en maskine, så spørg en instruktør. Det er det, de er der for – og ingen spørgsmål er dumme.",
  },
  {
    id: "quiet-hours",
    category: "gym",
    title: "Undgå myldretiden",
    text: "Er centret fyldt, kan det betale sig at træne uden for de travleste tider, fx tidligt om morgenen eller sidst på aftenen.",
  },
  {
    id: "shoes",
    category: "gym",
    title: "Stabile sko",
    text: "Brug lukkede sko med en fast sål. Meget bløde løbesko kan gøre dig mindre stabil, fx i benpres.",
  },

  // ------------------------------------------------------------------ Motivation
  {
    id: "consistency",
    category: "motivation",
    title: "Regelmæssighed slår alt",
    text: "Det vigtigste er at komme afsted. To pas om ugen, hver uge, giver mere end fire pas i én uge og så en lang pause.",
  },
  {
    id: "fixed-time",
    category: "motivation",
    title: "Giv træningen en fast tid",
    text: "Læg træningen i kalenderen som en aftale med dig selv. En fast tid gør det lettere at holde fast i vanen.",
  },
  {
    id: "see-progress",
    category: "motivation",
    title: "Se, hvor langt du er kommet",
    text: "Kig under Fremgang en gang imellem. Det motiverer at se, hvordan vægtene og gentagelserne er steget.",
  },
  {
    id: "short-session",
    category: "motivation",
    title: "Et kort pas tæller også",
    text: "På en travl dag er et kort pas bedre end intet. Lav de første øvelser, og tag hjem med god samvittighed.",
  },
  {
    id: "compare-yourself",
    category: "motivation",
    title: "Sammenlign dig med dig selv",
    text: "Alle starter et sted. Mål din fremgang mod dig selv for en måned siden – ikke mod andre i centret.",
  },
];

/** Dagens tip: skifter ved midnat dansk tid og er det samme for alle medlemmer den dag */
export function tipOfTheDay(date: Date, tips: Tip[] = tipsDa, timeZone = "Europe/Copenhagen"): Tip {
  // Kalenderdato i Danmark (YYYY-MM-DD), uanset serverens tidszone
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const day = Math.floor(Date.parse(`${ymd}T00:00:00Z`) / 86_400_000);
  return tips[day % tips.length];
}
