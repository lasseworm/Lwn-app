-- LWN – Trin 3: program og træning
-- Additivt: ingen eksisterende data ændres eller slettes.

-- Opvarmningssæt kan slås til pr. bruger
alter table public.profiles add column if not exists warmup_enabled boolean not null default false;

-- Startvægt (baseline) første gang en øvelse udføres
alter table public.exercise_progress add column if not exists baseline_weight_kg numeric;

-- ---------------------------------------------------------------------------
-- create_program: opretter et nyt program atomisk og deaktiverer det gamle.
-- SECURITY INVOKER: kører som brugeren, så RLS gælder for alle inserts.
-- p_days: [{ "name": "...", "exercises": [{ "exercise_id", "equipment_id", "sets", "rep_min", "rep_max" }] }]
-- ---------------------------------------------------------------------------
create or replace function public.create_program(p_gym_id uuid, p_sessions_per_week int, p_days jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_program uuid;
  v_version int;
  v_day jsonb;
  v_day_id uuid;
  v_ex jsonb;
  v_day_index int := 0;
  v_pos int;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;
  if p_sessions_per_week not between 2 and 4 then
    raise exception 'sessions_per_week must be 2-4';
  end if;
  if jsonb_typeof(p_days) <> 'array' or jsonb_array_length(p_days) = 0 then
    raise exception 'p_days must be a non-empty array';
  end if;

  select coalesce(max(version), 0) + 1 into v_version from public.programs where user_id = v_user;

  -- Gamle programmer bevares (historik), men deaktiveres
  update public.programs set active = false where user_id = v_user and active;

  insert into public.programs (user_id, gym_id, sessions_per_week, version, active)
  values (v_user, p_gym_id, p_sessions_per_week, v_version, true)
  returning id into v_program;

  for v_day in select * from jsonb_array_elements(p_days) loop
    v_day_index := v_day_index + 1;
    insert into public.program_days (program_id, day_index, name)
    values (v_program, v_day_index, left(v_day ->> 'name', 60))
    returning id into v_day_id;

    v_pos := 0;
    for v_ex in select * from jsonb_array_elements(v_day -> 'exercises') loop
      v_pos := v_pos + 1;
      insert into public.program_exercises (program_day_id, position, exercise_id, equipment_id, sets, rep_min, rep_max)
      values (
        v_day_id, v_pos,
        (v_ex ->> 'exercise_id')::uuid,
        nullif(v_ex ->> 'equipment_id', '')::uuid,
        (v_ex ->> 'sets')::int,
        (v_ex ->> 'rep_min')::int,
        (v_ex ->> 'rep_max')::int
      );
    end loop;
  end loop;

  update public.profiles set sessions_per_week = p_sessions_per_week where id = v_user;
  return v_program;
end;
$$;

-- ---------------------------------------------------------------------------
-- finish_workout: afslutter et pas og gemmer ny progression atomisk.
-- p_progress: [{ exercise_id, equipment_id, current_weight_kg, current_reps, current_sets,
--               last_successful_weight_kg, last_successful_reps, last_successful_sets,
--               hold_level, baseline_weight_kg }]
-- ---------------------------------------------------------------------------
create or replace function public.finish_workout(p_workout_id uuid, p_progress jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_p jsonb;
  v_finished timestamptz;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select finished_at into v_finished from public.workouts where id = p_workout_id and user_id = v_user;
  if not found then
    raise exception 'workout not found';
  end if;
  if v_finished is not null then
    return; -- allerede afsluttet: progression må kun ske én gang pr. pas
  end if;

  for v_p in select * from jsonb_array_elements(coalesce(p_progress, '[]'::jsonb)) loop
    insert into public.exercise_progress as ep (
      user_id, exercise_id, equipment_id,
      current_weight_kg, current_reps, current_sets,
      last_successful_weight_kg, last_successful_reps, last_successful_sets,
      hold_level, baseline_weight_kg, last_performed_at
    ) values (
      v_user,
      (v_p ->> 'exercise_id')::uuid,
      (v_p ->> 'equipment_id')::uuid,
      (v_p ->> 'current_weight_kg')::numeric,
      (v_p ->> 'current_reps')::int,
      (v_p ->> 'current_sets')::int,
      (v_p ->> 'last_successful_weight_kg')::numeric,
      (v_p ->> 'last_successful_reps')::int,
      (v_p ->> 'last_successful_sets')::int,
      coalesce((v_p ->> 'hold_level')::boolean, false),
      (v_p ->> 'baseline_weight_kg')::numeric,
      now()
    )
    on conflict (user_id, exercise_id, equipment_id) do update set
      current_weight_kg = excluded.current_weight_kg,
      current_reps = excluded.current_reps,
      current_sets = excluded.current_sets,
      last_successful_weight_kg = excluded.last_successful_weight_kg,
      last_successful_reps = excluded.last_successful_reps,
      last_successful_sets = excluded.last_successful_sets,
      hold_level = excluded.hold_level,
      baseline_weight_kg = coalesce(ep.baseline_weight_kg, excluded.baseline_weight_kg),
      last_performed_at = now();
  end loop;

  update public.workouts set finished_at = now() where id = p_workout_id and user_id = v_user;
end;
$$;

revoke all on function public.create_program(uuid, int, jsonb) from public, anon;
revoke all on function public.finish_workout(uuid, jsonb) from public, anon;
grant execute on function public.create_program(uuid, int, jsonb) to authenticated;
grant execute on function public.finish_workout(uuid, jsonb) to authenticated;
