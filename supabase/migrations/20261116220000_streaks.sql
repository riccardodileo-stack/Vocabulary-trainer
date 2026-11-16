-- Streak of every user: current streak, longest streak, streak saves earned and used.
--
-- The phone works the streak out from its training days (local-first, also offline) and
-- sends the numbers here after training and when the app opens (save_streak). The server
-- keeps the latest copy:
-- - to show it to friends (and for challenges later);
-- - to give the record back on a new phone (the best streak never goes down here).
-- `as_of` is the phone's day when the numbers were worked out: a current streak whose
-- as_of is old may be broken by now (the app hasn't been opened since).

create table public.streaks (
  user_id          uuid primary key references public.profiles (id) on delete cascade,
  current_streak   integer not null default 0 check (current_streak between 0 and 100000),
  best_streak      integer not null default 0 check (best_streak between 0 and 100000),
  -- Saves available now (MAX_SAVES in the app's domain/activity.ts is 2)
  saves            integer not null default 0 check (saves between 0 and 2),
  saves_earned     integer not null default 0 check (saves_earned between 0 and 100000),
  saves_used       integer not null default 0 check (saves_used between 0 and 100000),
  last_training_day date,
  as_of            date,
  updated_at       timestamptz not null default now(),
  check (best_streak >= current_streak),
  check (saves_used <= saves_earned)
);

comment on table public.streaks is 'Streak of each user, worked out on the phone (see save_streak).';

alter table public.streaks enable row level security;

-- A user sees their own streak and their friends' ones
create policy "own and friends streaks"
  on public.streaks for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester = (select auth.uid()) and f.addressee = streaks.user_id)
          or (f.addressee = (select auth.uid()) and f.requester = streaks.user_id))
    )
  );

-- No insert/update/delete policies: writes only through save_streak.

-- Saves the streak of the signed-in user and returns what the server keeps
-- (best_streak is the highest ever received, so a new phone can take it back).
create or replace function public.save_streak(
  p_current integer,
  p_best integer,
  p_saves integer,
  p_earned integer,
  p_used integer,
  p_last_day date,
  p_as_of date
)
returns public.streaks
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  result public.streaks;
begin
  if me is null then
    raise exception 'not_signed_in';
  end if;
  if not exists (select 1 from public.profiles where id = me) then
    raise exception 'no_profile';
  end if;
  -- The phone's day can be ahead of the server's (time zones), not more than that
  if p_as_of is null or p_as_of > current_date + 1 or (p_last_day is not null and p_last_day > p_as_of) then
    raise exception 'invalid_streak';
  end if;
  if p_current < 0 or p_best < p_current or p_saves not between 0 and 2
     or p_earned < 0 or p_used < 0 or p_used > p_earned then
    raise exception 'invalid_streak';
  end if;

  insert into public.streaks as s
    (user_id, current_streak, best_streak, saves, saves_earned, saves_used, last_training_day, as_of, updated_at)
  values (me, p_current, p_best, p_saves, p_earned, p_used, p_last_day, p_as_of, now())
  on conflict (user_id) do update
    set current_streak = excluded.current_streak,
        best_streak = greatest(s.best_streak, excluded.best_streak),
        saves = excluded.saves,
        saves_earned = excluded.saves_earned,
        saves_used = excluded.saves_used,
        last_training_day = excluded.last_training_day,
        as_of = excluded.as_of,
        updated_at = now()
  returning * into result;
  return result;
end;
$$;

revoke all on function public.save_streak(integer, integer, integer, integer, integer, date, date) from public, anon;
grant execute on function public.save_streak(integer, integer, integer, integer, integer, date, date) to authenticated;
