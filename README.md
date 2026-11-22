# LWN – Learn. Workout. Never Quit.

*Your Gym. Your Equipment. Your Progress.*

PWA bygget med Next.js 16 (App Router, TypeScript, Tailwind 4), Supabase (Postgres, Auth, Storage, RLS) og Serwist (service worker). Produktbeskrivelse og byggeplan: [`docs/LWN-samlet-prompt.md`](docs/LWN-samlet-prompt.md) og [`docs/LWN-byggeplan.md`](docs/LWN-byggeplan.md).

**Status:** Trin 0 + Trin 1 er færdige (fundament, login, database med RLS, startkatalog).

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
    privatliv/               Privatlivspolitik (udkast)
    manifest.ts              PWA-manifest
    sw.ts                    Service worker (cacher kun statiske filer)
    serwist/[path]/route.ts  Serverer service workeren på /serwist/sw.js
  proxy.ts                   Fornyer session + beskytter sider bag login
  lib/supabase/              Supabase-klienter (browser, server, proxy)
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

Øvrige kommandoer: `npm run lint`, `npm run typecheck`, `npm run build`.

> Service workeren er slået fra i `npm run dev`. Test PWA/installation med `npm run build && npm start`.

---

## Opsætning i skyen (Trin 0 – gøres én gang)

### 1. Supabase (EU)
1. Opret projekt på supabase.com → **Region: Central EU (Frankfurt)**.
2. Kør migrationerne mod projektet:
   ```bash
   npx supabase login
   npx supabase link --project-ref <projekt-ref>
   npx supabase db push          # kører supabase/migrations/* (seed.sql køres IKKE)
   ```
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
   - `ANTHROPIC_API_KEY` (først nødvendig i Trin 2)
4. Deploy. Hver push til GitHub deployer automatisk.

### 3. Domænet lwn.dk
Vercel → Settings → Domains → tilføj `lwn.dk` (og `www.lwn.dk`). Opret de DNS-poster, Vercel viser, hos din domæneudbyder. HTTPS kommer automatisk.

### 4. Test på telefonen
Åbn `https://lwn.dk` i Chrome på Android (eller Safari på iPhone) → log ind → menuen **Føj til startskærm / Installer app**.

---

## Sikkerhed og data

- **RLS er slået til på alle tabeller.** Personlige data (profil, programmer, træning, progression, præferencer, feedback) kan kun ses af ejeren. Centre, udstyr og katalog kan læses af alle indloggede. Ikke-indloggede kan intet læse.
- Fælles data har ingen slette-adgang – "sletning" sker via `status = 'removed'`.
- Sletning af en konto (`auth.users`) sletter alle personlige data via cascade; centre/udstyr brugeren har oprettet bevares (uden reference til brugeren).
- Storage-bucket `equipment-photos` er privat (kun signerede URL'er), kun JPEG/PNG/WebP, maks. 5 MB.
- Migrationer skal altid være additive – de må aldrig slette brugerdata.
- Nøgler ligger kun i `.env.local` / Vercel – aldrig i git. `ANTHROPIC_API_KEY` må aldrig have `NEXT_PUBLIC_`-præfiks.

## Eksempeldata

- Katalog (39 maskintyper, 49 øvelser) ligger i en migration og er markeret `is_sample = true`. Det vises med et **Eksempel**-mærke og skal kvalitetssikres.
- `supabase/seed.sql` opretter et demo-center (`is_sample = true`) – kun lokalt.
