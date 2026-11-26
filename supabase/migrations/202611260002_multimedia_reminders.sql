begin;
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
  if private.notification_enabled('multimedia_reminders') then
    for item in
      select a.user_id, s.id, (s.date at time zone 'America/Sao_Paulo')::date as meeting_day
      from public.monthly_schedules s
      join public.member_accounts a on a.active and not a.must_change_password
        and coalesce(s.assignments -> 'multimedia', '[]'::jsonb) ? a.member_id
      where (s.date at time zone 'America/Sao_Paulo')::date between today and
        (date_trunc('week', today::timestamp)::date + 6)
        and (coalesce(s.status_manha, 'scheduled') = 'scheduled'
          or coalesce(s.status_noite, 'scheduled') = 'scheduled')
    loop
      insert into private.schedule_reminders(user_id, schedule_id, period, kind, reminder_day)
      values(item.user_id, item.id, 'dia', 'multimedia', item.meeting_day)
      on conflict do nothing;
      if found then
        insert into public.notifications(user_id, title, body, href)
        values(item.user_id, 'Sua escala de multimídia nesta semana',
          'Você está responsável pela multimídia em ' || to_char(item.meeting_day, 'DD/MM/YYYY') || '. Confira sua escala no aplicativo.',
          '/schedule');
      end if;
    end loop;
  end if;
end $$;
revoke all on function private.send_weekly_schedule_reminders() from public, anon, authenticated;


notify pgrst, 'reload schema';
commit;
