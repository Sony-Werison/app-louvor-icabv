begin;
create table public.swap_requests (
 id bigint generated always as identity primary key,
 requester uuid not null references auth.users(id) on delete cascade,
 requester_member text not null references public.members(id) on delete cascade,
 schedule_id text not null references public.monthly_schedules(id) on delete cascade,
 column_id text not null check (column_id in ('abertura_manha','abertura_noite','pregacao_manha','pregacao_noite','multimedia')),
 slot integer not null check (slot between 0 and 1),
 state text not null default 'open' check(state in ('open','accepted','cancelled')),
 accepted_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), resolved_at timestamptz
);
create unique index swap_open_slot on public.swap_requests(schedule_id,column_id,slot) where state='open';
alter table public.swap_requests enable row level security;
revoke all on public.swap_requests from anon,authenticated;
grant select on public.swap_requests to authenticated;
create policy swaps_read on public.swap_requests for select to authenticated using (exists(select 1 from public.member_accounts a where a.user_id=auth.uid() and a.active and not a.must_change_password));
create or replace function public.request_schedule_swap(p_schedule_id text,p_column text,p_slot integer) returns bigint language plpgsql security definer set search_path='' as $$
declare a public.member_accounts%rowtype; s public.monthly_schedules%rowtype; rid bigint; person text;
begin
 select * into a from public.member_accounts where user_id=auth.uid() and active and not must_change_password;
 if not found then raise exception 'Acesso inválido' using errcode='42501'; end if;
 if p_column not in ('abertura_manha','abertura_noite','pregacao_manha','pregacao_noite','multimedia') or p_slot not between 0 and 1 then raise exception 'Atribuição inválida'; end if;
 select * into s from public.monthly_schedules where id=p_schedule_id for update;
 if not found or s.date < now() or (s.assignments -> p_column ->> p_slot) is distinct from a.member_id then raise exception 'A atribuição não está mais disponível'; end if;
 if (p_column like '%manha' and s.status_manha <> 'scheduled') or (p_column like '%noite' and s.status_noite <> 'scheduled') then raise exception 'Reunião indisponível'; end if;
 insert into public.swap_requests(requester,requester_member,schedule_id,column_id,slot) values(a.user_id,a.member_id,p_schedule_id,p_column,p_slot) returning id into rid;
 select name into person from public.members where id=a.member_id;
 insert into public.notifications(user_id,title,body,href) select user_id,'Pedido de troca',coalesce(person,'Um membro') || ' precisa de alguém para uma atribuição em ' || to_char(s.date at time zone 'America/Sao_Paulo','DD/MM/YYYY') || '.','/trocas' from public.member_accounts where active and user_id<>a.user_id;
 return rid;
end $$;
create or replace function public.accept_schedule_swap(p_request bigint,p_mode text,p_target_schedule text default null,p_target_column text default null) returns void language plpgsql security definer set search_path='' as $$
declare a public.member_accounts%rowtype; r public.swap_requests%rowtype; s public.monthly_schedules%rowtype; t public.monthly_schedules%rowtype; idx integer; required_role text; roles jsonb; who text;
begin
 select * into a from public.member_accounts where user_id=auth.uid() and active and not must_change_password;
 if not found then raise exception 'Acesso inválido' using errcode='42501'; end if;
 select * into r from public.swap_requests where id=p_request for update;
 if not found or r.state<>'open' or r.requester=a.user_id then raise exception 'Pedido indisponível'; end if;
 if p_mode not in ('assume','swap') then raise exception 'Modo inválido'; end if;
 required_role := case when r.column_id like 'abertura_%' then 'Abertura' when r.column_id like 'pregacao_%' then 'Pregação' else 'Multimídia' end;
 select m.roles into roles from public.members m where m.id=a.member_id;
 if not coalesce(roles ? required_role,false) and not (required_role='Pregação' and coalesce(roles ? 'Convidado',false)) then raise exception 'Você não possui a função desta atribuição' using errcode='42501'; end if;
 if p_mode='swap' and (p_target_schedule is null or p_target_schedule=r.schedule_id or p_target_column is null or p_target_column not in ('abertura_manha','abertura_noite','pregacao_manha','pregacao_noite','multimedia') or (case when p_target_column like 'abertura_%' then 'Abertura' when p_target_column like 'pregacao_%' then 'Pregação' when p_target_column='multimedia' then 'Multimídia' else '' end)<>required_role) then raise exception 'Escolha outra data para a mesma função'; end if;
 perform 1 from public.monthly_schedules where id in (r.schedule_id,p_target_schedule) order by id for update;
 select * into s from public.monthly_schedules where id=r.schedule_id;
 if not found or s.date < now() or (s.assignments -> r.column_id ->> r.slot) is distinct from r.requester_member then raise exception 'A escala original mudou'; end if;
 if (r.column_id like '%manha' and s.status_manha <> 'scheduled') or (r.column_id like '%noite' and s.status_noite <> 'scheduled') then raise exception 'Reunião indisponível'; end if;
 if p_mode='swap' then
  select * into t from public.monthly_schedules where id=p_target_schedule;
  if not found or t.date < now() or (p_target_column like '%manha' and t.status_manha <> 'scheduled') or (p_target_column like '%noite' and t.status_noite <> 'scheduled') then raise exception 'Data de troca indisponível'; end if;
  select (ord-1)::integer into idx from jsonb_array_elements_text(coalesce(t.assignments->p_target_column,'[]'::jsonb)) with ordinality q(v,ord) where v=a.member_id order by ord limit 1;
  if idx is null then raise exception 'Você não está escalado na data escolhida'; end if;
  update public.monthly_schedules set assignments=jsonb_set(assignments,array[p_target_column,idx::text],to_jsonb(r.requester_member),false) where id=t.id;
 end if;
 update public.monthly_schedules set assignments=jsonb_set(assignments,array[r.column_id,r.slot::text],to_jsonb(a.member_id),false) where id=s.id;
 update public.swap_requests set state='accepted',accepted_by=a.user_id,resolved_at=now() where id=r.id;
 select name into who from public.members where id=a.member_id;
 insert into public.notifications(user_id,title,body,href) values(r.requester,'Pedido de troca aceito',coalesce(who,'Um membro') || case when p_mode='swap' then ' trocou a data com você.' else ' assumiu sua atribuição.' end,'/monthly-schedule');
end $$;
revoke all on function public.request_schedule_swap(text,text,integer) from public,anon;
revoke all on function public.accept_schedule_swap(bigint,text,text,text) from public,anon;
create or replace function public.cancel_schedule_swap(p_request bigint) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.member_accounts where user_id=auth.uid() and active and not must_change_password) then raise exception 'Acesso inválido' using errcode='42501'; end if;
 update public.swap_requests set state='cancelled',resolved_at=now() where id=p_request and requester=auth.uid() and state='open';
 if not found then raise exception 'Pedido indisponível'; end if;
end $$;
revoke all on function public.cancel_schedule_swap(bigint) from public,anon;
grant execute on function public.cancel_schedule_swap(bigint) to authenticated;
grant execute on function public.request_schedule_swap(text,text,integer) to authenticated;
grant execute on function public.accept_schedule_swap(bigint,text,text,text) to authenticated;
notify pgrst,'reload schema';
commit;
