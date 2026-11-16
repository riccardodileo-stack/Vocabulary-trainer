-- Accounts: profiles (nickname, friend code, avatar) and friendships.
-- Every user, guest (anonymous sign-in) or registered (email), is a row of auth.users: its id
-- (uuid) is the hidden key of the user. A guest who registers later keeps the same id.
--
-- Rules live here, not in the app:
-- - the nickname is unique (stored in lower case) and has the app's shape (3–20 characters,
--   a–z 0–9 _ . , starting with a letter);
-- - the friend code is given by the server, unique, never changed ("K7M2-X9PQ");
-- - nobody can list profiles or codes: a code can only be looked up exactly;
-- - friendships start as a request that the other user accepts.
-- Everything that writes goes through the functions below (security definer), so the checks
-- can't be skipped by calling the tables directly.

-- ── Profiles ─────────────────────────────────────────────────────────────

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  nickname     text not null unique check (nickname ~ '^[a-z][a-z0-9_.]{2,19}$'),
  -- Alphabet without look-alikes (no 0 O 1 I L): same as generateFriendCode in the app
  friend_code  text not null unique check (friend_code ~ '^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$'),
  -- One of the drawn avatars of the app (content/avatars.ts); null = a photo, which stays on the phone
  avatar       text check (avatar ~ '^[a-z0-9-]{1,40}$'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'Public part of a user: nickname, friend code, avatar.';

alter table public.profiles enable row level security;

-- ── Friendships ──────────────────────────────────────────────────────────

create table public.friendships (
  requester    uuid not null references public.profiles (id) on delete cascade,
  addressee    uuid not null references public.profiles (id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  primary key (requester, addressee),
  check (requester <> addressee)
);

-- One row per pair of users, whoever asked first
create unique index friendships_one_per_pair
  on public.friendships (least(requester, addressee), greatest(requester, addressee));
create index friendships_addressee on public.friendships (addressee);

alter table public.friendships enable row level security;

-- A user sees the friendships and requests that involve them
create policy "friendships of the user"
  on public.friendships for select
  to authenticated
  using ((select auth.uid()) in (requester, addressee));

-- A user sees their own profile and the profiles of their friends and requests
create policy "own profile and friends"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.friendships f
      where (f.requester = (select auth.uid()) and f.addressee = profiles.id)
         or (f.addressee = (select auth.uid()) and f.requester = profiles.id)
    )
  );

-- No insert/update/delete policies: writes only through the functions below.

-- ── Helpers ──────────────────────────────────────────────────────────────

create or replace function public.new_friend_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  code text;
begin
  loop
    code := '';
    for i in 1..8 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
      if i = 4 then
        code := code || '-';
      end if;
    end loop;
    exit when not exists (select 1 from public.profiles where friend_code = code);
  end loop;
  return code;
end;
$$;

-- ── Functions called by the app ──────────────────────────────────────────
-- Errors are raised with a short message the app recognises: nickname_taken, invalid_nickname,
-- not_signed_in, no_profile.

-- Whether a nickname is free (also before signing in, on the welcome screen)
create or replace function public.nickname_available(p_nickname text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_nickname ~ '^[a-z][a-z0-9_.]{2,19}$'
     and not exists (
       select 1 from public.profiles
       where nickname = p_nickname and id is distinct from auth.uid()
     );
$$;

-- Creates the profile of the signed-in user (guest or registered). A friend code already shown
-- by the app is kept when it's free. Called again it just returns the existing profile.
create or replace function public.create_profile(p_nickname text, p_avatar text default null, p_friend_code text default null)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  result public.profiles;
  code text;
begin
  if me is null then
    raise exception 'not_signed_in';
  end if;
  select * into result from public.profiles where id = me;
  if found then
    return result;
  end if;
  if p_nickname !~ '^[a-z][a-z0-9_.]{2,19}$' then
    raise exception 'invalid_nickname';
  end if;
  if exists (select 1 from public.profiles where nickname = p_nickname) then
    raise exception 'nickname_taken';
  end if;
  code := case
    when p_friend_code ~ '^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$'
         and not exists (select 1 from public.profiles where friend_code = p_friend_code)
    then p_friend_code
    else public.new_friend_code()
  end;
  insert into public.profiles (id, nickname, friend_code, avatar)
  values (me, p_nickname, code, case when p_avatar ~ '^[a-z0-9-]{1,40}$' then p_avatar end)
  returning * into result;
  return result;
exception
  when unique_violation then
    raise exception 'nickname_taken';
end;
$$;

-- Changes nickname and/or avatar of the signed-in user (null = unchanged; avatar '' = photo)
create or replace function public.update_profile(p_nickname text default null, p_avatar text default null)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  result public.profiles;
begin
  if me is null then
    raise exception 'not_signed_in';
  end if;
  if p_nickname is not null and p_nickname !~ '^[a-z][a-z0-9_.]{2,19}$' then
    raise exception 'invalid_nickname';
  end if;
  update public.profiles
     set nickname = coalesce(p_nickname, nickname),
         avatar = case
           when p_avatar is null then avatar
           when p_avatar ~ '^[a-z0-9-]{1,40}$' then p_avatar
           else null
         end,
         updated_at = now()
   where id = me
  returning * into result;
  if not found then
    raise exception 'no_profile';
  end if;
  return result;
exception
  when unique_violation then
    raise exception 'nickname_taken';
end;
$$;

-- Sends a friend request to the owner of a code. Returns what happened:
-- sent | accepted (they had already asked you: now you are friends) | already_friends |
-- already_sent | not_found | self | too_many (50 requests waiting)
create or replace function public.send_friend_request(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  other uuid;
  existing public.friendships;
begin
  if me is null then
    raise exception 'not_signed_in';
  end if;
  if not exists (select 1 from public.profiles where id = me) then
    raise exception 'no_profile';
  end if;
  select id into other from public.profiles where friend_code = upper(trim(p_code));
  if other is null then
    return 'not_found';
  end if;
  if other = me then
    return 'self';
  end if;
  select * into existing from public.friendships
   where (requester = me and addressee = other) or (requester = other and addressee = me);
  if found then
    if existing.status = 'accepted' then
      return 'already_friends';
    elsif existing.requester = me then
      return 'already_sent';
    else
      update public.friendships set status = 'accepted', accepted_at = now()
       where requester = other and addressee = me;
      return 'accepted';
    end if;
  end if;
  if (select count(*) from public.friendships where requester = me and status = 'pending') >= 50 then
    return 'too_many';
  end if;
  insert into public.friendships (requester, addressee) values (me, other);
  return 'sent';
end;
$$;

-- Accepts or refuses a request received from p_from
create or replace function public.respond_friend_request(p_from uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not_signed_in';
  end if;
  if p_accept then
    update public.friendships set status = 'accepted', accepted_at = now()
     where requester = p_from and addressee = me and status = 'pending';
  else
    delete from public.friendships
     where requester = p_from and addressee = me and status = 'pending';
  end if;
end;
$$;

-- Removes a friend, or cancels a request sent to them
create or replace function public.remove_friend(p_other uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not_signed_in';
  end if;
  delete from public.friendships
   where (requester = me and addressee = p_other) or (requester = p_other and addressee = me);
end;
$$;

-- Friends and requests of the signed-in user, with nickname and avatar.
-- status: friend | incoming (they asked you) | outgoing (you asked them)
create or replace function public.my_friends()
returns table (id uuid, nickname text, avatar text, status text, since timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.nickname, p.avatar,
         case when f.status = 'accepted' then 'friend'
              when f.addressee = auth.uid() then 'incoming'
              else 'outgoing' end,
         coalesce(f.accepted_at, f.created_at)
    from public.friendships f
    join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
   where auth.uid() in (f.requester, f.addressee)
   order by 4, p.nickname;
$$;

-- Deletes the signed-in user: account, profile and friendships (required by the App Store).
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- Who may call what: nickname_available also before signing in, the rest only signed in
revoke all on function public.new_friend_code() from public, anon, authenticated;
revoke all on function public.nickname_available(text) from public;
revoke all on function public.create_profile(text, text, text) from public, anon;
revoke all on function public.update_profile(text, text) from public, anon;
revoke all on function public.send_friend_request(text) from public, anon;
revoke all on function public.respond_friend_request(uuid, boolean) from public, anon;
revoke all on function public.remove_friend(uuid) from public, anon;
revoke all on function public.my_friends() from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.nickname_available(text) to anon, authenticated;
grant execute on function public.create_profile(text, text, text) to authenticated;
grant execute on function public.update_profile(text, text) to authenticated;
grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.my_friends() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
