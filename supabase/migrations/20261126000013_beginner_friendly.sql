-- Øvelser, der er for avancerede til helt nye medlemmer (fra test).
-- Programgeneratoren vælger dem ikke til nybegyndere; de kan stadig vælges som alternativ.
alter table public.exercises
  add column if not exists beginner_friendly boolean not null default true;

update public.exercises set beginner_friendly = false
where slug in ('cable_biceps_curl', 'ab_roller_rollout');
