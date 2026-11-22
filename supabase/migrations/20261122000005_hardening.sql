-- LWN – opstramning efter Supabases sikkerheds- og performancetjek

-- handle_new_user() er kun en trigger-funktion og må ikke kunne kaldes via API'et (/rest/v1/rpc).
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Indekser på fremmednøgler (hurtigere opslag og hurtigere sletning af konto via cascade)
create index if not exists equipment_confirmations_user_id_idx on public.equipment_confirmations (user_id);
create index if not exists exercise_preferences_original_idx on public.exercise_preferences (original_exercise_id);
create index if not exists exercise_preferences_replacement_idx on public.exercise_preferences (replacement_exercise_id);
create index if not exists exercise_progress_exercise_id_idx on public.exercise_progress (exercise_id);
create index if not exists exercise_progress_equipment_id_idx on public.exercise_progress (equipment_id);
create index if not exists feedback_user_id_idx on public.feedback (user_id);
create index if not exists gym_equipment_added_by_idx on public.gym_equipment (added_by);
create index if not exists gyms_created_by_idx on public.gyms (created_by);
create index if not exists profiles_active_gym_id_idx on public.profiles (active_gym_id);
create index if not exists program_exercises_equipment_id_idx on public.program_exercises (equipment_id);
create index if not exists program_exercises_exercise_id_idx on public.program_exercises (exercise_id);
create index if not exists programs_gym_id_idx on public.programs (gym_id);
create index if not exists workout_sets_equipment_id_idx on public.workout_sets (equipment_id);
create index if not exists workout_sets_exercise_id_idx on public.workout_sets (exercise_id);
create index if not exists workouts_gym_id_idx on public.workouts (gym_id);
create index if not exists workouts_program_day_id_idx on public.workouts (program_day_id);
