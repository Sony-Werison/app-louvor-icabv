begin;
create table if not exists public.notifications (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null, body text not null, href text not null,
 created_at timestamptz not null default now(), read_at timestamptz
);
create index if not exists notifications_user_created on public.notifications(user_id, created_at desc);
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy notifications_read_own on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_update_own on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create or replace function private.notify_schedule_changes() returns trigger language plpgsql security definer set search_path='' as $$
declare before_assign jsonb := '{}'::jsonb; after_assign jsonb := '{}'::jsonb; meeting_date timestamptz; v_old record;
begin
 if tg_op <> 'INSERT' then before_assign := coalesce(old.assignments,'{}'::jsonb); end if;
 if tg_op <> 'DELETE' then after_assign := coalesce(new.assignments,'{}'::jsonb); meeting_date := new.date; else meeting_date := old.date; end if;
 if tg_op = 'INSERT' or tg_op = 'DELETE' or before_assign is distinct from after_assign or (tg_op = 'UPDATE' and old.date is distinct from new.date) then
  insert into public.notifications(user_id,title,body,href)
  select a.user_id, 'Alteração na sua escala', 'Sua escala de ' || to_char(meeting_date at time zone 'America/Sao_Paulo','DD/MM/YYYY') || ' foi atualizada.','/monthly-schedule'
  from public.member_accounts a where a.active and exists (
    select 1 from (select value from jsonb_each(before_assign) union all select value from jsonb_each(after_assign)) assignments
    where jsonb_typeof(assignments.value) = 'array' and assignments.value ? a.member_id
  ) and (tg_op <> 'UPDATE' or old.date is distinct from new.date or exists (
    select 1 from (select key from jsonb_object_keys(before_assign) key union select key from jsonb_object_keys(after_assign) key) k
    where (coalesce(before_assign -> k.key,'[]'::jsonb) ? a.member_id) is distinct from (coalesce(after_assign -> k.key,'[]'::jsonb) ? a.member_id)
  ));
 end if;
 if tg_op = 'UPDATE' then
  if coalesce(cardinality(old.playlist_manha),0)=0 and coalesce(cardinality(new.playlist_manha),0)>0 then
   insert into public.notifications(user_id,title,body,href) select user_id,'Novo repertório disponível','O repertório da manhã de ' || to_char(new.date at time zone 'America/Sao_Paulo','DD/MM/YYYY') || ' foi preparado.','/schedule' from public.member_accounts where active;
  end if;
  if coalesce(cardinality(old.playlist_noite),0)=0 and coalesce(cardinality(new.playlist_noite),0)>0 then
   insert into public.notifications(user_id,title,body,href) select user_id,'Novo repertório disponível','O repertório da noite de ' || to_char(new.date at time zone 'America/Sao_Paulo','DD/MM/YYYY') || ' foi preparado.','/schedule' from public.member_accounts where active;
  end if;
 end if;
 if tg_op = 'DELETE' then return old; else return new; end if;
end $$;
revoke all on function private.notify_schedule_changes() from public, anon, authenticated;
create trigger notify_schedule_changes after insert or update or delete on public.monthly_schedules for each row execute function private.notify_schedule_changes();
create or replace function public.notify_monthly_schedule(p_year integer,p_month integer) returns integer language plpgsql security definer set search_path='' as $$
declare n integer; first_day date;
begin
 if not private.is_app_admin() then raise exception 'Somente administradores podem notificar' using errcode='42501'; end if;
 if p_year not between 2000 and 2100 or p_month not between 1 and 12 then raise exception 'Mês inválido' using errcode='22023'; end if;
 first_day := make_date(p_year,p_month,1);
 if not exists(select 1 from public.monthly_schedules where (date at time zone 'America/Sao_Paulo')::date >= first_day and (date at time zone 'America/Sao_Paulo')::date < (first_day + interval '1 month')::date) then raise exception 'Não há escalas neste mês' using errcode='22023'; end if;
 insert into public.notifications(user_id,title,body,href) select user_id,'Nova escala disponível','A escala de ' || lpad(p_month::text,2,'0') || '/' || p_year || ' está disponível.','/monthly-schedule' from public.member_accounts where active;
 get diagnostics n = row_count; return n;
end $$;
revoke all on function public.notify_monthly_schedule(integer,integer) from public, anon;
grant execute on function public.notify_monthly_schedule(integer,integer) to authenticated;
notify pgrst, 'reload schema';
commit;
