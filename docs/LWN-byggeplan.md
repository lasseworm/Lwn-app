# LWN – Byggeplan til Claude Code

Brug sammen med filen **LWN-samlet-prompt.md** (produktbeskrivelsen). Denne fil beskriver *hvordan* det bygges: teknik, datamodel, skærmflow og trin.

**Mål:** En PWA på lwn.dk, som ejeren kan teste i sit eget center, og som andre kan teste i andre centre via et link. Fælles centerdatabase, login, og data må ikke gå tabt.

---

## 1. Teknisk stack

| Lag | Valg | Begrundelse |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind | Én kodebase til web/PWA, nem at hoste |
| PWA | Manifest + service worker (next-pwa eller Serwist) | Kan lægges på hjemmeskærm, kamera via browser |
| Backend/DB | Supabase (Postgres, Auth, Storage, Row Level Security) | Login, database, billedlager og sikkerhed i ét |
| AI-genkendelse | Server-funktion (Next.js route) der kalder Claude API med billedet | API-nøglen må aldrig ligge i frontend |
| Hosting | Vercel, domæne lwn.dk | Gratis start, automatisk deploy fra GitHub |
| Analytics | Plausible eller PostHog (EU) | GDPR-venlig |
| Fejl/feedback | Sentry + "Giv feedback"-knap der gemmer i tabel | Testere skal kunne rapportere nemt |

Region: vælg EU (Frankfurt) til Supabase og Vercel pga. GDPR.

---

## 2. Datamodel (Postgres)

```sql
-- Brugere styres af Supabase Auth (auth.users). Profil herunder.
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  experience_level text check (experience_level in ('beginner','returning','intermediate')),
  goal text,
  sessions_per_week int check (sessions_per_week between 2 and 4),
  active_gym_id uuid,
  training_type text default 'basic',        -- basic | bodybuilding | powerlifting (senere)
  created_at timestamptz default now()
);

create table gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  created_by uuid references profiles(id),
  is_sample boolean default false,           -- demo-data adskilles fra verificeret
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table user_gyms (                     -- brugerens gemte centre
  user_id uuid references profiles(id) on delete cascade,
  gym_id uuid references gyms(id) on delete cascade,
  label text,                                -- hjem / arbejde / ferie
  primary key (user_id, gym_id)
);

-- Katalog over maskintyper (funktion, ikke mærke)
create table machine_types (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,                 -- fx 'chest_press'
  name text not null,
  category text not null,                    -- machine | free_weight | multi | cardio | accessory
  is_multipurpose boolean default false,     -- rack, Smith, håndvægte: ingen fast muskelgruppe
  primary_muscles text[] default '{}',
  secondary_muscles text[] default '{}',
  instructions jsonb,                        -- justering, startposition, trin, vejrtrækning, fejl, sikkerhed, nybegynderindstilling
  media_url text
);

create table exercises (
  id uuid primary key default gen_random_uuid(),
  machine_type_id uuid references machine_types(id),
  name text not null,
  movement_pattern text,                     -- push_horizontal, pull_vertical, squat, hinge ...
  primary_muscles text[],
  secondary_muscles text[],
  is_free_weight boolean default false,
  default_rep_min int default 8,
  default_rep_max int default 12,
  default_sets int default 3,
  instructions jsonb
);

create table gym_equipment (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid references gyms(id) on delete cascade,
  machine_type_id uuid references machine_types(id),
  custom_name text,
  photo_path text,                           -- kun udstyrsbilleder
  weight_step_kg numeric,                    -- fx 7 eller 3.5
  extra_plate_kg numeric,                    -- valgfri mellemplade, fx 3.5
  min_weight_kg numeric,
  max_weight_kg numeric,
  status text default 'pending' check (status in ('pending','verified','disputed','removed')),
  ai_confidence numeric,
  confirmations int default 0,
  added_by uuid references profiles(id),
  updated_at timestamptz default now()
);

create table equipment_confirmations (       -- fællesskabsbekræftelse
  equipment_id uuid references gym_equipment(id) on delete cascade,
  user_id uuid references profiles(id),
  vote text check (vote in ('confirm','report')),
  note text,
  created_at timestamptz default now(),
  primary key (equipment_id, user_id)
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  gym_id uuid references gyms(id),
  sessions_per_week int,
  version int default 1,
  generated_at timestamptz default now(),
  active boolean default true
);

create table program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade,
  day_index int,                             -- 1..4
  name text
);

create table program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid references program_days(id) on delete cascade,
  position int,
  exercise_id uuid references exercises(id),
  equipment_id uuid references gym_equipment(id),
  sets int, rep_min int, rep_max int
);

create table exercise_preferences (          -- husk foretrukne alternativer og udeladelser
  user_id uuid references profiles(id) on delete cascade,
  original_exercise_id uuid references exercises(id),
  replacement_exercise_id uuid references exercises(id),
  excluded boolean default false,
  reason text,                               -- occupied | dislike | cannot | limitation   (smerte håndteres ikke her)
  primary key (user_id, original_exercise_id)
);

-- Progressionstilstand pr. bruger pr. øvelse
create table exercise_progress (
  user_id uuid references profiles(id) on delete cascade,
  exercise_id uuid references exercises(id),
  equipment_id uuid references gym_equipment(id),
  current_weight_kg numeric,
  current_reps int,
  current_sets int,
  last_successful_weight_kg numeric,
  last_successful_reps int,
  last_successful_sets int,
  hold_level boolean default false,          -- "Progression virkede ikke"
  last_performed_at timestamptz,
  primary key (user_id, exercise_id, equipment_id)
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  gym_id uuid references gyms(id),
  program_day_id uuid references program_days(id),
  started_at timestamptz default now(),
  finished_at timestamptz
);

create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workouts(id) on delete cascade,
  exercise_id uuid references exercises(id),
  equipment_id uuid references gym_equipment(id),
  set_index int,
  weight_kg numeric,
  reps int,
  is_warmup boolean default false,
  completed boolean default true,
  pain_reported boolean default false,
  created_at timestamptz default now()
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  screen text,
  message text,
  created_at timestamptz default now()
);
```

**Row Level Security (skal være slået til på alle tabeller):**
- `profiles`, `programs`, `workouts`, `workout_sets`, `exercise_progress`, `exercise_preferences`, `user_gyms`, `feedback`: kun egen række (`user_id = auth.uid()`).
- `gyms`, `gym_equipment`, `machine_types`, `exercises`: læsbare for alle indloggede; oprettelse/opdatering for indloggede; sletning kun via status `removed`.
- Storage-bucket `equipment-photos`: upload kun af indloggede, kun billeder, maks. størrelse, læsning kun via signerede URL'er.

---

## 3. Nøglelogik

### 3.1 Programgenerering
Input: erfaring, mål, pas/uge (2/3/4), valgt center, udstyr i centret, begrænsninger, præferencer.

1. Hent centrets udstyr (`gym_equipment` hvor status ≠ removed) og mappede øvelser.
2. Dæk muskelgrupper: bryst, ryg, skuldre, ben (quad/hamstring/baller), arme, mave/core.
3. Balancér push/pull og over-/underkrop.
4. Fordel over ugen: 2 pas = fuld krop ×2, 3 pas = fuld krop ×3 (varieret), 4 pas = over/under ×2.
5. Nybegyndervolumen: ca. 8-10 øvelser pr. pas, 2-3 sæt, 8-12 reps (justér efter evidens, gem referencer).
6. Maskiner først. Frie vægte kun hvis en muskelgruppe ellers ikke kan dækkes.
7. Spring øvelser over, hvis udstyret ikke findes. Tving intet.
8. Multifunktionsudstyr (rack, Smith, håndvægte, kabel) bidrager med øvelser via øvelseskataloget, ikke via en fast muskelgruppe.

### 3.2 Progression (dobbelt progression, pr. øvelse)
Efter hvert gennemført pas for en øvelse:
- Alle sæt nået med rep_max og god teknik → øg vægt med ét vægttrin, sæt reps til rep_min.
- Ellers, hvis alle sæt nået rep_min og målet er nået → +1 rep næste gang.
- Knappen **"Progression virkede ikke"** sætter `hold_level = true`: næste gang bruges `last_successful_*` uændret. Når niveauet er gennemført, nulstilles `hold_level`. Ingen automatisk nedsættelse eller nulstilling.
- Vægte vælges kun blandt gyldige trin: `min + n × weight_step_kg` (+ `extra_plate_kg` som mellemtrin).
- Progression sker kun ved gennemførte pas, aldrig pga. kalenderuge.
- Pause: under ca. 14 dage fortsæt fra sidste niveau. Over det foreslås lavere mål eller ny startvægt (tærsklerne gøres konfigurerbare).
- Pasnummer 1 af en ny øvelse: brugeren vælger startvægt, som gemmes som baseline.
- Smerte (`pain_reported`): stop øvelsen, ingen automatisk "sikker" erstatning, ingen diagnose, vis anbefaling om professionel vurdering.

### 3.3 Foto-genkendelse af udstyr
1. Klienten komprimerer billedet og uploader til Storage.
2. Server-funktionen sender billedet til Claude API med instruktion om at returnere JSON: `machine_type_slug`, `confidence`, `primary_muscles`, `secondary_muscles`, `suggested_exercises`, `reasoning_short`.
3. Lav konfidens → vis brugeren en liste over maskintyper til manuelt valg.
4. Duplikatcheck: samme `machine_type_id` + lignende billede/navn i samme center → spørg "Er det samme maskine?"
5. Gem som `pending` til den er bekræftet af en anden bruger (eller af centrets opretter i testfasen).
6. Billeder, der ikke ligner udstyr, afvises og gemmes ikke offentligt.

### 3.4 Vægtstak-foto
Separat flow: bruger fotograferer vægtstakken, AI estimerer antal plader, trin og min/max. Brugeren bekræfter eller retter værdierne. Gem i `gym_equipment`.

### 3.5 Hver 12. uge
Efter 12 uger med mindst fx 60 % af planlagte pas: spørg om opdateret program, og om flere øvelser skal være frie vægte.

---

## 4. Skærme og flow

1. **Velkomst** → log ind/opret konto (e-mail + magic link eller Google).
2. **Onboarding:** erfaring → mål → 2/3/4 pas → find/opret center → scan/bekræft udstyr → generér program → start første pas.
3. **Hjem:** næste pas, valgt center, ugefremdrift, "Start nu".
4. **Mit program:** uge-oversigt, øvelsesliste, skift pas/frekvens.
5. **Træningsskærm:** øvelse for øvelse, mål (vægt × reps × sæt), +/- knapper, opvarmningssæt, "Find alternativ", "Smerte", "Progression virkede ikke", "Maskinen er optaget".
6. **Maskinside:** foto, muskler, justering, trin, vejrtrækning, fejl, sikkerhed.
7. **Mit center:** centerliste, udstyrsliste (status: ventende/verificeret), tilføj maskine, scan vægtstak, ekstra standardudstyr.
8. **Fremgang:** uge/måned/6/12 mdr. med sammenligning med forrige periode, rekorder, regelmæssighed, grafer pr. øvelse.
9. **Tips & tricks:** overskrift + kort tekst.
10. **Profil:** oplysninger, mål, præferencer, gemte alternativer, centre, eksportér mine data, slet min konto, feedback.

---

## 5. Trin-for-trin plan

**Trin 0 – Forberedelse (dag 1)**
- Opret GitHub-repo, Supabase-projekt (EU), Vercel-projekt, peg lwn.dk på Vercel.
- Opret `.env.local` med Supabase-nøgler og Claude API-nøgle (aldrig i git).

**Trin 1 – Fundament (uge 1)**
- Next.js + Tailwind + PWA-manifest. Login. Databasemigrationer + RLS. Seed af `machine_types` og `exercises` (kun markeret som seed/eksempel).

**Trin 2 – Centre og udstyr (uge 2)**
- Søg/opret center. Tilføj maskine manuelt (inkl. multifunktionsudstyr uden muskelvalg og vægttrin). Fotoupload. AI-genkendelse med manuel rettelse. Vægtstak-flow.

**Trin 3 – Program og træning (uge 3)**
- Programgenerator. Træningsskærm. Progression inkl. "Progression virkede ikke" og pauseregler. Alternativer og husk af valg. Smerteflow.

**Trin 4 – Fremgang og polish (uge 4)**
- Perioderoversigter med sammenligning. Rekorder. Tips & tricks. Eksport og sletning af data. Feedback-knap. Fejl-overvågning.

**Trin 5 – Egen test (uge 5-8)**
- Brug appen i dit eget center. Notér fejl. Ret løbende. Tag backup af databasen ugentligt.

**Trin 6 – Ekstern test (derefter)**
- Inviter 5-10 testere i 2-3 andre centre. Giv dem link og en kort vejledning. Mål: oprettede centre, tilføjede maskiner, gennemførte pas, fejl.

**Trin 7 – Fællesskab**
- Verificeringsflow, dublet-tjek, rapportering, tidsstempler. Først når testdata viser behovet.

---

## 6. Krav til kvalitet og sikkerhed

- **Datasikkerhed:** daglig automatisk backup (Supabase), eksport af egne data, migrationer der aldrig sletter brugerdata.
- **GDPR:** privatlivspolitik, samtykke, slet konto, dataminimering, EU-region.
- **Billeder:** komprimér, strip EXIF/GPS, kun udstyr må deles.
- **Sundhed:** generel træningsvejledning, ingen diagnoser, tydelig tekst ved smerte.
- **Eksempeldata:** markeres `is_sample = true` og vises tydeligt som eksempel.
- **Tests:** enhedstests af progressionslogikken (alle grænsetilfælde: succes, hold-level, pause, vægttrin) og af programgeneratoren (forskellige udstyrslister).
- **Tilgængelighed:** store knapper, høj kontrast, brugbar med én hånd i centret.

---

## 7. Første instruktion til Claude Code

> Læs LWN-samlet-prompt.md og LWN-byggeplan.md. Gennemfør Trin 0 og Trin 1: opret Next.js-projekt med TypeScript, Tailwind og PWA-opsætning, forbind til Supabase, lav databasemigrationerne fra byggeplanen med RLS, seed maskintyper og øvelser som eksempeldata, og lav login. Stop derefter og vis, hvordan jeg tester det lokalt og på Vercel. Spørg mig, før du træffer valg, der afviger fra planen.
