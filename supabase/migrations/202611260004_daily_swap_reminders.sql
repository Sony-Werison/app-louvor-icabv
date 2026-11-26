begin;
create table if not exists private.swap_reminders (
  request_id bigint not null references public.swap_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_day date not null,
  primary key (request_id,user_id,reminder_day)
);
alter table private.swap_reminders enable row level security;
revoke all on private.swap_reminders from public,anon,authenticated;

create or replace function private.send_daily_swap_reminders()
returns void language plpgsql security definer set search_path = '' as $$
declare today date := (now() at time zone 'America/Sao_Paulo')::date; request record; recipient record;
begin
  if not private.notification_enabled('swap_requests') then return; end if;
  for request in
    select r.*, s.date as meeting_date, m.name as requester_name
    from public.swap_requests r
    join public.monthly_schedules s on s.id = r.schedule_id
    join public.members m on m.id = r.requester_member
    where r.state = 'open'
      and (s.date at time zone 'America/Sao_Paulo')::date >= today
      and (s.assignments -> r.column_id ->> r.slot) = r.requester_member
      and case when r.column_id = 'multimedia' then
        coalesce(s.status_manha,'scheduled') = 'scheduled' or coalesce(s.status_noite,'scheduled') = 'scheduled'
      else coalesce(case when r.column_id like '%manha' then s.status_manha else s.status_noite end,'scheduled') = 'scheduled' end
    for update of r
  loop
    for recipient in
      select a.user_id from public.member_accounts a
      join public.members m on m.id = a.member_id
      where a.active and not a.must_change_password and a.user_id <> request.requester
        and coalesce(m.roles,'[]'::jsonb) ? 'Abertura'
    loop
      insert into private.swap_reminders(request_id,user_id,reminder_day)
      values(request.id,recipient.user_id,today) on conflict do nothing;
      if found then
        insert into public.notifications(user_id,title,body,href)
        values(recipient.user_id,'Pedido de troca',
          request.requester_name || ' ainda precisa de substituição em '
          || to_char(request.meeting_date at time zone 'America/Sao_Paulo','DD/MM/YYYY')
          || ' (' || case request.column_id
            when 'abertura_manha' then 'abertura da manhã' when 'abertura_noite' then 'abertura da noite'
            when 'pregacao_manha' then 'pregação da manhã' when 'pregacao_noite' then 'pregação da noite'
            else 'multimídia' end || '). Confira o pedido no aplicativo.', '/trocas');
      end if;
    end loop;
  end loop;
end $$;
revoke all on function private.send_daily_swap_reminders() from public,anon,authenticated;
select cron.schedule('daily-swap-reminders','0 12 * * *','select private.send_daily_swap_reminders()');
commit;
