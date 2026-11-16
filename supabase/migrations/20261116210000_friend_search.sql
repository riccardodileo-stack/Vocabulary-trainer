-- Friends can also be found by nickname, not only by friend code.
--
-- - search_profiles(text): profiles whose nickname starts with the text (at least 3 characters,
--   at most 10 results, the exact nickname first). Each row says how the user is related to
--   the caller: none | friend | incoming (they asked you) | outgoing (you asked them).
--   Only nickname, avatar and photo are returned: never the id or the friend code.
-- - send_friend_request_by_nick(text): the same as send_friend_request(code), with the nickname.
--
-- This changes a rule of 20261116190000_profiles_friends.sql: nicknames can now be searched
-- (friend codes still can't).

-- Prefix searches on the nickname use this index (the unique one can't, because of the collation)
create index profiles_nickname_prefix on public.profiles (nickname text_pattern_ops);

create or replace function public.search_profiles(p_query text)
returns table (nickname text, avatar text, photo_path text, relation text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  q text := lower(trim(both from coalesce(p_query, '')));
begin
  if me is null then
    raise exception 'not_signed_in';
  end if;
  q := ltrim(q, '@');
  -- Same characters as a nickname: anything else can't match (and _ . are escaped below)
  if q !~ '^[a-z0-9_.]{3,20}$' then
    return;
  end if;
  return query
    select p.nickname, p.avatar, p.photo_path,
           case when f.status = 'accepted' then 'friend'
                when f.requester = me then 'outgoing'
                when f.addressee = me then 'incoming'
                else 'none' end
      from public.profiles p
      left join public.friendships f
        on (f.requester = me and f.addressee = p.id) or (f.requester = p.id and f.addressee = me)
     where p.nickname like replace(q, '_', '\_') || '%'
       and p.id <> me
     order by (p.nickname = q) desc, length(p.nickname), p.nickname
     limit 10;
end;
$$;

create or replace function public.send_friend_request_by_nick(p_nickname text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  code text;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  select friend_code into code from public.profiles
   where nickname = ltrim(lower(trim(both from coalesce(p_nickname, ''))), '@');
  if code is null then
    return 'not_found';
  end if;
  return public.send_friend_request(code);
end;
$$;

revoke all on function public.search_profiles(text) from public, anon;
revoke all on function public.send_friend_request_by_nick(text) from public, anon;
grant execute on function public.search_profiles(text) to authenticated;
grant execute on function public.send_friend_request_by_nick(text) to authenticated;
