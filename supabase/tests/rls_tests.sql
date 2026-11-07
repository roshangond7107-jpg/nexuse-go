-- Security / behaviour tests for migrations 0001-0003 (+ seed). Run by supabase/tests/run.sh on a scratch Postgres.
create schema test;
create table test.results (name text, ok boolean, detail text);
grant usage on schema test to public; grant all on test.results to public;

create function test.as_user(uid uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', uid::text, false); perform set_config('request.jwt.claim.role', 'authenticated', false); execute 'set role authenticated'; end $$;
create function test.as_anon() returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '', false); execute 'set role anon'; end $$;
create function test.reset() returns void language plpgsql as $$
begin execute 'reset role'; perform set_config('request.jwt.claim.sub', '', false); end $$;
create function test.ok(name text, cond boolean) returns void language sql as $$ insert into test.results values (name, coalesce(cond, false), null) $$;
-- statement must FAIL (any error) -> pass; succeed -> fail
create function test.fails(name text, stmt text) returns void language plpgsql as $$
declare n bigint;
begin
  begin
    execute stmt; get diagnostics n = row_count;
    if stmt ~* '^\s*(update|delete)' and n = 0 then insert into test.results values (name, true, 'blocked: 0 rows affected');
    else insert into test.results values (name, false, 'statement unexpectedly succeeded (rows=' || n || ')'); end if;
  exception when others then insert into test.results values (name, true, sqlerrm); end;
end $$;
create function test.works(name text, stmt text) returns void language plpgsql as $$
declare n bigint;
begin
  begin
    execute stmt; get diagnostics n = row_count;
    if stmt ~* '^\s*(update|delete)' and n = 0 then insert into test.results values (name, false, '0 rows affected');
    else insert into test.results values (name, true, null); end if;
  exception when others then insert into test.results values (name, false, sqlerrm); end;
end $$;
create function test.count(q text) returns bigint language plpgsql as $$ declare n bigint; begin execute 'select count(*) from (' || q || ') t' into n; return n; end $$;

\set A '''aaaaaaaa-0000-0000-0000-000000000001'''
\set B '''bbbbbbbb-0000-0000-0000-000000000002'''
\set M '''cccccccc-0000-0000-0000-000000000003'''
\set AD '''dddddddd-0000-0000-0000-000000000004'''
\set K '''eeeeeeee-0000-0000-0000-000000000005'''
\set X '''ffffffff-0000-0000-0000-000000000006'''

-- fixtures as superuser (bypasses RLS)
insert into auth.users (id, phone) values (:A,'+919000000001'),(:B,'+919000000002'),(:M,'+919000000003'),(:AD,'+919000000004'),(:K,'+919000000005'),(:X,'+919000000006');
insert into public.user_roles values (:M,'moderator'),(:AD,'admin');
select test.ok('seed: students active, others coming_soon', (select count(*) from public.communities where status='active') = 1 and (select count(*) from public.communities where status='coming_soon') = 4);
select test.ok('seed: 14 top-level + 4 sub categories', (select count(*) from public.categories where parent_id is null) = 14 and (select count(*) from public.categories where parent_id is not null) = 4);

-- ===== profiles =====
select test.as_user(:A::uuid);
select test.works('adult creates own profile', $$insert into public.profiles (id, display_name, date_of_birth, city, state, accepted_terms_at) values ('aaaaaaaa-0000-0000-0000-000000000001','Asha','2000-01-01','Kota','Rajasthan',now())$$);
select test.fails('cannot create profile for another user', $$insert into public.profiles (id, display_name, date_of_birth, city, state, accepted_terms_at) values ('bbbbbbbb-0000-0000-0000-000000000002','Evil','2000-01-01','Kota','Rajasthan',now())$$);
select test.fails('cannot self-set guardian_verified on insert', $$insert into public.profiles (id, display_name, date_of_birth, city, state, accepted_terms_at, guardian_verified) values ('aaaaaaaa-0000-0000-0000-000000000001','Asha','2000-01-01','Kota','Rajasthan',now(),true)$$);
select test.fails('cannot update is_minor', $$update public.profiles set is_minor = false where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$);
select test.fails('cannot update date_of_birth', $$update public.profiles set date_of_birth = '1990-01-01' where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$);
select test.works('can update display_name', $$update public.profiles set display_name = 'Asha K' where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$);
select test.reset();
select test.as_user(:B::uuid);
select test.works('second adult profile', $$insert into public.profiles (id, display_name, date_of_birth, city, state, accepted_terms_at) values ('bbbbbbbb-0000-0000-0000-000000000002','Bhanu','1999-05-05','Pune','Maharashtra',now())$$);
select test.ok('users cannot read other profiles (private DOB)', test.count($$select 1 from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$) = 0);
select test.ok('public_profiles view exposes seller card only', test.count($$select 1 from public.public_profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$) = 1);
select test.fails('public_profiles has no date_of_birth column', $$select date_of_birth from public.public_profiles$$);
select test.reset();
select test.as_user(:K::uuid);
select test.works('minor creates profile', $$insert into public.profiles (id, display_name, date_of_birth, city, state, accepted_terms_at) values ('eeeeeeee-0000-0000-0000-000000000005','Kiran', (current_date - interval '15 years')::date,'Kota','Rajasthan',now())$$);
select test.reset();
select test.ok('minor flagged, guardian not verified', (select is_minor and not guardian_verified from public.profiles where id = :K));
select test.as_user(:X::uuid);  -- user with NO profile
select test.reset();

-- ===== listings: creation & workflow =====
create temp table ids as select
  (select id from public.categories where community_id='students' and slug='ncert-school') as cat,
  (select id from public.categories where community_id='students' and slug='neet') as neet;
grant select on ids to public;
select test.as_user(:K::uuid);
select test.fails('minor without guardian cannot sell', format($$insert into public.listings (seller_id, community_id, category_id, title, description, price_inr, condition, city, state) values (%L,'students',%L,'NCERT Physics 12','Good condition no markings inside.',200,'good','Kota','Rajasthan')$$, :K, (select cat from ids)));
select test.reset();
select test.as_user(:X::uuid);
select test.fails('user without profile cannot sell', format($$insert into public.listings (seller_id, community_id, category_id, title, description, price_inr, condition, city, state) values (%L,'students',%L,'NCERT Physics 12','Good condition no markings inside.',200,'good','Kota','Rajasthan')$$, :X, (select cat from ids)));
select test.reset();

select test.as_user(:A::uuid);
select test.works('adult creates draft listing', format($$insert into public.listings (seller_id, community_id, category_id, title, description, price_inr, original_price_inr, condition, city, state) values (%L,'students',%L,'NCERT Chemistry Class 11','Good condition, no markings inside.',200,300,'good','Kota','Rajasthan')$$, :A, (select cat from ids)));
select test.works('seller deletes own draft', $$delete from public.listings where title = 'NCERT Chemistry Class 11'$$);
select test.reset();
insert into public.listings (id, seller_id, community_id, category_id, title, description, price_inr, original_price_inr, condition, city, state)
  values ('11111111-1111-1111-1111-111111111111', :A, 'students', (select cat from ids), 'NCERT Physics Class 12', 'Good condition, no markings inside.', 200, 300, 'good', 'Kota', 'Rajasthan');
select test.as_user(:A::uuid);
select test.fails('cannot create directly as active', format($$insert into public.listings (seller_id, community_id, category_id, title, description, price_inr, condition, city, state, status) values (%L,'students',%L,'Sneaky active listing','Trying to skip moderation entirely.',100,'good','Kota','Rajasthan','active')$$, :A, (select cat from ids)));
select test.fails('cannot sell as another user', format($$insert into public.listings (seller_id, community_id, category_id, title, description, price_inr, condition, city, state) values (%L,'students',%L,'Impersonated listing','Posting as somebody else here.',100,'good','Kota','Rajasthan')$$, :B, (select cat from ids)));
select test.fails('inactive community rejected', format($$insert into public.listings (seller_id, community_id, category_id, title, description, price_inr, condition, city, state) values (%L,'workers',%L,'Workers listing here','Should not be possible right now.',100,'good','Kota','Rajasthan')$$, :A, (select cat from ids)));
select test.fails('category/community mismatch rejected', format($$insert into public.listings (seller_id, community_id, category_id, title, description, price_inr, condition, city, state) values (%L,'families',%L,'Mismatched category','Category is from another community.',100,'good','Kota','Rajasthan')$$, :A, (select cat from ids)));
select test.fails('original price below price rejected', format($$insert into public.listings (seller_id, community_id, category_id, title, description, price_inr, original_price_inr, condition, city, state) values (%L,'students',%L,'Bad pricing example','Original price is lower than price.',500,100,'good','Kota','Rajasthan')$$, :A, (select cat from ids)));
select test.fails('invalid condition rejected', format($$insert into public.listings (seller_id, community_id, category_id, title, description, price_inr, condition, city, state) values (%L,'students',%L,'Broken condition','Condition value not in the allowed list.',100,'broken','Kota','Rajasthan')$$, :A, (select cat from ids)));
select test.works('seller submits for review', $$update public.listings set status='pending_review' where id='11111111-1111-1111-1111-111111111111'$$);
select test.fails('seller cannot self-approve', $$update public.listings set status='active' where id='11111111-1111-1111-1111-111111111111'$$);
select test.reset();
select test.as_anon();
select test.ok('anon cannot see pending listing', test.count($$select 1 from public.listings$$) = 0);
select test.reset();
select test.as_user(:B::uuid);
select test.ok('other user cannot see pending listing', test.count($$select 1 from public.listings$$) = 0);
select test.reset();

-- ===== moderation =====
select test.as_user(:M::uuid);
select test.ok('moderator sees pending listing', test.count($$select 1 from public.listings where status='pending_review'$$) = 1);
select test.works('moderator approves', $$update public.listings set status='active' where id='11111111-1111-1111-1111-111111111111'$$);
select test.works('moderator writes private note', $$insert into public.listing_moderation_notes (listing_id, note, created_by) values ('11111111-1111-1111-1111-111111111111','looks fine', 'cccccccc-0000-0000-0000-000000000003')$$);
select test.fails('moderator cannot change communities', $$update public.communities set status='active' where id='workers'$$);
select test.reset();
select test.ok('audit: moderator approval logged', (select count(*) from public.audit_logs where action='listing_status_change' and actor_id = :M) = 1);

select test.as_anon();
select test.ok('anon sees approved listing', test.count($$select 1 from public.listings$$) = 1);
select test.ok('anon search finds it by text', (select count(*) from public.search_listings('students','physics')) = 1);
select test.ok('anon search honours community scope', (select count(*) from public.search_listings('workers','physics')) = 0);
select test.ok('anon search honours price filter', (select count(*) from public.search_listings('students',null,null,null,500,null)) = 0);
select test.fails('anon cannot read moderation notes', $$select * from public.listing_moderation_notes$$);
select test.fails('anon cannot insert listings', format($$insert into public.listings (seller_id, community_id, category_id, title, description, price_inr, condition, city, state) values (%L,'students',%L,'Anonymous listing','Anonymous should never insert.',1,'good','Kota','Rajasthan')$$, :A, (select cat from ids)));
select test.reset();

select test.as_user(:A::uuid);
select test.ok('seller reads own moderation note', test.count($$select 1 from public.listing_moderation_notes$$) = 1);
select test.fails('seller cannot write moderation note', $$update public.listing_moderation_notes set note='x'$$);
select test.works('seller edits title of live listing', $$update public.listings set title='NCERT Physics Class 12 Part 1' where id='11111111-1111-1111-1111-111111111111'$$);
select test.reset();
select test.ok('edit of live listing returned it to review', (select status from public.listings where id='11111111-1111-1111-1111-111111111111') = 'pending_review');
select test.as_user(:M::uuid);
select test.works('moderator re-approves', $$update public.listings set status='active' where id='11111111-1111-1111-1111-111111111111'$$);
select test.reset();
select test.as_user(:A::uuid);
select test.works('seller changes price without re-review', $$update public.listings set price_inr = 180 where id='11111111-1111-1111-1111-111111111111'$$);
select test.fails('seller cannot reassign seller_id (no grant)', $$update public.listings set seller_id = 'bbbbbbbb-0000-0000-0000-000000000002' where id='11111111-1111-1111-1111-111111111111'$$);
select test.fails('seller cannot move listing to other community (no grant)', $$update public.listings set community_id = 'workers' where id='11111111-1111-1111-1111-111111111111'$$);
select test.fails('seller cannot delete an active listing', $$delete from public.listings where id='11111111-1111-1111-1111-111111111111'$$);
select test.reset();
select test.ok('active listing still active after price edit', (select status from public.listings where id='11111111-1111-1111-1111-111111111111') = 'active');
select test.as_user(:B::uuid);
select test.fails('other user cannot edit listing', $$update public.listings set price_inr = 1 where id='11111111-1111-1111-1111-111111111111'$$);
select test.ok('...and the update touched nothing', (select price_inr from public.listings where id='11111111-1111-1111-1111-111111111111') = 180);
select test.reset();

-- ===== images =====
select test.as_user(:A::uuid);
select test.works('seller adds image with correct path', $$insert into public.listing_images (listing_id, storage_path) values ('11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000001/11111111-1111-1111-1111-111111111111/a.jpg')$$);
select test.fails('image path of another user rejected', $$insert into public.listing_images (listing_id, storage_path) values ('11111111-1111-1111-1111-111111111111','bbbbbbbb-0000-0000-0000-000000000002/11111111-1111-1111-1111-111111111111/a.jpg')$$);
select test.fails('path traversal rejected', $$insert into public.listing_images (listing_id, storage_path) values ('11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000001/11111111-1111-1111-1111-111111111111/../x.jpg')$$);
do $$ begin for i in 2..8 loop insert into public.listing_images (listing_id, storage_path) values ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001/11111111-1111-1111-1111-111111111111/' || i || '.jpg'); end loop; end $$;
select test.fails('9th image rejected', $$insert into public.listing_images (listing_id, storage_path) values ('11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000001/11111111-1111-1111-1111-111111111111/9.jpg')$$);
select test.reset();
select test.as_user(:B::uuid);
select test.fails('other user cannot add image to listing', $$insert into public.listing_images (listing_id, storage_path) values ('11111111-1111-1111-1111-111111111111','bbbbbbbb-0000-0000-0000-000000000002/11111111-1111-1111-1111-111111111111/z.jpg')$$);
select test.ok('anyone can read images of visible listing', test.count($$select 1 from public.listing_images$$) = 8);
select test.reset();

-- ===== storage =====
select test.as_user(:A::uuid);
select test.works('storage: upload into own folder', $$insert into storage.objects (bucket_id, name) values ('listing-images','aaaaaaaa-0000-0000-0000-000000000001/11111111-1111-1111-1111-111111111111/s.jpg')$$);
select test.fails('storage: upload into another user folder', $$insert into storage.objects (bucket_id, name) values ('listing-images','bbbbbbbb-0000-0000-0000-000000000002/x/s.jpg')$$);
select test.fails('storage: upload to other bucket', $$insert into storage.objects (bucket_id, name) values ('other','aaaaaaaa-0000-0000-0000-000000000001/x.jpg')$$);
select test.reset();
select test.as_user(:K::uuid);
select test.fails('storage: minor without guardian cannot upload', $$insert into storage.objects (bucket_id, name) values ('listing-images','eeeeeeee-0000-0000-0000-000000000005/x/s.jpg')$$);
select test.reset();
select test.ok('storage bucket limits set', (select file_size_limit = 5242880 and allowed_mime_types = array['image/jpeg','image/png','image/webp'] from storage.buckets where id='listing-images'));

-- ===== wishlist =====
select test.as_user(:B::uuid);
select test.works('wishlist add', $$insert into public.wishlists (user_id, listing_id) values ('bbbbbbbb-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111')$$);
select test.fails('wishlist add for someone else', $$insert into public.wishlists (user_id, listing_id) values ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111')$$);
select test.reset();
select test.as_user(:A::uuid);
select test.ok('wishlist is private', test.count($$select 1 from public.wishlists$$) = 0);
select test.reset();

-- ===== messaging =====
select test.as_user(:B::uuid);
select test.works('buyer starts conversation', $$insert into public.conversations (listing_id, buyer_id) values ('11111111-1111-1111-1111-111111111111','bbbbbbbb-0000-0000-0000-000000000002')$$);
select test.works('buyer sends message', $$insert into public.messages (conversation_id, sender_id, body) values ((select id from public.conversations limit 1),'bbbbbbbb-0000-0000-0000-000000000002','Is it still available?')$$);
select test.fails('cannot send as someone else', $$insert into public.messages (conversation_id, sender_id, body) values ((select id from public.conversations limit 1),'aaaaaaaa-0000-0000-0000-000000000001','forged')$$);
select test.fails('empty message rejected', $$insert into public.messages (conversation_id, sender_id, body) values ((select id from public.conversations limit 1),'bbbbbbbb-0000-0000-0000-000000000002','   ')$$);
select test.reset();
select test.ok('seller_id derived from listing by trigger', (select seller_id = :A from public.conversations limit 1));
select test.as_user(:A::uuid);
select test.ok('seller can read the conversation', test.count($$select 1 from public.messages$$) = 1);
select test.works('seller replies', $$insert into public.messages (conversation_id, sender_id, body) values ((select id from public.conversations limit 1),'aaaaaaaa-0000-0000-0000-000000000001','Yes, it is.')$$);
select test.fails('seller cannot message themselves via listing', $$insert into public.conversations (listing_id, buyer_id) values ('11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000001')$$);
select test.reset();
select test.as_user(:AD::uuid);
select test.ok('admin cannot read private messages', test.count($$select 1 from public.messages$$) = 0);
select test.reset();
select test.as_user(:M::uuid);
select test.ok('moderator cannot read private messages', test.count($$select 1 from public.messages$$) = 0);
select test.reset();
select test.as_user(:K::uuid);
select test.ok('uninvolved user cannot read messages', test.count($$select 1 from public.messages$$) = 0);
select test.fails('minor without guardian cannot start chat', $$insert into public.conversations (listing_id, buyer_id) values ('11111111-1111-1111-1111-111111111111','eeeeeeee-0000-0000-0000-000000000005')$$);
select test.reset();
-- blocking
select test.as_user(:A::uuid);
select test.works('seller blocks buyer', $$insert into public.blocks (blocker_id, blocked_id) values ('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002')$$);
select test.fails('seller cannot message blocked buyer', $$insert into public.messages (conversation_id, sender_id, body) values ((select id from public.conversations limit 1),'aaaaaaaa-0000-0000-0000-000000000001','hello?')$$);
select test.reset();
select test.as_user(:B::uuid);
select test.fails('blocked buyer cannot message', $$insert into public.messages (conversation_id, sender_id, body) values ((select id from public.conversations limit 1),'bbbbbbbb-0000-0000-0000-000000000002','please reply')$$);
select test.ok('block list is private to blocker', test.count($$select 1 from public.blocks$$) = 0);
select test.reset();

-- ===== reports =====
select test.as_user(:B::uuid);
select test.works('user files report', $$insert into public.reports (reporter_id, target_type, target_id, reason) values ('bbbbbbbb-0000-0000-0000-000000000002','listing','11111111-1111-1111-1111-111111111111','misleading')$$);
select test.fails('duplicate report rejected', $$insert into public.reports (reporter_id, target_type, target_id, reason) values ('bbbbbbbb-0000-0000-0000-000000000002','listing','11111111-1111-1111-1111-111111111111','scam')$$);
select test.fails('report as someone else rejected', $$insert into public.reports (reporter_id, target_type, target_id, reason) values ('aaaaaaaa-0000-0000-0000-000000000001','listing','11111111-1111-1111-1111-111111111111','scam')$$);
select test.fails('invalid reason rejected', $$insert into public.reports (reporter_id, target_type, target_id, reason) values ('bbbbbbbb-0000-0000-0000-000000000002','user','aaaaaaaa-0000-0000-0000-000000000001','because')$$);
select test.fails('reporter cannot change status', $$update public.reports set status='dismissed'$$);
select test.reset();
select test.as_user(:A::uuid);
select test.ok('seller cannot see report against own listing', test.count($$select 1 from public.reports$$) = 0);
select test.reset();
select test.as_user(:M::uuid);
select test.ok('moderator sees reports', test.count($$select 1 from public.reports$$) = 1);
select test.works('moderator handles report', $$update public.reports set status='actioned', handled_by='cccccccc-0000-0000-0000-000000000003'$$);
select test.fails('moderator cannot claim another handler', $$update public.reports set handled_by='dddddddd-0000-0000-0000-000000000004'$$);
select test.reset();
select test.ok('audit: report handling logged', (select count(*) from public.audit_logs where action='report_status_change') = 1);

-- ===== staff / roles / admin =====
select test.as_user(:A::uuid);
select test.fails('user cannot grant themselves admin', $$insert into public.user_roles values ('aaaaaaaa-0000-0000-0000-000000000001','admin')$$);
select test.ok('user cannot see role table', test.count($$select 1 from public.user_roles$$) = 0);
select test.fails('user cannot update communities', $$update public.communities set status='active' where id='workers'$$);
select test.ok('user cannot read audit log (RLS hides all rows)', test.count($$select 1 from public.audit_logs$$) = 0);
select test.fails('user cannot insert audit log', $$insert into public.audit_logs (action, entity_type, entity_id) values ('x','y','z')$$);
select test.fails('user cannot call log_audit', $$select public.log_audit('x','y','z')$$);
select test.reset();
select test.as_user(:M::uuid);
select test.ok('moderator cannot read audit log', test.count($$select 1 from public.audit_logs$$) = 0);
select test.fails('moderator cannot grant roles', $$insert into public.user_roles values ('bbbbbbbb-0000-0000-0000-000000000002','moderator')$$);
select test.reset();

-- ===== community activation / deactivation =====
select test.as_user(:AD::uuid);
select test.ok('admin sees audit log', test.count($$select 1 from public.audit_logs$$) >= 2);
select test.works('admin deactivates students community', $$update public.communities set status='inactive' where id='students'$$);
select test.reset();
select test.as_anon();
select test.ok('deactivated community hides listings from public', test.count($$select 1 from public.listings$$) = 0);
select test.ok('deactivated community hides categories', test.count($$select 1 from public.categories$$) = 0);
select test.ok('deactivated community search returns nothing', (select count(*) from public.search_listings('students','physics')) = 0);
select test.ok('inactive community no longer listed publicly', test.count($$select 1 from public.communities where id='students'$$) = 0);
select test.reset();
select test.as_user(:A::uuid);
select test.ok('seller can still see own listing', test.count($$select 1 from public.listings$$) = 1);
select test.fails('cannot create listing in deactivated community', format($$insert into public.listings (seller_id, community_id, category_id, title, description, price_inr, condition, city, state) values (%L,'students',%L,'Late listing attempt','Community is currently deactivated.',100,'good','Kota','Rajasthan')$$, :A, (select cat from ids)));
select test.reset();
select test.as_user(:AD::uuid);
select test.works('admin activates workers community', $$update public.communities set status='active' where id='workers'$$);
select test.works('admin reactivates students', $$update public.communities set status='active' where id='students'$$);
select test.works('admin manages categories', $$update public.categories set is_active = false where slug='clothing'$$);
select test.reset();
select test.ok('audit: community changes logged (n=' || (select count(*) from public.audit_logs where entity_type='communities' and actor_id = :AD) || ')', (select count(*) from public.audit_logs where entity_type='communities' and actor_id = :AD) = 3);
select test.as_anon();
select test.ok('anon: listings visible again', test.count($$select 1 from public.listings$$) = 1);
select test.ok('anon: inactive category hidden', test.count($$select 1 from public.categories where slug='clothing'$$) = 0);
select test.reset();

-- ===== sold is terminal, delete rules =====
select test.as_user(:A::uuid);
select test.works('seller marks sold', $$update public.listings set status='sold' where id='11111111-1111-1111-1111-111111111111'$$);
select test.fails('sold cannot be reopened', $$update public.listings set status='active' where id='11111111-1111-1111-1111-111111111111'$$);
select test.fails('sold cannot be edited', $$update public.listings set title='Edited after sale' where id='11111111-1111-1111-1111-111111111111'$$);
select test.reset();

-- ===== result =====
\echo
select format('%s %s%s', case when ok then 'PASS' else 'FAIL' end, name, case when ok or detail is null then '' else '  -> ' || detail end) as result from test.results order by ctid;
select count(*) filter (where ok) as passed, count(*) filter (where not ok) as failed, count(*) as total from test.results;
\gset
\echo
\echo RLS RESULT: :passed passed, :failed failed, :total total
select case when :failed::int > 0 then 1/0 end;
