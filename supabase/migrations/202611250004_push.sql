begin;
create extension if not exists pg_net with schema extensions;
create table if not exists public.push_subscriptions (
 endpoint text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 keys jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from public, anon, authenticated;
grant all on public.push_subscriptions to service_role;
create index if not exists push_subscriptions_user_id on public.push_subscriptions(user_id);
create table if not exists private.push_configuration (id boolean primary key default true check (id), secret text not null);
alter table private.push_configuration enable row level security;
revoke all on private.push_configuration from public, anon, authenticated;
create or replace function private.dispatch_push_notification() returns trigger language plpgsql security definer set search_path = '' as $$
declare secret_value text;
begin
 select secret into secret_value from private.push_configuration where id;
 if secret_value is not null then
  perform net.http_post(url := 'https://app-louvor-icabv.vercel.app/api/push/deliver', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || secret_value), body := jsonb_build_object('id',new.id));
 end if;
 return new;
end $$;
revoke all on function private.dispatch_push_notification() from public,anon,authenticated;
drop trigger if exists dispatch_push_notification on public.notifications;
create trigger dispatch_push_notification after insert on public.notifications for each row execute function private.dispatch_push_notification();
notify pgrst, 'reload schema';
commit;
