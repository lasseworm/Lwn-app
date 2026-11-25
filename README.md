# LWN – Learn. Workout. Never Quit.

*Your Gym. Your Equipment. Your Progress.*

PWA bygget med Next.js 16 (App Router, TypeScript, Tailwind 4), Supabase (Postgres, Auth, Storage, RLS) og Serwist (service worker). Produktbeskrivelse og byggeplan: [`docs/LWN-samlet-prompt.md`](docs/LWN-samlet-prompt.md) og [`docs/LWN-byggeplan.md`](docs/LWN-byggeplan.md).

**Status:** Trin 0–4 er færdige: fundament, login, centre og udstyr, program, træning og progression, fremgang med grafer, tips, profil med eksport og sletning af data samt feedback.

---

## Projektstruktur

```
src/
  app/
    page.tsx                 Velkomst
    login/                   Login (magic link + Google), server actions
    auth/callback/route.ts   Modtager login-links og Google-login
    (app)/hjem               Hjem (kræver login)
    (app)/katalog            Udstyrskatalog + maskinside med instruktioner
    (app)/center             Mit center: find/opret center, udstyrsliste, tilføj maskine,
                             ekstra standardudstyr, udstyrsside (bekræft/ret/rapportér/fjern)
    (app)/onboarding         Erfaring, mål, pas/uge, opvarmning
    (app)/program            Mit program: ugeplan, start pas, generér nyt program
    (app)/traening/[id]      Træningsskærm (aktivt pas) og opsummering
    api/ai/equipment         Foto → forslag til maskintype (Claude, struktureret JSON)
    api/ai/weight-stack      Foto af vægtstak → vægttrin, min/max, mellemplade
    privatliv/               Privatlivspolitik (udkast)
    manifest.ts              PWA-manifest
    sw.ts                    Service worker (cacher kun statiske filer)
    serwist/[path]/route.ts  Serverer service workeren på /serwist/sw.js
  proxy.ts                   Fornyer session + beskytter sider bag login
  lib/supabase/              Supabase-klienter + genererede databasetyper
  lib/ai/                    AI-tilstand (off/mock/live), model, genkendelse, fotohåndtering
  lib/equipment/weights.ts   Vægttrin-logik (med tests)
  lib/training/progression.ts  Dobbelt progression, hold-level, pause, smerte (med tests)
  lib/training/generator.ts    Programgenerator (med tests mod det rigtige katalog)
  lib/image.ts               Komprimering i browseren (fjerner EXIF/GPS)
  i18n/                      Alle tekster (dansk først, klar til flere sprog)
supabase/
  migrations/                Skema, RLS, storage-bucket, startkatalog
  seed.sql                   Demo-center – KUN lokal udvikling
```

---

## Test lokalt

Kræver Node 20.9+ og Docker Desktop (til lokal Supabase).

```bash
npm install
npx supabase start          # starter Postgres, Auth, Storage og Mailpit i Docker
npx supabase status         # vis URL og "Publishable key"
cp .env.example .env.local  # og udfyld:
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Publishable key fra status>
npm run dev                 # åbn http://localhost:3000
```

1. Klik **Kom i gang** og skriv en vilkårlig e-mail.
2. Åbn **Mailpit** på http://127.0.0.1:54324 – her lander alle lokale e-mails. Klik på login-linket.
3. Du lander på **Hjem**. Gå til **Maskiner** og åbn fx *Benpres*.
4. Supabase Studio (database-browser) kan åbnes på http://127.0.0.1:54323.

Nulstil databasen (kører alle migrationer + `seed.sql` igen): `npm run db:reset`.

Øvrige kommandoer: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

---

## Program og progression (Trin 3)

- **Programgenerator:** 2 pas = fuld krop A/B, 3 pas = fuld krop A/B/C, 4 pas = overkrop/underkrop × 2. Maskiner kommer først, frie vægte kun hvis en bevægelse ellers ikke kan dækkes, og intet tvinges ind. Husker brugerens udeladelser og foretrukne alternativer. Viser hvilke muskelgrupper centret mangler udstyr til.
- **Progression:** dobbelt progression (+1 rep, derefter næste gyldige vægttrin), og den sænker aldrig automatisk. "Progression virkede ikke" gentager sidste vellykkede niveau. Efter mere end 14 dages pause foreslås en lettere start. Smerte stopper øvelsen uden progression. Assisterede maskiner går den anden vej (mindre hjælp).
- **Data går ikke tabt:** Hvert sæt gemmes med det samme. Et pas afsluttes, og progressionen gemmes, atomisk i databasen (`finish_workout`), og serveren genberegner progressionen selv.
- Tærskler kan ændres i `PROGRESSION_CONFIG`. Evidensgrundlaget står i [`docs/evidens.md`](docs/evidens.md).

## Fremgang, tips og profil (Trin 4)

- **Fremgang** (`/fremgang`): 7 dage, 30 dage, 6 mdr. og 12 mdr., hver sammenlignet med perioden før. Nøgletal: pas, sæt, løftet i alt og regelmæssighed. Hertil rekorder (med "Ny"-mærke) og en graf pr. øvelse med tabelvisning. Beregningerne ligger i `src/lib/training/stats.ts` (med tests).
- **Tips & tricks** (`/tips`): 10 korte tips i `src/content/tips.ts` (udkast). Dagens tip vises på Hjem.
- **Profil** (`/profil`): ret oplysninger, se og fjern gemte alternativer, centre, links til Pro, tips, katalog og privatliv.
  - **Eksportér mine data:** JSON-fil via `/api/export`.
  - **Slet min konto:** databasefunktionen `delete_my_account()`. Et aktivt, ikke-opsagt Pro-abonnement blokerer sletningen.
- **Feedback:** "Giv feedback" nederst på alle sider. Beskeden gemmes i tabellen `feedback` sammen med skærmen, den er skrevet fra.
- **12-ugers-spørgsmålet:** Efter 12 uger med mindst 60 % af de planlagte pas tilbyder Hjem et opdateret program, eventuelt med flere frie vægte. Spørgsmålet kan udsættes 4 uger.

## AI-genkendelse og pris

AI'en bruges kun to steder: genkendelse af maskintype fra et foto og aflæsning af en vægtstak. Alt andet er gratis at køre.

| `AI_MODE` | Hvad sker der | Pris |
|---|---|---|
| `off` (standard uden nøgle) | Brugeren vælger selv maskintype og vægttrin | Gratis |
| `mock` | Opdigtede, realistiske svar (fx "Brystpres-maskine, 85 %"), så hele flowet kan testes | Gratis |
| `live` (standard med nøgle) | Rigtige kald til Claude API | Tokens |

- Model: `claude-haiku-5-5` (kan ændres med `LWN_AI_MODEL`). Billeder komprimeres til maks. 1280 px før upload, og effort er sat lavt for at holde prisen nede.
- Sæt et månedligt forbrugsloft på console.anthropic.com → Settings → Limits.
- Hvert kald logges i Vercel-loggen som `[ai] equipment model=… input=… output=…`, så forbruget kan følges.

**Privatliv:** Brugeren skal bekræfte, at billedet kun viser udstyr. Billedet komprimeres i browseren, hvilket fjerner EXIF og GPS. Viser billedet en person eller ikke udstyr, sletter serveren det med det samme. Fotos af vægtstakke slettes altid efter aflæsning.

> Service workeren er slået fra i `npm run dev`. Test PWA/installation med `npm run build && npm start`.

---

## Opsætning i skyen (Trin 0 – gøres én gang)

### 1. Supabase (EU)
1. Opret projekt på supabase.com → **Region: Central EU (Frankfurt)**.
2. Kør migrationerne mod projektet. **Bemærk:** produktionsdatabasen ("Fitness app development") er sat op via Supabase-forbindelsen i Claude Code. Nye migrationer køres derfor også derfra, ikke med `db push`.
3. **Authentication → URL Configuration:**
   - Site URL: `https://lwn.dk`
   - Redirect URLs: `https://lwn.dk/auth/callback`, `http://localhost:3000/auth/callback` og `https://*-<dit-vercel-team>.vercel.app/auth/callback` (til preview-deploys)
4. **Google-login (valgfrit):** Authentication → Sign In / Providers → Google. Kræver et OAuth Client ID fra Google Cloud Console med redirect-URI `https://<projekt-ref>.supabase.co/auth/v1/callback`. Indtil det er sat op, virker kun magic link.
5. **E-mail:** Supabases indbyggede e-mail er stærkt begrænset (få mails i timen). Før test med andre: Authentication → SMTP Settings → brug fx Resend, Postmark eller Brevo (EU).
6. Find nøglerne under **Project Settings → API Keys** (Publishable key) og **Data API** (URL).

### 2. Vercel
1. Importér GitHub-repoet på vercel.com.
2. **Settings → Functions → Region:** Frankfurt (`fra1`).
3. **Settings → Environment Variables** (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `ANTHROPIC_API_KEY` (valgfri – uden den kører AI i `off`-tilstand)
   - `AI_MODE` (valgfri – sæt til `mock` for at teste flowet gratis)
4. Deploy. Hver push til GitHub deployer automatisk.

### 3. Domænet lwn.dk
Vercel → Settings → Domains → tilføj `lwn.dk` (og `www.lwn.dk`). Opret de DNS-poster, Vercel viser, hos din domæneudbyder. HTTPS kommer automatisk.

### 4. Test på telefonen
Åbn `https://lwn.dk` i Chrome på Android (eller Safari på iPhone) → log ind → menuen **Føj til startskærm / Installer app**.

---

## CAPTCHA på login (Cloudflare Turnstile)

Login-formularen (magic link) er beskyttet mod robotter med Cloudflare Turnstile. Tjekket kører
normalt usynligt og vises kun, hvis Cloudflare har brug for et klik. Google-login er ikke omfattet,
fordi Google selv beskytter det trin.

Opsætning (rækkefølgen er vigtig, så ingen låses ude):
1. Opret et Turnstile-widget på dash.cloudflare.com → Turnstile. Tilføj domænerne `lwn.dk`, `www.lwn.dk` og `vercel.app`. Vælg widget-tilstanden "Managed".
2. Sæt `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (site key) i Vercel for Production og Preview, og redeploy.
3. **Derefter** skal du i Supabase gå til Authentication → Attack Protection → Enable CAPTCHA protection → Turnstile og indsætte den **hemmelige** nøgle.

Uden site key i Vercel vises intet tjek, og login virker som før. Slår du det til i Supabase før trin 2, kan ingen logge ind med e-mail.

## Sikkerhed og data

- **RLS er slået til på alle tabeller.** Personlige data (profil, programmer, træning, progression, præferencer, feedback) kan kun ses af ejeren. Centre, udstyr og katalog kan læses af alle indloggede. Ikke-indloggede kan intet læse.
- Fælles data har ingen slette-adgang – "sletning" sker via `status = 'removed'`.
- Sletning af en konto (`auth.users`) sletter alle personlige data via cascade; centre/udstyr brugeren har oprettet bevares (uden reference til brugeren).
- Storage-bucket `equipment-photos` er privat (kun signerede URL'er), kun JPEG/PNG/WebP, maks. 5 MB.
- Migrationer skal altid være additive – de må aldrig slette brugerdata.
- Nøgler ligger kun i `.env.local` / Vercel – aldrig i git. `ANTHROPIC_API_KEY` må aldrig have `NEXT_PUBLIC_`-præfiks.

## Eksempeldata

- Katalog (41 maskintyper, 52 øvelser) ligger i en migration og er markeret `is_sample = true`. Det vises med et **Eksempel**-mærke og skal kvalitetssikres.
- `supabase/seed.sql` opretter et demo-center (`is_sample = true`) – kun lokalt.
- **Stregtegninger af øvelserne** (`src/content/illustrations/`) er midlertidige og kun til test. De vises som "Start" og "Slut" på træningsskærmen, i vejledningen og på maskinens side. **De skal erstattes af rigtige illustrationer eller fotos, før appen bruges af andre.** Nøglen er `exercises.slug`, og en test sikrer, at alle øvelser i kataloget har en tegning.

---

## LWN Pro (Stripe) og AI-kvoter

- **Gratis:** centeropsætning med AI-genkendelse (30/md.), opstartsprogrammer (2/md.), logning.
- **Pro (39 kr./md., 14 dages prøve):** flere genkendelser + AI-coach, AI-programmer og analyse (kommer).
- Grænser står i tabellen `plan_limits` og kan ændres i Supabase uden kodeændring.
- Hvert AI-kald gemmes i `ai_usage` (tokens pr. bruger og funktion).
- Er kvoten brugt op, kan brugeren stadig vælge maskintype og vægttrin selv – gratis.

**Filer:** `src/lib/stripe.ts` (Stripe REST + webhook-signatur, ingen ekstra pakke),
`src/lib/ai/quota.ts`, `src/lib/supabase/admin.ts`, `src/app/(app)/pro/`,
`src/app/api/stripe/webhook/route.ts`, `supabase/migrations/20261125000008_pro_billing.sql`.

**Opsætning:**
1. Udfyld de nye variabler fra `.env.example` i Vercel (Production og Preview).
2. Stripe → Developers → Webhooks → endpoint `https://lwn.dk/api/stripe/webhook` med hændelserne
   `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`.
3. Stripe → Billing → Revenue recovery: slå Smart Retries og mails ved fejlet betaling til.
4. Test med kort `4242 4242 4242 4242` i sandbox.
