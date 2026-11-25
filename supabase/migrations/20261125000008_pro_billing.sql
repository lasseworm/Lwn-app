-- =====================================================================
-- LWN – Pro-abonnement, AI-forbrug og grænser
-- Projekt: Fitness app development (mirzhkjkgjhesuguguxy)
--
-- Bygger oven på de eksisterende tabeller (profiles, gyms, machine_types,
-- gym_equipment, programs ...). Intet eksisterende bliver slettet.
--
-- Gratis:  centeropsætning m. billeder + maskingenkendelse, opstartsprogrammer,
--          logning af træning.
-- Pro:     nye AI-programmer efter opstart, AI-coach, analyse, auto-progression.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. ABONNEMENTER (Stripe)
--    Én række pr. bruger. Skrives KUN af Stripe-webhooken (service role).
-- ---------------------------------------------------------------------
create table if not exists public.subscriptions (
  user_id                uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  status                 text not null default 'inactive'
                         check (status in ('inactive','trialing','active','past_due','canceled','incomplete','unpaid')),
  price_id               text,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Brugeren må se sit eget abonnement (til at vise "Pro" i appen).
-- Ingen insert/update/delete-policies => kun service role kan skrive.
create policy "Se eget abonnement"
  on public.subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()));


-- ---------------------------------------------------------------------
-- 2. STRIPE-HÆNDELSER (så samme webhook ikke behandles to gange)
-- ---------------------------------------------------------------------
create table if not exists public.stripe_events (
  id          text primary key,          -- Stripe event id (evt_...)
  type        text not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- Ingen policies => kun service role.


-- ---------------------------------------------------------------------
-- 3. GRÆNSER PR. PLAN
--    Justér tallene her uden at ændre kode. NULL = ubegrænset.
-- ---------------------------------------------------------------------
create table if not exists public.plan_limits (
  plan    text not null check (plan in ('free','pro')),
  feature text not null check (feature in (
            'machine_recognition',  -- AI genkender maskine ud fra billede
            'starter_program',      -- opstartsprogram
            'program_generation',   -- nye AI-programmer efter opstart
            'coach_chat',           -- spørgsmål til AI-coach
            'analysis'              -- AI-analyse af fremgang
          )),
  period  text not null check (period in ('month','lifetime')),
  max_uses integer,                 -- NULL = ubegrænset
  primary key (plan, feature)
);

alter table public.plan_limits enable row level security;

create policy "Alle må læse grænser"
  on public.plan_limits for select
  to authenticated
  using (true);

insert into public.plan_limits (plan, feature, period, max_uses) values
  -- Gratis
  ('free', 'machine_recognition', 'month',    30),
  ('free', 'starter_program',     'month',     2),
  ('free', 'program_generation',  'month',     0),
  ('free', 'coach_chat',          'month',     5),
  ('free', 'analysis',            'month',     0),
  -- Pro (fair-use-loft, så ingen kan løbe regningen op)
  ('pro',  'machine_recognition', 'month',   200),
  ('pro',  'starter_program',     'month',     2),
  ('pro',  'program_generation',  'month',    10),
  ('pro',  'coach_chat',          'month',   300),
  ('pro',  'analysis',            'month',    30)
on conflict (plan, feature) do nothing;


-- ---------------------------------------------------------------------
-- 4. AI-FORBRUG
--    Én række pr. AI-kald. Bruges både til grænser og til at se,
--    hvad AI'en koster dig.
-- ---------------------------------------------------------------------
create table if not exists public.ai_usage (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  feature       text not null,
  model         text,
  input_tokens  integer default 0,
  output_tokens integer default 0,
  cost_usd      numeric(10,5),
  gym_id        uuid references public.gyms(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists ai_usage_user_feature_time_idx
  on public.ai_usage (user_id, feature, created_at desc);

alter table public.ai_usage enable row level security;

create policy "Se eget AI-forbrug"
  on public.ai_usage for select
  to authenticated
  using (user_id = (select auth.uid()));
-- Indsættes kun fra serveren (service role) efter et AI-kald.


-- ---------------------------------------------------------------------
-- 5. PROGRAMMER: marker opstartsprogrammer
-- ---------------------------------------------------------------------
alter table public.programs
  add column if not exists source text not null default 'starter'
    check (source in ('starter','ai_generated','manual'));


-- ---------------------------------------------------------------------
-- 6. FUNKTIONER
-- ---------------------------------------------------------------------

-- Er brugeren Pro lige nu?
create or replace function public.is_pro(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = p_user
      and s.status in ('active','trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

-- Hvor mange AI-kald har brugeren tilbage for en funktion?
-- Returnerer NULL hvis ubegrænset, ellers antal tilbage (min. 0).
create or replace function public.ai_remaining(p_user uuid, p_feature text)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_plan   text := case when public.is_pro(p_user) then 'pro' else 'free' end;
  v_limit  integer;
  v_period text;
  v_used   integer;
begin
  select max_uses, period into v_limit, v_period
  from public.plan_limits
  where plan = v_plan and feature = p_feature;

  if not found then
    return 0;                      -- ukendt funktion => ingen adgang
  end if;
  if v_limit is null then
    return null;                   -- ubegrænset
  end if;

  select count(*) into v_used
  from public.ai_usage u
  where u.user_id = p_user
    and u.feature = p_feature
    and (v_period = 'lifetime' or u.created_at >= date_trunc('month', now()));

  return greatest(v_limit - v_used, 0);
end;
$$;

-- Funktionerne kaldes kun fra serveren (API-routes med service role).
revoke execute on function public.is_pro(uuid)             from public, anon, authenticated;
revoke execute on function public.ai_remaining(uuid, text) from public, anon, authenticated;
grant  execute on function public.is_pro(uuid)             to service_role;
grant  execute on function public.ai_remaining(uuid, text) to service_role;


-- ---------------------------------------------------------------------
-- 7. LOFT OVER ANTAL MASKINER PR. CENTER (beskytter AI-budgettet)
-- ---------------------------------------------------------------------
create or replace function public.check_gym_equipment_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*)
      from public.gym_equipment
      where gym_id = new.gym_id
        and coalesce(status, 'pending') <> 'removed') >= 60 then
    raise exception 'Centeret har nået maks. 60 maskiner';
  end if;
  return new;
end;
$$;

drop trigger if exists gym_equipment_limit on public.gym_equipment;
create trigger gym_equipment_limit
  before insert on public.gym_equipment
  for each row execute function public.check_gym_equipment_limit();


-- ---------------------------------------------------------------------
-- 8. HOLD updated_at OPDATERET PÅ ABONNEMENTER
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists subscriptions_touch on public.subscriptions;
create trigger subscriptions_touch
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();
