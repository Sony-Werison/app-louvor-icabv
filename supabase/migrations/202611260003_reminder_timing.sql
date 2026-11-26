begin;
create or replace function private.send_weekly_schedule_reminders()
returns void language plpgsql security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  item record;
  pending_enabled boolean;
  responsibility_enabled boolean;
begin
  for item in
    select a.user_id, s.id, assignment.period, assignment.kind,
      (s.date at time zone 'America/Sao_Paulo')::date as meeting_day,
      coalesce(cardinality(case when assignment.period = 'manha' then s.playlist_manha else s.playlist_noite end), 0) = 0 as pending
    from public.monthly_schedules s
    cross join (values
      ('manha','abertura','abertura_manha'), ('noite','abertura','abertura_noite'),
      ('manha','pregacao','pregacao_manha'), ('noite','pregacao','pregacao_noite'),
      ('dia','multimedia','multimedia')
    ) assignment(period,kind,column_id)
    join public.member_accounts a on a.active and not a.must_change_password
      and coalesce(s.assignments -> assignment.column_id, '[]'::jsonb) ? a.member_id
    where (s.date at time zone 'America/Sao_Paulo')::date between today and today + 7
      and case when assignment.period = 'dia' then
        coalesce(s.status_manha,'scheduled') = 'scheduled' or coalesce(s.status_noite,'scheduled') = 'scheduled'
      else coalesce(case when assignment.period = 'manha' then s.status_manha else s.status_noite end,'scheduled') = 'scheduled' end
  loop
    pending_enabled := item.kind = 'abertura' and item.pending
      and item.meeting_day <= date_trunc('week',today::timestamp)::date + 6
      and private.notification_enabled('playlist_reminders');
    responsibility_enabled := (
      (extract(isodow from today) = 1 and item.meeting_day <= today + 6)
      or item.meeting_day = today + 1
    ) and private.notification_enabled(case item.kind
      when 'abertura' then 'opening_reminders'
      when 'pregacao' then 'preaching_reminders'
      else 'multimedia_reminders' end);
    if pending_enabled or responsibility_enabled then
      -- One reminder per assignment per day, even when both conditions apply.
      insert into private.schedule_reminders(user_id,schedule_id,period,kind,reminder_day)
      values(item.user_id,item.id,item.period,'timed_' || item.kind,today)
      on conflict do nothing;
      if found then
        insert into public.notifications(user_id,title,body,href)
        values(item.user_id,
          case when pending_enabled then 'Repertório pendente'
            when item.kind = 'abertura' then 'Lembrete da sua abertura'
            when item.kind = 'pregacao' then 'Lembrete da sua pregação'
            else 'Lembrete da sua escala de multimídia' end,
          case when pending_enabled then 'Você fará a abertura e ainda precisa montar o repertório de '
            when item.kind = 'abertura' then 'Você está responsável pela abertura de '
            when item.kind = 'pregacao' then 'Você está responsável pela pregação de '
            else 'Você está responsável pela multimídia em ' end
          || to_char(item.meeting_day,'DD/MM/YYYY')
          || case item.period when 'manha' then ' pela manhã.' when 'noite' then ' à noite.' else '.' end,
          '/schedule');
      end if;
    end if;
  end loop;
end $$;
revoke all on function private.send_weekly_schedule_reminders() from public, anon, authenticated;
notify pgrst, 'reload schema';
commit;
