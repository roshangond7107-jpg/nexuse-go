-- NEXUSE GO — core schema (Batch 3). Requires Supabase (auth.users, auth.uid()).
-- Multi-community marketplace: one set of tables, community_id scopes products and categories.

create type public.listing_status    as enum ('draft','pending_review','active','reserved','sold','rejected','archived');
create type public.listing_condition as enum ('new','like_new','good','acceptable');
create type public.fulfilment_method as enum ('local_pickup','seller_arranged_delivery');
create type public.staff_role        as enum ('moderator','admin');

-- ---------- communities & categories ----------
create table public.communities (
  id          text primary key check (id ~ '^[a-z][a-z_]{2,39}$'),
  name        text not null check (char_length(name) between 2 and 60),
  tagline     text,
  status      text not null default 'inactive' check (status in ('active','coming_soon','inactive')),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  community_id text not null references public.communities(id) on delete restrict,
  parent_id    uuid references public.categories(id) on delete restrict,
  slug         text not null check (slug ~ '^[a-z0-9][a-z0-9-]{1,59}$'),
  name         text not null,
  blurb        text,
  emoji        text,
  sort_order   int  not null default 0,
  is_active    boolean not null default true,
  unique (community_id, slug)
);
create index categories_community_idx on public.categories (community_id, sort_order);

-- ---------- staff roles (never writable by clients) ----------
create table public.user_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       public.staff_role not null,
  granted_at timestamptz not null default now()
);

-- ---------- profiles ----------
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  display_name      text not null check (char_length(display_name) between 2 and 60),
  date_of_birth     date not null check (date_of_birth >= date '1940-01-01' and date_of_birth <= current_date),
  is_minor          boolean not null default false,          -- derived by trigger
  guardian_verified boolean not null default false,          -- set only by service/admin flow, never by the user
  city              text not null check (char_length(city) between 2 and 60),
  state             text not null check (char_length(state) between 2 and 60),
  institution       text check (char_length(institution) <= 120),  -- self-declared; NOT verified student status
  accepted_terms_at timestamptz not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create function public.profiles_before_insert() returns trigger language plpgsql as $$
begin
  new.is_minor := date_part('year', age(current_date, new.date_of_birth)) < 18;
  new.guardian_verified := false;
  return new;
end $$;
create trigger profiles_bi before insert on public.profiles for each row execute function public.profiles_before_insert();

-- Public, non-sensitive seller card (no date of birth, no minor flag). Runs with owner rights by design.
create view public.public_profiles as
  select id, display_name, city, state, created_at from public.profiles;

-- ---------- listings ----------
create table public.listings (
  id               uuid primary key default gen_random_uuid(),
  seller_id        uuid not null references public.profiles(id) on delete cascade,
  community_id     text not null references public.communities(id),
  category_id      uuid not null references public.categories(id),
  title            text not null check (char_length(title) between 5 and 120),
  description      text not null check (char_length(description) between 20 and 4000),
  price_inr        integer not null check (price_inr between 0 and 10000000),
  original_price_inr integer check (original_price_inr between 0 and 10000000),
  condition        public.listing_condition not null,
  city             text not null check (char_length(city) between 2 and 60),
  state            text not null check (char_length(state) between 2 and 60),
  pin_code         text check (pin_code ~ '^[1-9][0-9]{5}$'),
  quantity         integer not null default 1 check (quantity between 1 and 999),
  fulfilment       public.fulfilment_method not null default 'local_pickup',
  status           public.listing_status not null default 'draft',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  search_tsv       tsvector generated always as (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,''))) stored,
  check (original_price_inr is null or original_price_inr >= price_inr)
);
create index listings_feed_idx   on public.listings (community_id, status, created_at desc);
create index listings_cat_idx    on public.listings (category_id);
create index listings_seller_idx on public.listings (seller_id);
create index listings_search_idx on public.listings using gin (search_tsv);

create table public.listing_images (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,            -- '<seller uuid>/<listing uuid>/<file>' in bucket listing-images
  position     smallint not null default 0,
  created_at   timestamptz not null default now(),
  unique (listing_id, storage_path)
);

-- ---------- wishlist ----------
create table public.wishlists (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- ---------- blocking, messaging ----------
create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id   uuid not null references public.profiles(id) on delete cascade,
  seller_id  uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at      timestamptz not null default now()
);
create index messages_conv_idx on public.messages (conversation_id, created_at);

-- ---------- reports & audit ----------
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('listing','user','conversation','message')),
  target_id   uuid not null,
  reason      text not null check (reason in ('illegal','counterfeit','stolen','dangerous','fraud','misleading','harassment','scam','unsafe_meeting','other')),
  details     text check (char_length(details) <= 1000),
  status      text not null default 'open' check (status in ('open','reviewing','actioned','dismissed')),
  handled_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid,
  action      text not null,
  entity_type text not null,
  entity_id   text not null,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Moderator notes live apart from listings so they are never exposed with public listing rows.
create table public.listing_moderation_notes (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  note       text not null check (char_length(note) <= 1000),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
