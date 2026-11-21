-- Kun til LOKAL udvikling (køres af `supabase db reset`).
-- Et demo-center, tydeligt markeret som eksempel (is_sample = true).

insert into public.gyms (id, name, city, is_sample)
values ('00000000-0000-4000-8000-000000000001', 'LWN Demo-center', 'Eksempelby', true)
on conflict (id) do nothing;

insert into public.gym_equipment
  (gym_id, machine_type_id, weight_step_kg, extra_plate_kg, min_weight_kg, max_weight_kg, status)
select '00000000-0000-4000-8000-000000000001', mt.id, e.step, e.extra, e.min_w, e.max_w, 'verified'
from (values
  ('chest_press',      7::numeric,  3.5::numeric, 7::numeric, 105::numeric),
  ('shoulder_press',   5,    2.5,  5,   75),
  ('lat_pulldown',     7,    3.5,  7,  105),
  ('seated_row',       7,    3.5,  7,  105),
  ('leg_press',       10,   null, 20,  200),
  ('leg_extension',    5,    2.5,  5,   90),
  ('seated_leg_curl',  5,    2.5,  5,   90),
  ('pec_deck',         5,    2.5,  5,   75),
  ('ab_crunch_machine',5,   null,  5,   60),
  ('cable_station',    2.5, null, 2.5,  50),
  ('dumbbells',        2,   null,  2,   30),
  ('adjustable_bench', null, null, null, null),
  ('mat',              null, null, null, null)
) as e(slug, step, extra, min_w, max_w)
join public.machine_types mt on mt.slug = e.slug
where not exists (
  select 1 from public.gym_equipment ge
  where ge.gym_id = '00000000-0000-4000-8000-000000000001' and ge.machine_type_id = mt.id
);
