-- Add additional profile fields
alter table public.profiles
add column if not exists avatar_url text,
add column if not exists phone text,
add column if not exists bio text,
add column if not exists email_notifications boolean default true;

-- Create avatars storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Drop existing policies if they exist
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;
drop policy if exists "Public can read avatars" on storage.objects;
drop policy if exists "Users can delete own avatar" on storage.objects;

-- Allow authenticated users to upload their own avatar
create policy "Users can upload own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatar
create policy "Users can update own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public access to read avatars
create policy "Public can read avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');

-- Allow users to delete their own avatar
create policy "Users can delete own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Comments for documentation
comment on column public.profiles.avatar_url is 'URL to user avatar image in storage';
comment on column public.profiles.phone is 'User phone number for notifications';
comment on column public.profiles.bio is 'User bio/description (max 500 chars)';
comment on column public.profiles.email_notifications is 'Whether user wants email notifications';
