-- Ab-roller (mavehjul). Kropsvægt, standardudstyr. EKSEMPELDATA (is_sample = true) som resten af kataloget.

insert into public.machine_types
  (slug, name, category, is_multipurpose, primary_muscles, secondary_muscles, instructions, is_sample)
values
('ab_roller', 'Ab-roller (mavehjul)', 'accessory', true,
  '{abs}', '{obliques,lats}',
  '{"adjustment":["Brug en måtte eller en knæpude under knæene."],
    "safety":["Rul kun så langt ud, som du kan holde lænden stabil.","Stop ved smerte i lænden."],
    "beginner_setting":"Start fra knæene med en kort udrulning, evt. mod en væg, så hjulet ikke kan rulle for langt."}'::jsonb,
  true)
on conflict (slug) do nothing;

insert into public.exercises
  (slug, machine_type_id, name, movement_pattern, primary_muscles, secondary_muscles,
   is_free_weight, default_rep_min, default_rep_max, default_sets, instructions, is_sample)
select e.slug, mt.id, e.name, e.movement_pattern, e.primary_muscles::text[], e.secondary_muscles::text[],
       false, e.rep_min, e.rep_max, e.sets, e.instructions::jsonb, true
from (values
  ('ab_roller_rollout', 'Udrulning med ab-roller fra knæ', 'core_anti_extension', '{abs}', '{obliques,lats}', 6, 12, 2,
    '{"start_position":"På knæene på en måtte med hjulet under skuldrene og strakte arme.",
      "steps":["Spænd maven og rul hjulet langsomt frem, mens hoften følger med.","Stop, før lænden begynder at svaje.","Træk hjulet tilbage med maven, til du er i startpositionen."],
      "breathing":"Træk vejret ind på vej ud, pust ud på vej tilbage.",
      "common_mistakes":["Lænden svajer i yderstillingen.","Hoften bliver hængende bagud, så kun armene bevæger sig."],
      "safety":["Rul kun så langt ud, som du kan holde lænden stabil."],
      "beginner_setting":"Korte udrulninger, evt. mod en væg. Øg længden gradvist."}')
) as e(slug, name, movement_pattern, primary_muscles, secondary_muscles, rep_min, rep_max, sets, instructions)
join public.machine_types mt on mt.slug = 'ab_roller'
on conflict (slug) do nothing;
