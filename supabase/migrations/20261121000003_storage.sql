-- LWN – billedlager til udstyrsfotos (Trin 1)
-- Privat bucket: læsning kun via signerede URL'er. Kun billeder, maks. 5 MB.
-- Klienten skal komprimere og fjerne EXIF/GPS før upload (Trin 2).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('equipment-photos', 'equipment-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Upload: kun indloggede
create policy "equipment-photos: upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'equipment-photos');

-- Læs (kræves for at kunne lave signerede URL'er): kun indloggede
create policy "equipment-photos: læs" on storage.objects
  for select to authenticated
  using (bucket_id = 'equipment-photos');

-- Ændring/sletning: kun den, der har uploadet filen
create policy "equipment-photos: opdatér egen" on storage.objects
  for update to authenticated
  using (bucket_id = 'equipment-photos' and owner_id = (select auth.uid())::text);

create policy "equipment-photos: slet egen" on storage.objects
  for delete to authenticated
  using (bucket_id = 'equipment-photos' and owner_id = (select auth.uid())::text);
