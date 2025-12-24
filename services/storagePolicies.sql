-- Storage RLS Policies for avatars bucket
-- Run this in Supabase SQL Editor to fix image upload issue
-- Error: "new row violates row-level security policy"

-- Make sure the 'avatars' bucket exists and is public
-- You can create it via Supabase Dashboard > Storage > New Bucket
-- Name: avatars, Public: Yes

-- Drop existing policies if they exist
drop policy if exists "Public read avatars" on storage.objects;
drop policy if exists "Public upload avatars" on storage.objects;
drop policy if exists "Public update avatars" on storage.objects;
drop policy if exists "Public delete avatars" on storage.objects;

-- Allow anyone to read avatars
create policy "Public read avatars"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

-- Allow anyone to upload avatars (for demo purposes)
create policy "Public upload avatars"
on storage.objects
for insert
to public
with check (bucket_id = 'avatars');

-- Allow anyone to update avatars (for upsert)
create policy "Public update avatars"
on storage.objects
for update
to public
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');

-- Allow anyone to delete avatars
create policy "Public delete avatars"
on storage.objects
for delete
to public
using (bucket_id = 'avatars');

