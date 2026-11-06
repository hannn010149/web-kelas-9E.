-- Keeps the existing JSON document structure in site_data.content.
-- No content is inserted or replaced by this script.
create table if not exists public.site_data (
  id bigint primary key,
  content jsonb not null
);

alter table public.site_data enable row level security;
revoke insert, update, delete on public.site_data from anon, authenticated;
grant select on public.site_data to anon, authenticated;

drop policy if exists "Public can read site data" on public.site_data;
create policy "Public can read site data"
  on public.site_data
  for select
  to anon, authenticated
  using (true);

create table if not exists public.admin_sessions (
  token_hash text primary key,
  expires_at timestamptz not null
);

alter table public.admin_sessions enable row level security;
revoke all on public.admin_sessions from anon, authenticated;

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read uploaded photos" on storage.objects;
create policy "Public can read uploaded photos"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'uploads');
