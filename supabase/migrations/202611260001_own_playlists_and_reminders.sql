begin;

-- Assignment ownership, rather than account role, controls playlist editing.
create or replace function public.update_own_playlist(p_schedule_id text, p_period text, p_playlist text[])
returns void language plpgsql security definer set search_path = '' as $$
declare account public.member_accounts%rowtype; meeting public.monthly_schedules%rowtype;
begin
  select * into account from public.member_accounts where user_id = auth.uid() and active;
  if not found or account.must_change_password then
    raise exception 'Entre com sua conta e defina sua senha primeiro' using errcode = '42501';
  end if;
  if p_period is null or p_period not in ('manha','noite') or p_playlist is null
      or cardinality(p_playlist) > 1000 or array_position(p_playlist, null) is not null then
    raise exception 'Repertório ou período inválido' using errcode = '22023';
  end if;
  select * into meeting from public.monthly_schedules where id = p_schedule_id for update;
  if not found then raise exception 'Escala não encontrada'; end if;
  if not coalesce((meeting.assignments -> ('abertura_' || p_period)) ->> 0 = account.member_id, false) then
    raise exception 'Você só pode editar o repertório da sua própria abertura' using errcode = '42501';
  end if;
  if exists (select 1 from unnest(p_playlist) as requested(song_id)
      where not exists (select 1 from public.songs s where s.id = requested.song_id)) then
    raise exception 'Música desconhecida' using errcode = '22023';
  end if;
  if p_period = 'manha' then
    update public.monthly_schedules set playlist_manha = p_playlist where id = p_schedule_id;
  else
    update public.monthly_schedules set playlist_noite = p_playlist where id = p_schedule_id;
  end if;
end $$;
revoke all on function public.update_own_playlist(text,text,text[]) from public, anon;
grant execute on function public.update_own_playlist(text,text,text[]) to authenticated;

-- A separate ledger prevents duplicate reminders, including concurrent retries.
create table if not exists private.schedule_reminders (
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id text not null references public.monthly_schedules(id) on delete cascade,
  period text not null,
  kind text not null,
  reminder_day date not null,
  primary key (user_id, schedule_id, period, kind, reminder_day)
);
alter table private.schedule_reminders enable row level security;
revoke all on private.schedule_reminders from public, anon, authenticated;

create or replace function private.send_weekly_schedule_reminders()
returns void language plpgsql security definer set search_path = '' as $$
declare today date := (now() at time zone 'America/Sao_Paulo')::date; item record;
begin
  for item in
    select a.user_id, s.id, p.period, k.kind,
      (s.date at time zone 'America/Sao_Paulo')::date as meeting_day
    from public.monthly_schedules s
    cross join (values ('manha'), ('noite')) p(period)
    cross join (values ('abertura'), ('pregacao')) k(kind)
    join public.member_accounts a on a.active and not a.must_change_password
      and coalesce(s.assignments -> (k.kind || '_' || p.period), '[]'::jsonb) ? a.member_id
    where (s.date at time zone 'America/Sao_Paulo')::date between today and
      (date_trunc('week', today::timestamp)::date + 6)
      and coalesce(case when p.period = 'manha' then s.status_manha else s.status_noite end, 'scheduled') = 'scheduled'
      and (k.kind = 'pregacao' or coalesce(cardinality(case when p.period = 'manha' then s.playlist_manha else s.playlist_noite end), 0) = 0)
  loop
    if private.notification_enabled(case when item.kind = 'abertura' then 'playlist_reminders' else 'preaching_reminders' end) then
      insert into private.schedule_reminders(user_id, schedule_id, period, kind, reminder_day)
      values(item.user_id, item.id, item.period, item.kind,
        case when item.kind = 'abertura' then today else item.meeting_day end)
      on conflict do nothing;
      if found then
        insert into public.notifications(user_id, title, body, href)
        values(item.user_id,
          case when item.kind = 'abertura' then 'Repertório pendente' else 'Sua pregação nesta semana' end,
          case when item.kind = 'abertura' then 'Você fará a abertura e ainda precisa montar o repertório de ' else 'Você está responsável pela pregação de ' end
            || to_char(item.meeting_day, 'DD/MM/YYYY') || case when item.period = 'manha' then ' pela manhã.' else ' à noite.' end,
          '/schedule');
      end if;
    end if;
  end loop;
end $$;
revoke all on function private.send_weekly_schedule_reminders() from public, anon, authenticated;

-- Runs at 09:00 in São Paulo (12:00 UTC), even when the app is closed.
create extension if not exists pg_cron;
select cron.schedule('weekly-schedule-reminders', '0 12 * * *', 'select private.send_weekly_schedule_reminders()');
notify pgrst, 'reload schema';
commit;
