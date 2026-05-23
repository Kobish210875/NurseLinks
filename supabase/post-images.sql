-- Post images: storage bucket + column (run after schema.sql and storage.sql)

alter table public.posts
  add column if not exists image_url text;

comment on column public.posts.image_url is
  'Public URL of compressed JPEG in post-images bucket (author_id/post_id.jpg).';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  1048576,
  array['image/jpeg']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 1048576,
  allowed_mime_types = array['image/jpeg'];

drop policy if exists "Post images are publicly readable" on storage.objects;
drop policy if exists "Users manage own post images" on storage.objects;

create policy "Post images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Users manage own post images"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
