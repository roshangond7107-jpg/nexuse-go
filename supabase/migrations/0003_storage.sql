-- NEXUSE GO — storage bucket + policies for listing photos (Supabase Storage).
-- Path convention enforced here AND in public.listing_images_guard: <seller uuid>/<listing uuid>/<file>
-- NOTE: bucket is public-read so photo URLs work in the apps; anyone with a URL can fetch the file.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "listing images: owner upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text and public.can_participate(auth.uid()));
create policy "listing images: owner update" on storage.objects for update to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "listing images: owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "listing images: moderator delete" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-images' and public.is_moderator());
