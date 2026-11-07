-- LOCAL TEST SHIM ONLY. Emulates the pieces of Supabase that the migrations rely on
-- (roles, auth.users, auth.uid(), storage.buckets/objects). Never run this on a real Supabase project.
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create schema storage;
create table auth.users (id uuid primary key default gen_random_uuid(), phone text unique);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
grant usage on schema auth, storage to anon, authenticated;
grant execute on function auth.uid(), auth.role() to anon, authenticated;
grant select on auth.users to authenticated;  -- (real Supabase does not; harmless for tests)
create table storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid default auth.uid());
alter table storage.objects enable row level security;
grant select, insert, update, delete on storage.objects to authenticated;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
