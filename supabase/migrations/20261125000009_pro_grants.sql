-- LWN Pro – rettigheder for de nye tabeller fra 20261125000008_pro_billing.sql
-- (se 20261124000006_api_grants.sql: nye tabeller får ikke automatisk GRANTs)
--
--   anon          -> intet
--   authenticated -> kun læsning; RLS begrænser til egne rækker (plan_limits er fælles)
--   service_role  -> alt (Stripe-webhook, checkout og AI-kvoter på serveren)

revoke all on public.subscriptions, public.stripe_events, public.plan_limits, public.ai_usage from anon;

grant select on public.subscriptions, public.plan_limits, public.ai_usage to authenticated;

grant all on public.subscriptions, public.stripe_events, public.plan_limits, public.ai_usage to service_role;
