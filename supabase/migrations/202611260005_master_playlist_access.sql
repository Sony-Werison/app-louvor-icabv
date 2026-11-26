begin;
alter table public.member_accounts add column if not exists is_master boolean not null default false;
create or replace function public.update_own_playlist(p_schedule_id text, p_period text, p_playlist text[])
returns void language plpgsql security definer set search_path = '' as $$
declare account public.member_accounts%rowtype; meeting public.monthly_schedules%rowtype;
begin
  select * into account from public.member_accounts where user_id = auth.uid() and active;
  if not found or account.must_change_password then
    raise exception 'Entre com sua conta e defina sua senha primeiro' using errcode = '42501';
  end if;
  if p_period is null or p_period not in ('manha','noite') or p_playlist is null
      or cardinality(p_playlist) > 1000 or array_position(p_playlist, null) is not null then
    raise exception 'Repertório ou período inválido' using errcode = '22023';
  end if;
  select * into meeting from public.monthly_schedules where id = p_schedule_id for update;
  if not found then raise exception 'Escala não encontrada'; end if;
  if not account.is_master and not coalesce((meeting.assignments -> ('abertura_' || p_period)) ->> 0 = account.member_id, false) then
    raise exception 'Você só pode editar o repertório da sua própria abertura' using errcode = '42501';
  end if;
  if exists (select 1 from unnest(p_playlist) as requested(song_id)
      where not exists (select 1 from public.songs s where s.id = requested.song_id)) then
    raise exception 'Música desconhecida' using errcode = '22023';
  end if;
  if p_period = 'manha' then
    update public.monthly_schedules set playlist_manha = p_playlist where id = p_schedule_id;
  else
    update public.monthly_schedules set playlist_noite = p_playlist where id = p_schedule_id;
  end if;
end $$;
revoke all on function public.update_own_playlist(text,text,text[]) from public, anon;
grant execute on function public.update_own_playlist(text,text,text[]) to authenticated;


notify pgrst, 'reload schema';
commit;
