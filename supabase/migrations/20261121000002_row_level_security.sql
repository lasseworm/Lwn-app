-- LWN – Row Level Security (Trin 1)
-- Se LWN-byggeplan.md, afsnit 2.
-- Ingen politikker for rollen "anon": ikke-indloggede kan intet læse eller skrive.
-- Ingen DELETE-politikker på fælles data: "sletning" sker via status = 'removed'.

alter table public.profiles                enable row level security;
alter table public.gyms                    enable row level security;
alter table public.user_gyms               enable row level security;
alter table public.machine_types           enable row level security;
alter table public.exercises               enable row level security;
alter table public.gym_equipment           enable row level security;
alter table public.equipment_confirmations enable row level security;
alter table public.programs                enable row level security;
alter table public.program_days            enable row level security;
alter table public.program_exercises       enable row level security;
alter table public.exercise_preferences    enable row level security;
alter table public.exercise_progress       enable row level security;
alter table public.workouts                enable row level security;
alter table public.workout_sets            enable row level security;
alter table public.feedback                enable row level security;

-- ---------------------------------------------------------------------------
-- Personlige data: kun egne rækker
-- ---------------------------------------------------------------------------

-- profiles: rækken oprettes af triggeren handle_new_user; brugeren kan læse/opdatere sin egen.
create policy "profiles: læs egen" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: opret egen" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles: opdatér egen" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- Sletning af konto sker via auth.users (cascade), ikke direkte på profiles.

-- Tabeller med user_id: fuld adgang til egne rækker
do $$
declare
  t text;
begin
  foreach t in array array[
    'user_gyms', 'programs', 'workouts', 'exercise_progress', 'exercise_preferences', 'feedback'
  ]
  loop
    execute format(
      'create policy "%1$s: læs egne" on public.%1$I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "%1$s: opret egne" on public.%1$I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "%1$s: opdatér egne" on public.%1$I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "%1$s: slet egne" on public.%1$I for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end;
$$;

-- program_days: ejes via programs.user_id
create policy "program_days: egne" on public.program_days
  for all to authenticated
  using (exists (
    select 1 from public.programs p
    where p.id = program_days.program_id and p.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.programs p
    where p.id = program_days.program_id and p.user_id = (select auth.uid())
  ));

-- program_exercises: ejes via program_days -> programs
create policy "program_exercises: egne" on public.program_exercises
  for all to authenticated
  using (exists (
    select 1 from public.program_days d
    join public.programs p on p.id = d.program_id
    where d.id = program_exercises.program_day_id and p.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.program_days d
    join public.programs p on p.id = d.program_id
    where d.id = program_exercises.program_day_id and p.user_id = (select auth.uid())
  ));

-- workout_sets: ejes via workouts.user_id
create policy "workout_sets: egne" on public.workout_sets
  for all to authenticated
  using (exists (
    select 1 from public.workouts w
    where w.id = workout_sets.workout_id and w.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.workouts w
    where w.id = workout_sets.workout_id and w.user_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- Fælles data: læsbare for alle indloggede, oprettelse/opdatering for indloggede
-- ---------------------------------------------------------------------------

create policy "gyms: læs" on public.gyms
  for select to authenticated using (true);
create policy "gyms: opret" on public.gyms
  for insert to authenticated with check (created_by = (select auth.uid()) and is_sample = false);
create policy "gyms: opdatér" on public.gyms
  for update to authenticated using (true) with check (true);

create policy "gym_equipment: læs" on public.gym_equipment
  for select to authenticated using (true);
create policy "gym_equipment: opret" on public.gym_equipment
  for insert to authenticated with check (added_by = (select auth.uid()));
create policy "gym_equipment: opdatér" on public.gym_equipment
  for update to authenticated using (true) with check (true);

create policy "machine_types: læs" on public.machine_types
  for select to authenticated using (true);
create policy "machine_types: opret" on public.machine_types
  for insert to authenticated with check (true);
create policy "machine_types: opdatér" on public.machine_types
  for update to authenticated using (true) with check (true);

create policy "exercises: læs" on public.exercises
  for select to authenticated using (true);
create policy "exercises: opret" on public.exercises
  for insert to authenticated with check (true);
create policy "exercises: opdatér" on public.exercises
  for update to authenticated using (true) with check (true);

-- equipment_confirmations: alle indloggede kan se stemmer; man styrer kun sin egen stemme
create policy "equipment_confirmations: læs" on public.equipment_confirmations
  for select to authenticated using (true);
create policy "equipment_confirmations: opret egen" on public.equipment_confirmations
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "equipment_confirmations: opdatér egen" on public.equipment_confirmations
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "equipment_confirmations: slet egen" on public.equipment_confirmations
  for delete to authenticated using (user_id = (select auth.uid()));
