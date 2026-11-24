# LWN – ny grafisk identitet på den eksisterende side

Hjemmesiden/appen virker allerede. **Lav ikke noget om fra bunden.** Behold struktur, funktioner, tekster, links, login (Supabase), PWA/service worker og integrationer. Det eneste, der skal ændres, er det visuelle udtryk: nyt logo, orange accentfarve og et par nye sektioner på forsiden.

Læs `AGENTS.md` først. Next.js-versionen i projektet afviger fra det, du kender, så tjek de relevante guides i `node_modules/next/dist/docs/`, før du skriver kode.

## 0. Arbejdsgang

- Arbejd på branchen `redesign/lwn-identitet`. Push ikke til `main`. Jeg tjekker Vercels preview-link, før det går live.
- Start med at gennemgå koden og skriv en kort plan: hvilke filer der skal ændres, og hvorfor. Lav derefter ændringerne i små commits.
- Kør `npm run lint`, `npm run typecheck` og `npm run build` til sidst. Tjek siden på mobil (ca. 375 px) og desktop (ca. 1280 px).

## 1. Logo

Logofilerne ligger klar i `public/brand/`:

| Fil | Brug |
|---|---|
| `lwn-logo-transparent.png` | Logo med transparent baggrund (1034×937). Bruges i header, footer og på login-siden. |
| `lwn-icon-1024.png` | App-ikon på mørk baggrund (#111214), kildefil. |
| `icon-512.png`, `icon-192.png`, `apple-touch-icon.png`, `favicon-48.png` | Færdige ikonstørrelser. |
| `icon-maskable-512.png` | Maskable-ikon med sikker margin til Android. |
| `lwn-logo-original.png` | Originalfilen. Bruges ikke direkte. |

- Erstat tekstlogoet `LWN<span className="text-accent">.</span>` i `src/components/ui.tsx` med `lwn-logo-transparent.png` via `next/image`. Sæt en fast højde (ca. 40–48 px i header) og `alt="LWN – Learn. Workout. Never Quit."`.
- Kopiér ikonstørrelserne fra `public/brand/` over de eksisterende filer i `public/icons/` med samme filnavne, så `manifest.ts` og `layout.tsx` fortsat peger rigtigt. Tjek, at alle referencer passer.
- Logoet er detaljeret og bliver utydeligt meget småt. Hvis favicon-48 ikke kan læses, så lav en forenklet favicon (fx kun figuren eller kun "LWN" i hvid/orange) i stedet for at gætte.

## 2. Farver

Al farve styres i dag fra CSS-variabler i `src/app/globals.css` (`--accent` er grøn: #12b76a / #32d583). Skift paletten dér, så komponenterne følger med automatisk:

| Rolle | Farve |
|---|---|
| Accent (orange) | #FF8A00 |
| Tekst på accent | #111214 (mørk – **aldrig hvid tekst på orange**, kontrasten er for lav) |
| Baggrund (mørk) | #111214 |
| Overflade / kort (mørk) | #1C1D20 |
| Tekst (mørk) | #FFFFFF |
| Sekundær tekst (mørk) | #B8B8B8 |

- Mørk tilstand får den nye palette fuldt ud. Lys tilstand **beholdes**, men grøn erstattes af orange. Hvor orange bruges som tekst på lys baggrund, så brug en mørkere orange, så kontrasten er mindst 4.5:1 (WCAG AA).
- Søg hele `src/` igennem for hårdkodede grønne farver og Tailwind-klasser (green, emerald, lime) og erstat dem.
- Opdatér `themeColor` i `src/app/layout.tsx` samt `background_color`/`theme_color` i `src/app/manifest.ts` til #111214 for mørk.
- Google-ikonet i `src/app/login/login-form.tsx` har sine egne farver. Rør dem ikke.

## 3. Typografi og stil

- Overskrifter: fed, lidt smal sans-serif, fx **Barlow** eller **Barlow Semi Condensed** via `next/font/google`. Brødtekst må gerne forblive som nu (eller Inter).
- Store, tydelige overskrifter, god luft mellem sektioner, mørke kort/paneler med afrundede hjørner (ca. 16 px) og orange CTA-knapper.
- Ikoner: brug `lucide-react` (fx `BookOpen`, `Dumbbell`, `TrendingUp`) i orange, så de passer sammen. Tegn ikke egne ikoner.

## 4. Forside / hero (`src/app/page.tsx`, tekster i `src/i18n/da.ts`)

Behold alle eksisterende tekster præcis som de er:

- Overskrift: **Learn. / Workout. / Never Quit.** Prikken efter "Quit" bliver orange.
- Undertitel: **YOUR GYM. YOUR EQUIPMENT. YOUR PROGRESS.**
- Intro: "Fotografér maskinerne i dit center. Få et program, der passer til netop dem. Lær hvordan – ikke kun hvad."
- De tre fordele: Bygget på udstyret i dit eget center · Automatisk progression – gratis · Vejledning til hver maskine
- "Kom i gang"-knappen bliver orange med mørk tekst.

**Hero-billede:** Der er endnu ikke noget billede. Lav layoutet, så et billede kan sættes ind fra `public/images/hero.jpg` (vis det kun, hvis filen findes, ellers en rolig mørk baggrund med en diskret orange diagonal stribe). Generér, download eller hotlink **ikke** billeder selv. Billedet skal senere vise almindelige mennesker i forskellige aldre, der lærer styrketræning med hjælp og vejledning, ikke professionelle bodybuildere.

## 5. Ny sektion: Learn / Get started / Keep progressing

De tre eksisterende fordele og de tre nye punkter siger næsten det samme. **Lav dem ikke begge.** Erstat fordelslisten med tre kort i én sektion lige under hero, og flet teksterne:

1. **LEARN** (BookOpen) – Lær øvelser, maskiner og korrekt teknik. *Vejledning til hver maskine.*
2. **GET STARTED** (Dumbbell) – Få et program, der passer til udstyret i dit eget center. *Bygget på udstyret i dit eget center.*
3. **KEEP PROGRESSING** (TrendingUp) – Følg din udvikling. *Automatisk progression – gratis.*

Teksterne skal ligge i `src/i18n/da.ts` som resten. Kortene ligger i én række på desktop og under hinanden på mobil.

## 6. Hvad der IKKE skal med

Designreferencen fra ChatGPT er kun et billede af stilen. Tilføj **ikke**:

- App Store- eller Google Play-knapper eller "Download the App"
- Engelske tekster, der ikke allerede findes på siden
- Statistik eller tal fra referencen (12 workouts, 5.2h, +8 % osv.)
- Nye menupunkter (Features, FAQ osv.)

## 7. Resten af appen

Indloggede sider (`src/app/(app)/…`, `bottom-nav.tsx`, login, privatliv) skal blot følge den nye palette via CSS-variablerne. Ingen layoutændringer dér. Bundmenuens aktive punkt bliver orange.

## 8. Til sidst

Giv mig en kort oversigt over ændrede filer, skærmbilleder af forsiden (mobil og desktop) og de ting, du var i tvivl om.
