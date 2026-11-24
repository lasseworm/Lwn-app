-- LWN – rettigheder for Data API (PostgREST)
--
-- Nyere Supabase-projekter giver ikke automatisk rollerne anon/authenticated adgang til
-- nye tabeller i public. Uden disse GRANTs afvises alle kald fra appen med 403, selvom
-- RLS-politikkerne er på plads. RLS afgør stadig HVILKE rækker man må se/ændre;
-- GRANTs afgør, hvilke handlinger der overhovedet er mulige på tabellen.
--
-- Princip: mindst mulig adgang
--   anon          -> intet (ikke-indloggede kan ikke læse eller skrive noget)
--   authenticated -> kun de handlinger, RLS-politikkerne er skrevet til
--   service_role  -> alt (bruges kun på serveren til administration)
--
-- HUSK: nye tabeller i senere migrationer skal have deres egne GRANTs.

revoke all on all tables in schema public from anon;

-- Personlige data (RLS: kun egne rækker)
grant select, insert, update, delete on
  public.user_gyms,
  public.programs,
  public.program_days,
  public.program_exercises,
  public.exercise_preferences,
  public.exercise_progress,
  public.workouts,
  public.workout_sets,
  public.feedback
to authenticated;

-- Profil: læs/opret/opdatér egen. Sletning sker via konto-sletning (cascade fra auth.users).
grant select, insert, update on public.profiles to authenticated;

-- Fælles data: læs, opret og opdatér. Ingen sletning – "fjern" sker via status = 'removed'.
grant select, insert, update on
  public.gyms,
  public.gym_equipment,
  public.machine_types,
  public.exercises
to authenticated;

-- Fællesskabsbekræftelser: man styrer sin egen stemme (RLS)
grant select, insert, update, delete on public.equipment_confirmations to authenticated;

-- Serverrolle til administration
grant all on all tables in schema public to service_role;
