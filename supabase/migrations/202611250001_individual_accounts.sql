-- Non-destructive migration: keeps members, songs, assignments and playlists.
-- Apply in a transaction. Existing administrators are bootstrapped explicitly below.
begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create table if not exists public.member_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  member_id text not null unique references public.members(id) on delete cascade,
  login_email text not null,
  role text not null check (role in ('admin', 'abertura', 'viewer')),
  must_change_password boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists member_accounts_login_email_unique
  on public.member_accounts (lower(login_email));
alter table public.member_accounts enable row level security;
revoke all on public.member_accounts from anon, authenticated;
grant select on public.member_accounts to authenticated;
grant all on public.member_accounts to service_role;

create or replace function private.is_app_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.member_accounts
    where user_id = (select auth.uid()) and role = 'admin'
      and active and not must_change_password);
$$;
revoke all on function private.is_app_admin() from public;
grant execute on function private.is_app_admin() to anon, authenticated, service_role;

drop policy if exists account_read on public.member_accounts;
create policy account_read on public.member_accounts for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_app_admin()));

-- Preserve the existing owner's password and Auth identity. Link only an exact match.
do $$
begin
  if not exists (select 1 from auth.users u join public.members m
      on lower(m.email) = lower(u.email)
      where u.id = 'aac22e25-2199-4f6c-8f8a-8ab8d8d71059'::uuid
        and m.id = 'm1754015917841'
        and lower(u.email) = 'pereirawerison@gmail.com') then
    raise exception 'Expected administrator identity/member match was not found';
  end if;
end $$;
insert into public.member_accounts (user_id, member_id, login_email, role, must_change_password)
values ('aac22e25-2199-4f6c-8f8a-8ab8d8d71059', 'm1754015917841', 'pereirawerison@gmail.com', 'admin', false)
on conflict (user_id) do update set role = 'admin', active = true;

-- Replace permissive policies together so no old OR policy bypasses the new rules.
do $$
declare p record; t text;
begin
  for p in select tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('members','songs','monthly_schedules','app_settings','rehearsal')
  loop execute format('drop policy %I on public.%I', p.policyname, p.tablename); end loop;
  foreach t in array array['members','songs','monthly_schedules'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy catalog_read on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy admin_write on public.%I for all to authenticated using ((select private.is_app_admin())) with check ((select private.is_app_admin()))', t);
  end loop;
end $$;
alter table public.app_settings enable row level security;
create policy admin_settings on public.app_settings for all to authenticated
  using ((select private.is_app_admin())) with check ((select private.is_app_admin()));
alter table public.rehearsal enable row level security;
create policy retired_rehearsal_admin on public.rehearsal for all to authenticated
  using ((select private.is_app_admin())) with check ((select private.is_app_admin()));

-- Expose only the reminder text, never the old shared passwords.
create or replace function public.get_public_reminder()
returns text language sql stable security definer set search_path = '' as $$
  select reminder_message from public.app_settings where id = 'settings';
$$;
revoke all on function public.get_public_reminder() from public;
grant execute on function public.get_public_reminder() to anon, authenticated;

-- The only write path for a non-admin: exactly one playlist for their own assignment.
create or replace function public.update_own_playlist(p_schedule_id text, p_period text, p_playlist text[])
returns void language plpgsql security definer set search_path = '' as $$
declare account public.member_accounts%rowtype; meeting public.monthly_schedules%rowtype;
begin
  select * into account from public.member_accounts where user_id = auth.uid() and active;
  if not found or account.must_change_password then
    raise exception 'Sign in and change the temporary password first' using errcode = '42501';
  end if;
  if p_period is null or p_period not in ('manha','noite') or p_playlist is null
      or cardinality(p_playlist) > 1000 or array_position(p_playlist, null) is not null then
    raise exception 'Invalid playlist or period' using errcode = '22023';
  end if;
  select * into meeting from public.monthly_schedules where id = p_schedule_id for update;
  if not found then raise exception 'Schedule not found' using errcode = 'P0002'; end if;
  if account.role <> 'admin' and (account.role <> 'abertura'
      or not coalesce((meeting.assignments -> ('abertura_' || p_period)) ? account.member_id, false)) then
    raise exception 'You can only edit your own assigned playlist' using errcode = '42501';
  end if;
  if exists (select 1 from unnest(p_playlist) as requested(song_id)
      where not exists (select 1 from public.songs s where s.id = requested.song_id)) then
    raise exception 'Unknown song' using errcode = '22023';
  end if;
  if p_period = 'manha' then
    update public.monthly_schedules set playlist_manha = p_playlist where id = p_schedule_id;
  else
    update public.monthly_schedules set playlist_noite = p_playlist where id = p_schedule_id;
  end if;
end $$;
revoke all on function public.update_own_playlist(text,text,text[]) from public, anon;
grant execute on function public.update_own_playlist(text,text,text[]) to authenticated;

-- Remove the existing avatar write policies (including bucket-independent owner policies).
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects'
    and cmd in ('INSERT','UPDATE','DELETE','ALL') and
    (policyname in ('Allow authenticated users to upload','Allow authenticated users to update their own avatar',
      'Allow authenticated users to delete their own avatar','Anyone can upload an avatar.',
      'Anyone can update their own avatar.','Anyone can delete their own avatar.',
      'Authenticated user can upload','Owner can update','Owner can delete',
      'owner_insert_1m2j5x_0','owner_update_1m2j5x_0','owner_delete_1m2j5x_0','admin_avatar_write')
      or coalesce(qual,'') like '%avatars%' or coalesce(with_check,'') like '%avatars%')
  loop execute format('drop policy %I on storage.objects', p.policyname); end loop;
end $$;
create policy admin_avatar_write on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (select private.is_app_admin()))
  with check (bucket_id = 'avatars' and (select private.is_app_admin()));

notify pgrst, 'reload schema';
commit;
