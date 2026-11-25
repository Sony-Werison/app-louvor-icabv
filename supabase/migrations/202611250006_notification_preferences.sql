begin;
alter table public.app_settings add column if not exists notification_settings jsonb not null default '{"schedule_changes":true,"new_playlists":true,"monthly_schedule":true,"swap_requests":true,"meeting_changes":true}'::jsonb;

create or replace function private.notification_enabled(p_key text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select (notification_settings ->> p_key)::boolean from public.app_settings where id = 'settings'), true)
$$;
revoke all on function private.notification_enabled(text) from public, anon, authenticated;

create or replace function private.filter_disabled_notification() returns trigger language plpgsql security definer set search_path='' as $$
declare k text;
begin
 k := case when new.title = 'Alteração na sua escala' then 'schedule_changes'
           when new.title = 'Novo repertório disponível' then 'new_playlists'
           when new.title = 'Nova escala disponível' then 'monthly_schedule'
           when new.title = 'Pedido de troca' or new.title = 'Pedido de troca aceito' then 'swap_requests'
           when new.title like 'Alteração%reunião%' then 'meeting_changes' else null end;
 if k is not null and not private.notification_enabled(k) then return null; end if;
 return new;
end $$;
drop trigger if exists filter_disabled_notification on public.notifications;
create trigger filter_disabled_notification before insert on public.notifications for each row execute function private.filter_disabled_notification();
revoke all on function private.filter_disabled_notification() from public, anon, authenticated;

create or replace function public.send_test_notification() returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.member_accounts where user_id=auth.uid() and active and not must_change_password) then raise exception 'Acesso inválido' using errcode='42501'; end if;
 insert into public.notifications(user_id,title,body,href) values(auth.uid(),'Teste de notificações','As notificações push estão funcionando neste dispositivo.','/settings');
end $$;
revoke all on function public.send_test_notification() from public, anon;
grant execute on function public.send_test_notification() to authenticated;
notify pgrst, 'reload schema';
commit;
