-- Profile of a friend: tapping a friend shows their languages, streak, medals, favourite
-- topics, last learned words and last training day.
--
-- - profile_stats: a summary of each user's studies, worked out on the phone (local-first)
--   and sent with save_profile_stats() after changes and when the app opens.
--   Only the summary leaves the phone: never the whole vocabulary.
-- - share: the user's switch "show my stats to friends". Off = the summary is emptied on the
--   server and friends see only nickname and photo (also the streak is hidden from them).
-- - friend_profile(uuid): everything a friend may see of one friend, in one call.
--
-- The table has no select policy for others: friends read it only through friend_profile().

create table public.profile_stats (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  share           boolean not null default true,
  native_language text check (native_language ~ '^[a-z]{2}$'),
  -- [{"code": "en", "words": 320, "learned": 40}, ...], most words first
  languages       jsonb not null default '[]' check (jsonb_typeof(languages) = 'array' and jsonb_array_length(languages) <= 10),
  -- {"words": 320, "learned": 40, "streak": 12, ...}: value of each medal (the app knows the levels)
  medals          jsonb not null default '{}' check (jsonb_typeof(medals) = 'object'),
  -- [{"id": "food", "words": 30}, ...]: topics with the most words, at most 5
  topics          jsonb not null default '[]' check (jsonb_typeof(topics) = 'array' and jsonb_array_length(topics) <= 5),
  -- [{"term": "apple", "lang": "en"}, ...]: last words learned, at most 20
  learned_words   jsonb not null default '[]' check (jsonb_typeof(learned_words) = 'array' and jsonb_array_length(learned_words) <= 20),
  updated_at      timestamptz not null default now(),
  -- A summary stays small: no way to store a whole vocabulary here
  check (octet_length(languages::text) + octet_length(medals::text) + octet_length(topics::text)
         + octet_length(learned_words::text) <= 8000)
);

comment on table public.profile_stats is 'Summary of each user''s studies shown to friends (see save_profile_stats, friend_profile).';

alter table public.profile_stats enable row level security;

-- Users read their own row (friends go through friend_profile)
create policy "own profile stats"
  on public.profile_stats for select
  to authenticated
  using (user_id = (select auth.uid()));

-- No insert/update/delete policies: writes only through save_profile_stats.

-- Saves the summary of the signed-in user. With p_share = false the summary is emptied.
create or replace function public.save_profile_stats(
  p_share boolean,
  p_native text,
  p_languages jsonb,
  p_medals jsonb,
  p_topics jsonb,
  p_learned jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  sharing boolean := coalesce(p_share, true);
begin
  if me is null then
    raise exception 'not_signed_in';
  end if;
  if not exists (select 1 from public.profiles where id = me) then
    raise exception 'no_profile';
  end if;

  insert into public.profile_stats as s
    (user_id, share, native_language, languages, medals, topics, learned_words, updated_at)
  values (
    me,
    sharing,
    case when sharing then p_native end,
    case when sharing then coalesce(p_languages, '[]') else '[]' end,
    case when sharing then coalesce(p_medals, '{}') else '{}' end,
    case when sharing then coalesce(p_topics, '[]') else '[]' end,
    case when sharing then coalesce(p_learned, '[]') else '[]' end,
    now()
  )
  on conflict (user_id) do update
    set share = excluded.share,
        native_language = excluded.native_language,
        languages = excluded.languages,
        medals = excluded.medals,
        topics = excluded.topics,
        learned_words = excluded.learned_words,
        updated_at = now();
end;
$$;

-- What a user may see of one friend. Errors: not_signed_in, not_friends (also when the
-- friendship is only a request, or the profile doesn't exist).
-- stats and streak are null when the friend hides them (shared = false) or never sent them.
create or replace function public.friend_profile(p_friend uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  since timestamptz;
  p public.profiles;
  s public.profile_stats;
  st public.streaks;
  sharing boolean;
begin
  if me is null then
    raise exception 'not_signed_in';
  end if;

  select coalesce(f.accepted_at, f.created_at) into since
    from public.friendships f
   where f.status = 'accepted'
     and ((f.requester = me and f.addressee = p_friend) or (f.requester = p_friend and f.addressee = me));
  if not found then
    raise exception 'not_friends';
  end if;

  select * into p from public.profiles where id = p_friend;
  if not found then
    raise exception 'not_friends';
  end if;
  select * into s from public.profile_stats where user_id = p_friend;
  select * into st from public.streaks where user_id = p_friend;
  sharing := coalesce(s.share, true);

  return jsonb_build_object(
    'id', p.id,
    'nickname', p.nickname,
    'avatar', p.avatar,
    'photo_path', p.photo_path,
    'friends_since', since,
    'shared', sharing,
    'streak', case when sharing and st.user_id is not null then jsonb_build_object(
      'current', st.current_streak,
      'best', st.best_streak,
      'saves', st.saves,
      'last_training_day', st.last_training_day,
      'as_of', st.as_of
    ) end,
    'stats', case when sharing and s.user_id is not null then jsonb_build_object(
      'native_language', s.native_language,
      'languages', s.languages,
      'medals', s.medals,
      'topics', s.topics,
      'learned_words', s.learned_words,
      'updated_at', s.updated_at
    ) end
  );
end;
$$;

revoke all on function public.save_profile_stats(boolean, text, jsonb, jsonb, jsonb, jsonb) from public, anon;
revoke all on function public.friend_profile(uuid) from public, anon;
grant execute on function public.save_profile_stats(boolean, text, jsonb, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.friend_profile(uuid) to authenticated;

-- Whether a user hides their stats from friends. Security definer: the streaks policy below
-- runs as the reader, who can't read other people's profile_stats.
create or replace function public.stats_hidden(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profile_stats where user_id = p_user and not share);
$$;

revoke all on function public.stats_hidden(uuid) from public, anon;
grant execute on function public.stats_hidden(uuid) to authenticated;

-- Friends no longer see the streak of someone who hides their stats
drop policy "own and friends streaks" on public.streaks;
create policy "own and friends streaks"
  on public.streaks for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (
      exists (
        select 1 from public.friendships f
        where f.status = 'accepted'
          and ((f.requester = (select auth.uid()) and f.addressee = streaks.user_id)
            or (f.addressee = (select auth.uid()) and f.requester = streaks.user_id))
      )
      and not public.stats_hidden(streaks.user_id)
    )
  );
