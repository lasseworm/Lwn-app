-- LWN – kerneskema (Trin 1)
-- Følger datamodellen i LWN-byggeplan.md, afsnit 2.
-- Regel: migrationer må aldrig slette brugerdata. Ændringer laves additivt.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Hjælpefunktion: opdatér updated_at automatisk
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiler (1:1 med auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  experience_level text check (experience_level in ('beginner','returning','intermediate')),
  goal text,
  sessions_per_week int check (sessions_per_week between 2 and 4),
  active_gym_id uuid,
  training_type text default 'basic',        -- basic | bodybuilding | powerlifting (senere)
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Centre
-- ---------------------------------------------------------------------------
create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  created_by uuid references public.profiles(id) on delete set null,
  is_sample boolean default false,           -- demo-data adskilles fra verificeret
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index gyms_name_lower_idx on public.gyms (lower(name));
create index gyms_city_lower_idx on public.gyms (lower(city));

create trigger gyms_set_updated_at
  before update on public.gyms
  for each row execute function public.set_updated_at();

alter table public.profiles
  add constraint profiles_active_gym_id_fkey
  foreign key (active_gym_id) references public.gyms(id) on delete set null;

create table public.user_gyms (              -- brugerens gemte centre
  user_id uuid references public.profiles(id) on delete cascade,
  gym_id uuid references public.gyms(id) on delete cascade,
  label text,                                -- hjem / arbejde / ferie
  primary key (user_id, gym_id)
);

create index user_gyms_gym_id_idx on public.user_gyms (gym_id);

-- ---------------------------------------------------------------------------
-- Katalog over maskintyper (funktion, ikke mærke) og øvelser
-- ---------------------------------------------------------------------------
create table public.machine_types (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,                 -- fx 'chest_press'
  name text not null,
  category text not null check (category in ('machine','free_weight','multi','cardio','accessory')),
  is_multipurpose boolean default false,     -- rack, Smith, håndvægte: ingen fast muskelgruppe
  primary_muscles text[] default '{}',
  secondary_muscles text[] default '{}',
  instructions jsonb,                        -- justering, startposition, trin, vejrtrækning, fejl, sikkerhed, nybegynderindstilling
  media_url text,
  is_sample boolean default false            -- tilføjelse: markerer seed-/eksempelindhold
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text unique,                          -- tilføjelse: stabil nøgle til seed og kode
  machine_type_id uuid references public.machine_types(id),
  name text not null,
  movement_pattern text,                     -- push_horizontal, pull_vertical, squat, hinge ...
  primary_muscles text[],
  secondary_muscles text[],
  is_free_weight boolean default false,
  default_rep_min int default 8,
  default_rep_max int default 12,
  default_sets int default 3,
  instructions jsonb,
  is_sample boolean default false            -- tilføjelse: markerer seed-/eksempelindhold
);

create index exercises_machine_type_id_idx on public.exercises (machine_type_id);

-- ---------------------------------------------------------------------------
-- Udstyr i et center
-- ---------------------------------------------------------------------------
create table public.gym_equipment (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid references public.gyms(id) on delete cascade,
  machine_type_id uuid references public.machine_types(id),
  custom_name text,
  photo_path text,                           -- kun udstyrsbilleder
  weight_step_kg numeric,                    -- fx 7 eller 3.5
  extra_plate_kg numeric,                    -- valgfri mellemplade, fx 3.5
  min_weight_kg numeric,
  max_weight_kg numeric,
  status text default 'pending' check (status in ('pending','verified','disputed','removed')),
  ai_confidence numeric,
  confirmations int default 0,
  added_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz default now()
);

create index gym_equipment_gym_id_idx on public.gym_equipment (gym_id);
create index gym_equipment_machine_type_id_idx on public.gym_equipment (machine_type_id);

create trigger gym_equipment_set_updated_at
  before update on public.gym_equipment
  for each row execute function public.set_updated_at();

create table public.equipment_confirmations ( -- fællesskabsbekræftelse
  equipment_id uuid references public.gym_equipment(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  vote text check (vote in ('confirm','report')),
  note text,
  created_at timestamptz default now(),
  primary key (equipment_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Programmer
-- ---------------------------------------------------------------------------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  gym_id uuid references public.gyms(id),
  sessions_per_week int,
  version int default 1,
  generated_at timestamptz default now(),
  active boolean default true
);

create index programs_user_id_idx on public.programs (user_id);

create table public.program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete cascade,
  day_index int,                             -- 1..4
  name text
);

create index program_days_program_id_idx on public.program_days (program_id);

create table public.program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid references public.program_days(id) on delete cascade,
  position int,
  exercise_id uuid references public.exercises(id),
  equipment_id uuid references public.gym_equipment(id),
  sets int, rep_min int, rep_max int
);

create index program_exercises_program_day_id_idx on public.program_exercises (program_day_id);

create table public.exercise_preferences (   -- husk foretrukne alternativer og udeladelser
  user_id uuid references public.profiles(id) on delete cascade,
  original_exercise_id uuid references public.exercises(id),
  replacement_exercise_id uuid references public.exercises(id),
  excluded boolean default false,
  reason text check (reason in ('occupied','dislike','cannot','limitation')), -- smerte håndteres ikke her
  primary key (user_id, original_exercise_id)
);

-- Progressionstilstand pr. bruger pr. øvelse
create table public.exercise_progress (
  user_id uuid references public.profiles(id) on delete cascade,
  exercise_id uuid references public.exercises(id),
  equipment_id uuid references public.gym_equipment(id),
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

-- ---------------------------------------------------------------------------
-- Træningslog
-- ---------------------------------------------------------------------------
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  gym_id uuid references public.gyms(id),
  program_day_id uuid references public.program_days(id),
  started_at timestamptz default now(),
  finished_at timestamptz
);

create index workouts_user_id_idx on public.workouts (user_id, started_at desc);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references public.workouts(id) on delete cascade,
  exercise_id uuid references public.exercises(id),
  equipment_id uuid references public.gym_equipment(id),
  set_index int,
  weight_kg numeric,
  reps int,
  is_warmup boolean default false,
  completed boolean default true,
  pain_reported boolean default false,
  created_at timestamptz default now()
);

create index workout_sets_workout_id_idx on public.workout_sets (workout_id);

-- ---------------------------------------------------------------------------
-- Feedback fra testere
-- ---------------------------------------------------------------------------
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  screen text,
  message text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Opret profil automatisk, når en bruger oprettes i Supabase Auth
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
