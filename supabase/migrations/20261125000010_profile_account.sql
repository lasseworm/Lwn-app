-- LWN – Trin 4: profil, 12-ugers-opdatering og sletning af konto
-- Additivt: ingen eksisterende data ændres.

-- 12-ugers-spørgsmålet kan udsættes ("Ikke nu")
alter table public.profiles add column if not exists program_review_snoozed_until timestamptz;

-- ---------------------------------------------------------------------------
-- delete_my_account: brugeren sletter SIN EGEN konto (GDPR).
-- Sletning af auth.users kaskaderer til profil, programmer, træning, progression,
-- præferencer, feedback, abonnement og AI-forbrug. Fælles data (centre, udstyr,
-- udstyrsfotos) bevares uden reference til brugeren.
--
-- SECURITY DEFINER er nødvendigt, fordi brugeren ikke selv har adgang til auth.users.
-- Funktionen kan KUN slette den kaldende bruger (auth.uid()) og tager ingen parametre.
-- Et aktivt Pro-abonnement, der ikke er opsagt, blokerer sletningen, så ingen
-- bliver trukket penge for en slettet konto.
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  if exists (
    select 1 from public.subscriptions
    where user_id = v_user
      and status in ('trialing', 'active', 'past_due')
      and not cancel_at_period_end
  ) then
    raise exception 'active_subscription';
  end if;

  delete from auth.users where id = v_user;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
