begin;
alter table public.app_settings add column if not exists notification_settings jsonb not null default '{"schedule_changes":true,"new_playlists":true,"monthly_schedule":true,"swap_requests":true,"meeting_changes":true}'::jsonb;

create or replace function private.notification_enabled(p_key text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select (notification_settings ->> p_key)::boolean from public.app_settings where id = 'settings'), true)
$$;
revoke all on function private.notification_enabled(text) from public, anon, authenticated;

create or replace function public.send_test_notification() returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.member_accounts where user_id=auth.uid() and active and not must_change_password) then raise exception 'Acesso inválido' using errcode='42501'; end if;
 insert into public.notifications(user_id,title,body,href) values(auth.uid(),'Teste de notificações','As notificações push estão funcionando neste dispositivo.','/settings');
end $$;
revoke all on function public.send_test_notification() from public, anon;
grant execute on function public.send_test_notification() to authenticated;
notify pgrst, 'reload schema';
commit;
