begin;
alter table public.monthly_schedules
  add column if not exists status_manha text not null default 'scheduled' check (status_manha in ('scheduled','cancelled','not_applicable')),
  add column if not exists status_noite text not null default 'scheduled' check (status_noite in ('scheduled','cancelled','not_applicable')),
  add column if not exists reason_manha text not null default '',
  add column if not exists reason_noite text not null default '';
create or replace function private.notify_meeting_status() returns trigger language plpgsql security definer set search_path = '' as $$
declare period text; old_status text; new_status text; old_reason text; new_reason text;
begin
 foreach period in array array['manha', 'noite'] loop
  old_status := case when period = 'manha' then old.status_manha else old.status_noite end;
  new_status := case when period = 'manha' then new.status_manha else new.status_noite end;
  old_reason := case when period = 'manha' then old.reason_manha else old.reason_noite end;
  new_reason := case when period = 'manha' then new.reason_manha else new.reason_noite end;
  if old_status is distinct from new_status or old_reason is distinct from new_reason then
   insert into public.notifications(user_id,title,body,href)
   select a.user_id, 'Alteração na sua escala', 'A reunião da ' || case when period = 'manha' then 'manhã' else 'noite' end || ' de ' || to_char(new.date at time zone 'America/Sao_Paulo','DD/MM/YYYY') || ' foi atualizada.' || case when new_reason <> '' then ' Motivo: ' || new_reason else '' end, '/monthly-schedule'
   from public.member_accounts a where a.active and exists (select 1 from jsonb_each(coalesce(new.assignments,'{}'::jsonb)) entry where (entry.key like '%' || period or entry.key = 'multimedia') and jsonb_typeof(entry.value) = 'array' and entry.value ? a.member_id);
  end if;
 end loop;
 return new;
end $$;
revoke all on function private.notify_meeting_status() from public, anon, authenticated;
drop trigger if exists notify_meeting_status on public.monthly_schedules;
create trigger notify_meeting_status after update of status_manha,status_noite,reason_manha,reason_noite on public.monthly_schedules for each row execute function private.notify_meeting_status();
notify pgrst, 'reload schema';
commit;
