-- Construct 3 HTML exports: a bucket to host uploaded game files, plus a column
-- that links a project to its stored export.
-- Run in the Supabase SQL Editor (or `supabase db push`).

alter table public.projects
  add column if not exists game_path text;

-- Public bucket holding the files of Construct 4 "Web (HTML5)" exports.
insert into storage.buckets (id, name, public)
values ('game-exports', 'game-exports', true)
  on conflict (id) do nothing;

drop policy if exists "Public read for game exports" on storage.objects;
create policy "Public read for game exports"
  on storage.objects for select
  using (bucket_id = 'game-exports');

-- Objects are stored under "<user-id>/<game-id>/...", so the first folder ties
-- an upload to its owner.
drop policy if exists "Owners can upload game exports" on storage.objects;
create policy "Owners can upload game exports"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'game-exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owners can delete game exports" on storage.objects;
create policy "Owners can delete game exports"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'game-exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Let owners clean up their own thumbnails and project files too.
drop policy if exists "Owners can delete project assets" on storage.objects;
create policy "Owners can delete project assets"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('thumbnails', 'project-files')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner-only update/delete for projects. This is documented as migration
-- 0002, but that file is empty in this repo, so (re)create the policies here to
-- be safe — the edit/delete flows depend on them.
drop policy if exists "Owners can update their projects" on public.projects;
create policy "Owners can update their projects"
  on public.projects for update to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

drop policy if exists "Owners can delete their projects" on public.projects;
create policy "Owners can delete their projects"
  on public.projects for delete to authenticated
  using (auth.uid() = created_by);

-- Make PostgREST pick up the new column immediately.
notify pgrst, 'reload schema';
