export function clampPostContent(raw: string) {
  return raw.trim().slice(0, 2000);
}

export function clampPersonName(raw: string) {
  return raw.replace(/\s+/g, " ").trim().slice(0, 80);
}

export function normalizeStudentPhone(raw: string) {
  return raw.replace(/\s+/g, " ").trim().slice(0, 32);
}

export const STUDENT_LIVE_SQL = `
create or replace function public.add_my_post(p_content text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_academy uuid := public.current_academy_id();
  v_name text;
  v_role text;
  v_body text := nullif(trim(p_content), '');
begin
  if auth.uid() is null then
    raise exception 'Entre de novo.';
  end if;
  if v_academy is null then
    raise exception 'Academia não encontrada.';
  end if;
  if v_body is null or char_length(v_body) < 2 then
    raise exception 'Escreva o recado.';
  end if;
  if char_length(v_body) > 2000 then
    raise exception 'Recado longo demais.';
  end if;

  select p.name, p.role into v_name, v_role
  from public.profiles p
  where p.id = auth.uid();

  insert into public.posts (academy_id, author_id, author_name, author_role, content)
  values (
    v_academy,
    auth.uid(),
    coalesce(nullif(v_name, ''), 'Aluno'),
    coalesce(v_role, 'student'),
    v_body
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.add_my_post(text) from public;
grant execute on function public.add_my_post(text) to authenticated;

create or replace function public.toggle_my_post_like(p_post_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_academy uuid := public.current_academy_id();
begin
  if auth.uid() is null then
    raise exception 'Entre de novo.';
  end if;
  if not exists (
    select 1 from public.posts p
    where p.id = p_post_id and p.academy_id = v_academy
  ) then
    raise exception 'Recado não encontrado.';
  end if;

  delete from public.post_likes
  where post_id = p_post_id and profile_id = auth.uid();
  if found then
    return false;
  end if;

  insert into public.post_likes (post_id, profile_id)
  values (p_post_id, auth.uid());
  return true;
end;
$$;

revoke all on function public.toggle_my_post_like(uuid) from public;
grant execute on function public.toggle_my_post_like(uuid) to authenticated;

create or replace function public.remove_my_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_academy uuid := public.current_academy_id();
begin
  if auth.uid() is null then
    raise exception 'Entre de novo.';
  end if;
  delete from public.posts p
  where p.id = p_post_id
    and p.academy_id = v_academy
    and (
      p.author_id = auth.uid()
      or public.is_academy_staff()
    );
  if not found then
    raise exception 'Não deu para apagar este recado.';
  end if;
end;
$$;

revoke all on function public.remove_my_post(uuid) from public;
grant execute on function public.remove_my_post(uuid) to authenticated;

create or replace function public.toggle_my_rsvp(p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := public.current_student_id();
  v_academy uuid := public.current_academy_id();
begin
  if auth.uid() is null then
    raise exception 'Entre de novo.';
  end if;
  if v_student is null then
    raise exception 'Sua ficha ainda não está na academia.';
  end if;
  if not exists (
    select 1 from public.events e
    where e.id = p_event_id and e.academy_id = v_academy
  ) then
    raise exception 'Evento não encontrado.';
  end if;

  delete from public.event_rsvps
  where event_id = p_event_id and student_id = v_student;
  if found then
    return false;
  end if;

  insert into public.event_rsvps (event_id, student_id)
  values (p_event_id, v_student);
  return true;
end;
$$;

revoke all on function public.toggle_my_rsvp(uuid) from public;
grant execute on function public.toggle_my_rsvp(uuid) to authenticated;

drop function if exists public.update_my_student_profile(text);

create or replace function public.update_my_student_profile(p_phone text, p_name text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := nullif(trim(p_phone), '');
  v_name text := nullif(trim(p_name), '');
begin
  if auth.uid() is null then
    raise exception 'Entre de novo.';
  end if;
  if v_name is not null and char_length(v_name) < 2 then
    raise exception 'Informe o seu nome.';
  end if;
  if v_name is not null and char_length(v_name) > 80 then
    raise exception 'Nome longo demais.';
  end if;
  update public.profiles
    set phone = v_phone,
        name = coalesce(v_name, name)
    where id = auth.uid();
  update public.students
    set phone = coalesce(v_phone, phone),
        name = coalesce(v_name, name)
    where user_id = auth.uid()
      and academy_id = public.current_academy_id();
end;
$$;

revoke all on function public.update_my_student_profile(text, text) from public;
grant execute on function public.update_my_student_profile(text, text) to authenticated;
`;
