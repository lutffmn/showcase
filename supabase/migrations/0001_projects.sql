-- Projects feature: table, RLS, and storage buckets.
-- Run in the Supabase SQL Editor (or `supabase db push`).

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  thumbnail_url text,
  project_type text not null check (project_type in ('scratch', 'construct3')),
  file_url text,
  link text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "Projects are viewable by everyone" on public.projects;
create policy "Projects are viewable by everyone"
  on public.projects for select using (true);

drop policy if exists "Authenticated users can create projects" on public.projects;
create policy "Authenticated users can create projects"
  on public.projects for insert to authenticated
  with check (auth.uid() = created_by);

-- Table-level privileges for the API roles. RLS controls *which rows* a role
-- can touch; GRANT controls whether it can touch the table at all.
grant usage on schema public to anon, authenticated;
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;

-- Public storage buckets for thumbnails and uploaded project files.
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true), ('project-files', 'project-files', true)
  on conflict (id) do nothing;

drop policy if exists "Public read for project assets" on storage.objects;
create policy "Public read for project assets"
  on storage.objects for select
  using (bucket_id in ('thumbnails', 'project-files'));

drop policy if exists "Authenticated users can upload project assets" on storage.objects;
create policy "Authenticated users can upload project assets"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('thumbnails', 'project-files'));

-- Make PostgREST pick up the new table immediately.
notify pgrst, 'reload schema';
