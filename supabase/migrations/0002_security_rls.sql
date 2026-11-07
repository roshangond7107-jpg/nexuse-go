-- NEXUSE GO — helper functions, integrity triggers, grants and Row Level Security (Batch 3).
-- Principle: the database is the security boundary. Clients hold only the anon/authenticated key.
-- "Trusted" callers (no end-user JWT: migrations, SQL editor, service-role Edge Functions) have auth.uid() IS NULL.

-- ---------- helpers ----------
create function public.is_moderator() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.user_roles where user_id = auth.uid()) $$;
create function public.is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin') $$;
/** A minor can chat/sell only after guardian verification. No profile => cannot participate. */
create function public.can_participate(uid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles p where p.id = uid and (not p.is_minor or p.guardian_verified)) $$;
create function public.is_blocked_between(a uuid, b uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.blocks where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)) $$;
/** Mirrors @nexuse/domain status machine. */
create function public.listing_transition_allowed(f public.listing_status, t public.listing_status) returns boolean language sql immutable as
$$ select case f
  when 'draft'          then t in ('pending_review','archived')
  when 'pending_review' then t in ('active','rejected','archived')
  when 'active'         then t in ('reserved','sold','archived','pending_review')
  when 'reserved'       then t in ('active','sold')
  when 'rejected'       then t in ('draft','archived')
  when 'archived'       then t in ('draft')
  else false end $$;

create function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
create trigger profiles_touch    before update on public.profiles    for each row execute function public.touch_updated_at();
create trigger communities_touch before update on public.communities for each row execute function public.touch_updated_at();

-- ---------- audit ----------
create function public.log_audit(p_action text, p_type text, p_id text, p_details jsonb default '{}') returns void
language sql security definer set search_path = public as
$$ insert into public.audit_logs (actor_id, action, entity_type, entity_id, details) values (auth.uid(), p_action, p_type, p_id, p_details) $$;

create function public.audit_admin_change() returns trigger language plpgsql security definer set search_path = public as $$
declare rid text; begin
  rid := coalesce((case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'id', (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'user_id');
  perform public.log_audit(lower(tg_op), tg_table_name, rid,
    jsonb_build_object('old', case when tg_op = 'INSERT' then null else to_jsonb(old) end, 'new', case when tg_op = 'DELETE' then null else to_jsonb(new) end));
  return null;
end $$;
create trigger communities_audit after insert or update or delete on public.communities for each row execute function public.audit_admin_change();
create trigger categories_audit  after insert or update or delete on public.categories  for each row execute function public.audit_admin_change();
create trigger user_roles_audit  after insert or update or delete on public.user_roles  for each row execute function public.audit_admin_change();

create function public.audit_listing_moderation() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and public.is_moderator() and new.status is distinct from old.status then
    perform public.log_audit('listing_status_change', 'listings', new.id::text, jsonb_build_object('from', old.status, 'to', new.status));
  end if; return null;
end $$;
create trigger listings_audit after update on public.listings for each row execute function public.audit_listing_moderation();

create function public.audit_report_update() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    perform public.log_audit('report_status_change', 'reports', new.id::text, jsonb_build_object('from', old.status, 'to', new.status));
  end if; return null;
end $$;
create trigger reports_audit after update on public.reports for each row execute function public.audit_report_update();

-- ---------- listing integrity & moderation workflow ----------
create function public.listings_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare
  trusted boolean := auth.uid() is null;
  staff   boolean := public.is_moderator();
  comm_status text; cat_comm text; cat_active boolean;
begin
  select community_id, is_active into cat_comm, cat_active from public.categories where id = new.category_id;
  if cat_comm is distinct from new.community_id then raise exception 'Category does not belong to this community'; end if;

  if tg_op = 'INSERT' then
    if not trusted and not staff then
      select status into comm_status from public.communities where id = new.community_id;
      if comm_status is distinct from 'active' or not cat_active then raise exception 'Community is not active'; end if;
      if new.status not in ('draft','pending_review') then raise exception 'New listings must start as draft or pending_review'; end if;
    end if;
  else
    if not trusted then
      if new.seller_id <> old.seller_id or new.community_id <> old.community_id then raise exception 'seller and community cannot be changed'; end if;
    end if;
    if new.status <> old.status then
      if not trusted and not public.listing_transition_allowed(old.status, new.status) then
        raise exception 'Illegal listing transition: % -> %', old.status, new.status;
      end if;
      if not trusted and not staff and old.status = 'pending_review' and new.status in ('active','rejected') then
        raise exception 'Only moderators can approve or reject listings';
      end if;
    elsif not trusted and not staff then
      if old.status = 'sold' then raise exception 'Sold listings cannot be edited'; end if;
      -- editing public content of a live listing sends it back to review
      if old.status = 'active' and (new.title, new.description, new.category_id) is distinct from (old.title, old.description, old.category_id) then
        new.status := 'pending_review';
      end if;
    end if;
    new.updated_at := now();
  end if;
  return new;
end $$;
create trigger listings_guard_t before insert or update on public.listings for each row execute function public.listings_guard();

create function public.listing_images_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare s uuid; n int; begin
  select seller_id into s from public.listings where id = new.listing_id;
  if auth.uid() is not null and (new.storage_path not like (s::text || '/' || new.listing_id::text || '/%') or new.storage_path like '%..%') then
    raise exception 'Image path must be <seller>/<listing>/<file>'; end if;
  select count(*) into n from public.listing_images where listing_id = new.listing_id;
  if n >= 8 then raise exception 'A listing can have at most 8 images'; end if;
  return new;
end $$;
create trigger listing_images_guard_t before insert on public.listing_images for each row execute function public.listing_images_guard();

create function public.conversations_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare l record; begin
  select seller_id, status into l from public.listings where id = new.listing_id;
  if not found or l.status not in ('active','reserved') then raise exception 'Listing is not available for enquiries'; end if;
  new.seller_id := l.seller_id;
  if new.buyer_id = new.seller_id then raise exception 'You cannot message yourself'; end if;
  if public.is_blocked_between(new.buyer_id, new.seller_id) then raise exception 'Messaging is not possible between these users'; end if;
  if not public.can_participate(new.buyer_id) then raise exception 'Messaging requires guardian verification for under-18 accounts'; end if;
  return new;
end $$;
create trigger conversations_guard_t before insert on public.conversations for each row execute function public.conversations_guard();

-- ---------- search (invoker rights: RLS decides what is visible) ----------
create function public.search_listings(
  p_community text, p_q text default null, p_category text default null, p_condition public.listing_condition default null,
  p_min int default null, p_max int default null, p_sort text default 'newest', p_page int default 1, p_page_size int default 24)
returns table (id uuid, title text, price_inr int, original_price_inr int, condition public.listing_condition, city text, state text,
               category_slug text, created_at timestamptz, total_count bigint)
language sql stable security invoker set search_path = public as $$
  select l.id, l.title, l.price_inr, l.original_price_inr, l.condition, l.city, l.state, c.slug, l.created_at, count(*) over()
  from public.listings l join public.categories c on c.id = l.category_id
  where l.community_id = p_community and l.status = 'active'
    and (p_q is null or btrim(p_q) = '' or l.search_tsv @@ plainto_tsquery('simple', p_q))
    and (p_category is null or c.slug = p_category or c.parent_id = (select cc.id from public.categories cc where cc.community_id = p_community and cc.slug = p_category))
    and (p_condition is null or l.condition = p_condition)
    and (p_min is null or l.price_inr >= p_min) and (p_max is null or l.price_inr <= p_max)
  order by case when p_sort = 'price_asc' then l.price_inr end asc, case when p_sort = 'price_desc' then l.price_inr end desc, l.created_at desc, l.id
  limit least(greatest(p_page_size, 1), 48) offset (greatest(p_page, 1) - 1) * least(greatest(p_page_size, 1), 48)
$$;

-- ---------- grants (deny by default) ----------
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant execute on function public.is_moderator(), public.is_admin(), public.can_participate(uuid), public.is_blocked_between(uuid, uuid),
  public.listing_transition_allowed(public.listing_status, public.listing_status),
  public.search_listings(text, text, text, public.listing_condition, int, int, text, int, int) to anon, authenticated;

grant select on public.communities, public.categories, public.public_profiles, public.listings, public.listing_images to anon, authenticated;
grant insert, update, delete on public.communities, public.categories to authenticated;                      -- RLS: admin only
grant select on public.user_roles, public.audit_logs to authenticated;                                       -- RLS: own / admin
grant select on public.profiles to authenticated;
grant insert (id, display_name, date_of_birth, city, state, institution, accepted_terms_at) on public.profiles to authenticated;
grant update (display_name, city, state, institution) on public.profiles to authenticated;                   -- not DOB, minor flag or guardian flag
grant insert (seller_id, community_id, category_id, title, description, price_inr, original_price_inr, condition, city, state, pin_code, quantity, fulfilment, status) on public.listings to authenticated;
grant update (category_id, title, description, price_inr, original_price_inr, condition, city, state, pin_code, quantity, fulfilment, status) on public.listings to authenticated;
grant delete on public.listings to authenticated;
grant select, insert, update, delete on public.listing_moderation_notes to authenticated;                    -- RLS: staff write, seller reads own
grant insert (listing_id, storage_path, position), update (position), delete on public.listing_images to authenticated;
grant select, insert (user_id, listing_id), delete on public.wishlists to authenticated;
grant select, insert (blocker_id, blocked_id), delete on public.blocks to authenticated;
grant select, insert (listing_id, buyer_id) on public.conversations to authenticated;
grant select, insert (conversation_id, sender_id, body) on public.messages to authenticated;
grant select, insert (reporter_id, target_type, target_id, reason, details), update (status, handled_by) on public.reports to authenticated;

-- ---------- RLS ----------
alter table public.communities enable row level security;
alter table public.categories enable row level security;
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_moderation_notes enable row level security;
alter table public.listing_images enable row level security;
alter table public.wishlists enable row level security;
alter table public.blocks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;

create policy communities_read  on public.communities for select using (status in ('active','coming_soon') or public.is_moderator());
create policy communities_admin on public.communities for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy categories_read  on public.categories for select using (
  (is_active and exists (select 1 from public.communities c where c.id = community_id and c.status = 'active')) or public.is_admin());
create policy categories_admin on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy roles_read on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy profiles_read   on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy listings_read on public.listings for select using (
  (status in ('active','reserved') and exists (select 1 from public.communities c where c.id = community_id and c.status = 'active'))
  or seller_id = auth.uid() or public.is_moderator());
create policy listings_insert on public.listings for insert to authenticated with check (seller_id = auth.uid() and public.can_participate(auth.uid()));
create policy listings_update on public.listings for update to authenticated using (seller_id = auth.uid() or public.is_moderator()) with check (seller_id = auth.uid() or public.is_moderator());
create policy listings_delete on public.listings for delete to authenticated using (seller_id = auth.uid() and status in ('draft','archived','rejected'));

create policy modnotes_read  on public.listing_moderation_notes for select to authenticated using (
  public.is_moderator() or exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));
create policy modnotes_write on public.listing_moderation_notes for all to authenticated using (public.is_moderator()) with check (public.is_moderator());

create policy images_read   on public.listing_images for select using (exists (select 1 from public.listings l where l.id = listing_id));
create policy images_write  on public.listing_images for insert to authenticated with check (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));
create policy images_update on public.listing_images for update to authenticated using (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));
create policy images_delete on public.listing_images for delete to authenticated using (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));

create policy wishlist_read   on public.wishlists for select to authenticated using (user_id = auth.uid());
create policy wishlist_insert on public.wishlists for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.listings l where l.id = listing_id));
create policy wishlist_delete on public.wishlists for delete to authenticated using (user_id = auth.uid());

create policy blocks_read   on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy blocks_insert on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy blocks_delete on public.blocks for delete to authenticated using (blocker_id = auth.uid());

create policy conv_read   on public.conversations for select to authenticated using (auth.uid() in (buyer_id, seller_id));
create policy conv_insert on public.conversations for insert to authenticated with check (buyer_id = auth.uid());

create policy msg_read   on public.messages for select to authenticated using (exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)));
create policy msg_insert on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and public.can_participate(auth.uid())
  and exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id) and not public.is_blocked_between(c.buyer_id, c.seller_id)));

create policy reports_read   on public.reports for select to authenticated using (reporter_id = auth.uid() or public.is_moderator());
create policy reports_insert on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy reports_update on public.reports for update to authenticated using (public.is_moderator()) with check (public.is_moderator() and handled_by = auth.uid());

create policy audit_read on public.audit_logs for select to authenticated using (public.is_admin());
