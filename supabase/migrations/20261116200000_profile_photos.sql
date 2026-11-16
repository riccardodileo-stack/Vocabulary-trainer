-- Profile photos: stored in Supabase Storage (bucket "avatars"), one folder per user named
-- with the user's hidden id: "<user id>/<random>.jpg". The profile keeps the path.
--
-- The bucket is public for reading (pictures load fast from the CDN, like the drawn avatars),
-- but a file can only be found knowing its path, which has the user's id and a random name:
-- only who can see the profile (the user, friends, requests) learns it. Only the owner can
-- add, replace or delete files in their folder. Files: JPEG/PNG/WebP, at most 1 MB (the app
-- sends 512×512 JPEG, ~60 KB).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars: owner uploads"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: owner replaces"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: owner deletes"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Listing the owner's own folder (to clean up old photos)
create policy "avatars: owner lists"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ── Profiles: the photo path ─────────────────────────────────────────────

alter table public.profiles
  add column photo_path text
  check (photo_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9_-]{1,40}\.(jpg|png|webp)$');

comment on column public.profiles.photo_path is
  'Path of the profile photo in the "avatars" bucket; null = no photo (drawn avatar).';

-- A photo path must be in the user's own folder
create or replace function public.valid_photo_path(p_path text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9_-]{1,40}\.(jpg|png|webp)$'
     and split_part(p_path, '/', 1) = auth.uid()::text;
$$;

-- create_profile and update_profile get the photo; my_friends returns it
drop function public.create_profile(text, text, text);
drop function public.update_profile(text, text);
drop function public.my_friends();

create function public.create_profile(
  p_nickname text,
  p_avatar text default null,
  p_friend_code text default null,
  p_photo_path text default null
)
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
  if p_photo_path is not null and not public.valid_photo_path(p_photo_path) then
    raise exception 'invalid_photo';
  end if;
  code := case
    when p_friend_code ~ '^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$'
         and not exists (select 1 from public.profiles where friend_code = p_friend_code)
    then p_friend_code
    else public.new_friend_code()
  end;
  insert into public.profiles (id, nickname, friend_code, avatar, photo_path)
  values (me, p_nickname, code, case when p_avatar ~ '^[a-z0-9-]{1,40}$' then p_avatar end, p_photo_path)
  returning * into result;
  return result;
exception
  when unique_violation then
    raise exception 'nickname_taken';
end;
$$;

-- Changes the profile of the signed-in user. null = unchanged; p_avatar '' = no drawn avatar;
-- p_photo_path '' = remove the photo.
create function public.update_profile(
  p_nickname text default null,
  p_avatar text default null,
  p_photo_path text default null
)
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
  if p_photo_path is not null and p_photo_path <> '' and not public.valid_photo_path(p_photo_path) then
    raise exception 'invalid_photo';
  end if;
  update public.profiles
     set nickname = coalesce(p_nickname, nickname),
         avatar = case
           when p_avatar is null then avatar
           when p_avatar ~ '^[a-z0-9-]{1,40}$' then p_avatar
           else null
         end,
         photo_path = case
           when p_photo_path is null then photo_path
           when p_photo_path = '' then null
           else p_photo_path
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

create function public.my_friends()
returns table (id uuid, nickname text, avatar text, photo_path text, status text, since timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.nickname, p.avatar, p.photo_path,
         case when f.status = 'accepted' then 'friend'
              when f.addressee = auth.uid() then 'incoming'
              else 'outgoing' end,
         coalesce(f.accepted_at, f.created_at)
    from public.friendships f
    join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
   where auth.uid() in (f.requester, f.addressee)
   order by 5, p.nickname;
$$;

revoke all on function public.valid_photo_path(text) from public, anon, authenticated;
revoke all on function public.create_profile(text, text, text, text) from public, anon;
revoke all on function public.update_profile(text, text, text) from public, anon;
revoke all on function public.my_friends() from public, anon;
grant execute on function public.create_profile(text, text, text, text) to authenticated;
grant execute on function public.update_profile(text, text, text) to authenticated;
grant execute on function public.my_friends() to authenticated;
