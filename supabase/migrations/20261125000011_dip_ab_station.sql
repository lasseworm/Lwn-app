-- Dips- og mavestation (knæløftstation / "captain's chair"; fritstående udgave kaldes ofte "power tower").
-- Findes vægmonteret og fritstående: ryglæn og to armlæn, hvor man hænger på underarmene.
-- Bruges til knæløft og dips. EKSEMPELDATA (is_sample = true) som resten af kataloget.

insert into public.machine_types
  (slug, name, category, is_multipurpose, primary_muscles, secondary_muscles, instructions, is_sample)
values
('dip_knee_raise_station', 'Dips- og mavestation (knæløft)', 'accessory', true,
  '{abs,triceps,chest}', '{obliques,front_delts}',
  '{"adjustment":["Findes både vægmonteret og fritstående. Tjek at stationen står eller sidder fast, før du bruger den."],
    "start_position":"Til knæløft: ryggen mod ryglænet, underarmene på armlænene og hænderne om håndtagene. Til dips: vend ansigtet væk fra ryglænet og støt på strakte arme.",
    "safety":["Gå op og ned ad trinnet i rolige bevægelser.","Stop ved smerte i skuldre eller lænd."],
    "beginner_setting":"Start med knæløft med bøjede ben. Dips kan være svære i starten – lav kun så mange, du kan med god teknik."}'::jsonb,
  true)
on conflict (slug) do nothing;

insert into public.exercises
  (slug, machine_type_id, name, movement_pattern, primary_muscles, secondary_muscles,
   is_free_weight, default_rep_min, default_rep_max, default_sets, instructions, is_sample)
select e.slug, mt.id, e.name, e.movement_pattern, e.primary_muscles::text[], e.secondary_muscles::text[],
       false, e.rep_min, e.rep_max, e.sets, e.instructions::jsonb, true
from (values
  ('station_knee_raise', 'Knæløft i mavestation', 'core_flexion', '{abs}', '{obliques}', 8, 12, 2,
    '{"start_position":"Ryggen mod ryglænet, underarmene på armlænene og benene hængende frit.",
      "steps":["Løft knæene op mod brystet, til lårene er mindst vandrette.","Sænk benene langsomt, uden at svinge."],
      "breathing":"Pust ud, når du løfter knæene.",
      "common_mistakes":["Svinger med benene for at få fart.","Ryggen slipper ryglænet."],
      "safety":["Hold ryggen mod ryglænet hele vejen."],
      "beginner_setting":"Bøjede knæ. Når det bliver let: løft med strakte ben."}'),
  ('station_dip', 'Dips i mavestation', 'dip', '{triceps,chest}', '{front_delts}', 5, 10, 3,
    '{"start_position":"Vend ansigtet væk fra ryglænet, grib håndtagene og støt på strakte arme.",
      "steps":["Bøj albuerne og sænk kroppen, til overarmene er omtrent vandrette.","Pres op, til armene er næsten strakte."],
      "breathing":"Ind på vej ned, ud på vej op.",
      "common_mistakes":["Går for dybt, så skuldrene presses frem.","Låser albuerne hårdt i toppen."],
      "safety":["Stop ved smerte i skulderen."],
      "beginner_setting":"Lav kun få gentagelser med god teknik. Gå ikke dybere, end det føles godt."}')
) as e(slug, name, movement_pattern, primary_muscles, secondary_muscles, rep_min, rep_max, sets, instructions)
join public.machine_types mt on mt.slug = 'dip_knee_raise_station'
on conflict (slug) do nothing;
