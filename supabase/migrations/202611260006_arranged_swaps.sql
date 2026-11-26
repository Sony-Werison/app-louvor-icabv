begin;
create table public.arranged_swaps (
 id bigint generated always as identity primary key,
 requester uuid not null references auth.users(id),
 requester_member text not null references public.members(id),
 recipient uuid not null references auth.users(id),
 recipient_member text not null references public.members(id),
 schedule_id text not null references public.monthly_schedules(id) on delete cascade,
 column_id text not null,
 slot integer not null check(slot between 0 and 1),
 target_schedule_id text not null references public.monthly_schedules(id) on delete cascade,
 target_column_id text not null,
 target_slot integer not null check(target_slot between 0 and 1),
 state text not null default 'pending' check(state in ('pending','accepted','declined','cancelled')),
 created_at timestamptz not null default now(), resolved_at timestamptz,
 check(requester <> recipient), check(schedule_id <> target_schedule_id)
);
create unique index arranged_pending_source on public.arranged_swaps(schedule_id,column_id,slot) where state='pending';
alter table public.arranged_swaps enable row level security;
revoke all on public.arranged_swaps from public,anon,authenticated;
grant select on public.arranged_swaps to authenticated;
create policy arranged_read_participants on public.arranged_swaps for select to authenticated using (
 (auth.uid()=requester or auth.uid()=recipient) and exists(select 1 from public.member_accounts where user_id=auth.uid() and active and not must_change_password)
);

create or replace function public.request_arranged_swap(p_schedule text,p_column text,p_slot integer,p_target text,p_target_column text,p_target_slot integer)
returns void language plpgsql security definer set search_path='' as $$
declare a public.member_accounts%rowtype; b public.member_accounts%rowtype; s public.monthly_schedules%rowtype; t public.monthly_schedules%rowtype; role_name text; person text;
begin
 select * into a from public.member_accounts where user_id=auth.uid() and active and not must_change_password;
 if not found then raise exception 'Acesso inválido' using errcode='42501'; end if;
 role_name := case when p_column in ('abertura_manha','abertura_noite') then 'Abertura' when p_column in ('pregacao_manha','pregacao_noite') then 'Pregação' when p_column='multimedia' then 'Multimídia' end;
 if role_name is null or p_target_column is null or (case when p_target_column in ('abertura_manha','abertura_noite') then 'Abertura' when p_target_column in ('pregacao_manha','pregacao_noite') then 'Pregação' when p_target_column='multimedia' then 'Multimídia' else '' end)<>role_name or p_slot is null or p_target_slot is null or p_slot not between 0 and 1 or p_target_slot not between 0 and 1 or p_schedule=p_target then raise exception 'Escolha outra data para a mesma função'; end if;
 perform 1 from public.monthly_schedules where id in (p_schedule,p_target) order by id for update;
 select * into s from public.monthly_schedules where id=p_schedule;
 if not found or s.date<now() or (s.assignments->p_column->>p_slot) is distinct from a.member_id then raise exception 'Sua atribuição mudou'; end if;
 select * into t from public.monthly_schedules where id=p_target;
 if not found or t.date<now() then raise exception 'Data indisponível'; end if;
 if (p_column like '%manha' and coalesce(s.status_manha,'scheduled')<>'scheduled') or (p_column like '%noite' and coalesce(s.status_noite,'scheduled')<>'scheduled') or (p_target_column like '%manha' and coalesce(t.status_manha,'scheduled')<>'scheduled') or (p_target_column like '%noite' and coalesce(t.status_noite,'scheduled')<>'scheduled') then raise exception 'Reunião indisponível'; end if;
 select * into b from public.member_accounts where member_id=t.assignments->p_target_column->>p_target_slot and active and not must_change_password;
 if not found or b.user_id=a.user_id then raise exception 'Escolha outro membro com acesso ativo'; end if;
 if not exists(select 1 from public.members where id=a.member_id and roles ? role_name) or not exists(select 1 from public.members where id=b.member_id and roles ? role_name) then raise exception 'Ambos precisam ter a função desta atribuição'; end if;
 insert into public.arranged_swaps(requester,requester_member,recipient,recipient_member,schedule_id,column_id,slot,target_schedule_id,target_column_id,target_slot)
 values(a.user_id,a.member_id,b.user_id,b.member_id,s.id,p_column,p_slot,t.id,p_target_column,p_target_slot);
 select name into person from public.members where id=a.member_id;
 insert into public.notifications(user_id,title,body,href) values(b.user_id,'Pedido de troca',person || ' propôs trocar a atribuição de ' || to_char(s.date at time zone 'America/Sao_Paulo','DD/MM/YYYY') || ' pela sua de ' || to_char(t.date at time zone 'America/Sao_Paulo','DD/MM/YYYY') || '. Confirme no aplicativo.','/trocas');
end $$;

create or replace function public.respond_arranged_swap(p_id bigint,p_action text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.arranged_swaps%rowtype; rid bigint; t public.monthly_schedules%rowtype;
begin
 if not exists(select 1 from public.member_accounts where user_id=auth.uid() and active and not must_change_password) then raise exception 'Acesso inválido' using errcode='42501'; end if;
 select * into r from public.arranged_swaps where id=p_id for update;
 if not found or r.state<>'pending' then raise exception 'Pedido indisponível'; end if;
 if p_action='cancel' and r.requester=auth.uid() then
  update public.arranged_swaps set state='cancelled',resolved_at=now() where id=r.id;
 elsif p_action='decline' and r.recipient=auth.uid() then
  update public.arranged_swaps set state='declined',resolved_at=now() where id=r.id;
  insert into public.notifications(user_id,title,body,href) values(r.requester,'Pedido de troca','A troca combinada não foi aceita. Sua escala permanece igual.','/trocas');
 elsif p_action='accept' and r.recipient=auth.uid() then
  perform 1 from public.monthly_schedules where id in (r.schedule_id,r.target_schedule_id) order by id for update;
  select * into t from public.monthly_schedules where id=r.target_schedule_id;
  if (t.assignments->r.target_column_id->>r.target_slot) is distinct from r.recipient_member then raise exception 'A atribuição escolhida mudou'; end if;
  if exists(select 1 from public.swap_requests where schedule_id=r.schedule_id and column_id=r.column_id and slot=r.slot and state='open') then raise exception 'Cancele o pedido aberto de substituição antes de confirmar esta troca'; end if;
  insert into public.swap_requests(requester,requester_member,schedule_id,column_id,slot) values(r.requester,r.requester_member,r.schedule_id,r.column_id,r.slot) returning id into rid;
  perform public.accept_schedule_swap(rid,'swap',r.target_schedule_id,r.target_column_id);
  update public.arranged_swaps set state='accepted',resolved_at=now() where id=r.id;
 else raise exception 'Sem permissão para responder a este pedido' using errcode='42501'; end if;
end $$;
revoke all on function public.request_arranged_swap(text,text,integer,text,text,integer) from public,anon;
revoke all on function public.respond_arranged_swap(bigint,text) from public,anon;
grant execute on function public.request_arranged_swap(text,text,integer,text,text,integer) to authenticated;
grant execute on function public.respond_arranged_swap(bigint,text) to authenticated;
notify pgrst,'reload schema';
commit;
