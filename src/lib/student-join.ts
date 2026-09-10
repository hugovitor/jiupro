import { firstName, waHref } from "@/lib/whatsapp";
import { publicAppUrl } from "@/lib/app-url";
import { looksLikeHouseCode, studentJoinUrl } from "@/lib/join-code";
import type { Academy, Student } from "@/lib/types";

export type PublicAcademyJoin = {
  name: string;
  city: string;
  state: string;
  slug: string;
  joinCode: string;
};

export function mapPublicHouse(row: Record<string, unknown>): PublicAcademyJoin {
  const slug = String(row.slug ?? "").trim();
  const join = String(row.join_code ?? "").trim();
  return {
    name: String(row.name ?? "").trim(),
    city: String(row.city ?? "").trim(),
    state: String(row.state ?? "").trim(),
    slug,
    joinCode: join || slug,
  };
}

export function preferredJoinCode(house: Pick<PublicAcademyJoin, "joinCode" | "slug">) {
  const join = house.joinCode.trim();
  if (looksLikeHouseCode(join)) return join.toUpperCase();
  return house.slug.trim() || join;
}

export const STUDENT_JOIN_NOT_FOUND =
  "Não achamos essa academia. Confira o nome ou peça o WhatsApp da academia.";

export const STUDENT_JOIN_SETUP_ERROR =
  "O app da academia ainda está sendo preparado. Fale com o professor ou no WhatsApp de suporte.";

export function isStudentJoinNotFound(message?: string) {
  return /(casa|academia) não encontrada/i.test(message ?? "");
}

export const STUDENT_JOIN_SQL = `-- App do aluno: código da academia + vínculo da ficha.
create or replace function public.jiupro_join_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text;
  i int;
begin
  loop
    result := '';
    for i in 1..6 loop
      result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.academies where join_code = result);
  end loop;
  return result;
end;
$$;

alter table public.academies add column if not exists join_code text;

create or replace function public.academies_fill_join_code()
returns trigger
language plpgsql
as $$
begin
  if new.join_code is null or new.join_code = '' then
    if tg_op = 'INSERT' or old.join_code is null or old.join_code = '' then
      new.join_code := public.jiupro_join_code();
    else
      new.join_code := old.join_code;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists academies_fill_join_code on public.academies;
create trigger academies_fill_join_code
  before insert or update on public.academies
  for each row execute function public.academies_fill_join_code();

update public.academies
  set join_code = public.jiupro_join_code()
  where join_code is null or join_code = '';
create unique index if not exists academies_join_code_uidx on public.academies (join_code);

create or replace function public.lookup_academy_join(p_code text)
returns table (name text, city text, state text, slug text, join_code text)
language sql
stable
security definer
set search_path = public
as $$
  select a.name, a.city, a.state, a.slug, coalesce(nullif(a.join_code, ''), a.slug) as join_code
  from public.academies a
  where upper(trim(coalesce(a.join_code, ''))) = upper(trim(p_code))
     or lower(a.slug) = lower(trim(p_code))
     or lower(trim(a.name)) = lower(trim(p_code))
     or (
       length(regexp_replace(lower(trim(p_code)), '[^a-z0-9]', '', 'g')) >= 2
       and regexp_replace(lower(a.name), '[^a-z0-9]', '', 'g')
         = regexp_replace(lower(trim(p_code)), '[^a-z0-9]', '', 'g')
     )
     or (
       length(regexp_replace(lower(trim(p_code)), '[^a-z0-9]', '', 'g')) >= 2
       and regexp_replace(lower(a.slug), '[^a-z0-9]', '', 'g')
         = regexp_replace(lower(trim(p_code)), '[^a-z0-9]', '', 'g')
     )
  order by
    case
      when upper(trim(coalesce(a.join_code, ''))) = upper(trim(p_code)) then 0
      when lower(a.slug) = lower(trim(p_code)) then 1
      else 2
    end,
    a.created_at asc
  limit 1;
$$;

revoke all on function public.lookup_academy_join(text) from public;
grant execute on function public.lookup_academy_join(text) to anon, authenticated;

create or replace function public.search_academy_join(p_query text)
returns table (name text, city text, state text, slug text, join_code text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_q text := trim(p_query);
  v_like text;
begin
  if v_q is null or length(v_q) < 2 then
    return;
  end if;
  v_like := '%' || replace(replace(v_q, '%', ''), '_', '') || '%';
  return query
  select a.name, a.city, a.state, a.slug, coalesce(nullif(a.join_code, ''), a.slug)
  from public.academies a
  where upper(trim(coalesce(a.join_code, ''))) = upper(v_q)
     or lower(a.slug) = lower(v_q)
     or a.name ilike v_like
     or coalesce(a.city, '') ilike v_like
     or (
       length(regexp_replace(lower(v_q), '[^a-z0-9]', '', 'g')) >= 2
       and regexp_replace(lower(a.name), '[^a-z0-9]', '', 'g')
         like '%' || regexp_replace(lower(v_q), '[^a-z0-9]', '', 'g') || '%'
     )
  order by
    case
      when upper(trim(coalesce(a.join_code, ''))) = upper(v_q) then 0
      when lower(a.slug) = lower(v_q) then 1
      when lower(a.name) = lower(v_q) then 2
      when a.name ilike v_q || '%' then 3
      else 4
    end,
    a.created_at asc,
    a.name
  limit 8;
end;
$$;

revoke all on function public.search_academy_join(text) from public;
grant execute on function public.search_academy_join(text) to anon, authenticated;

create or replace function public.join_academy_as_student(
  p_code text,
  p_name text,
  p_phone text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(trim(coalesce(auth.jwt()->>'email', '')));
  v_q text := trim(p_code);
  v_academy uuid;
  v_student uuid;
  v_phone text;
  v_claimed uuid;
  v_profile_academy uuid;
  v_profile_role text;
  v_label text;
begin
  if v_uid is null then
    raise exception 'Entre de novo para criar o acesso.';
  end if;

  if v_q is null or v_q = '' then
    raise exception 'Academia não encontrada. Busque o nome da sua academia.';
  end if;

  select a.id into v_academy
  from public.academies a
  where upper(trim(coalesce(a.join_code, ''))) = upper(v_q)
     or lower(a.slug) = lower(v_q)
     or lower(trim(a.name)) = lower(v_q)
     or (
       length(regexp_replace(lower(v_q), '[^a-z0-9]', '', 'g')) >= 2
       and regexp_replace(lower(a.name), '[^a-z0-9]', '', 'g')
         = regexp_replace(lower(v_q), '[^a-z0-9]', '', 'g')
     )
     or (
       length(regexp_replace(lower(v_q), '[^a-z0-9]', '', 'g')) >= 2
       and regexp_replace(lower(a.slug), '[^a-z0-9]', '', 'g')
         = regexp_replace(lower(v_q), '[^a-z0-9]', '', 'g')
     )
  order by
    case
      when upper(trim(coalesce(a.join_code, ''))) = upper(v_q) then 0
      when lower(a.slug) = lower(v_q) then 1
      else 2
    end,
    a.created_at asc
  limit 1;

  if v_academy is null then
    raise exception 'Academia não encontrada. Busque o nome da sua academia.';
  end if;

  update public.academies
    set join_code = public.jiupro_join_code()
    where id = v_academy and (join_code is null or join_code = '');

  select p.academy_id, p.role into v_profile_academy, v_profile_role
  from public.profiles p
  where p.id = v_uid;

  if found then
    if v_profile_role is distinct from 'student' then
      raise exception 'Este e-mail já é da equipe da academia. Use outro e-mail no app do aluno.';
    end if;
    if v_profile_academy is not null and v_profile_academy is distinct from v_academy then
      raise exception 'Este e-mail já pertence a outra academia. Use outro e-mail no app do aluno.';
    end if;
  end if;

  v_phone := regexp_replace(coalesce(p_phone, ''), '\\D', '', 'g');
  v_label := nullif(trim(p_name), '');

  select s.id, s.user_id into v_student, v_claimed
  from public.students s
  where s.academy_id = v_academy and s.user_id = v_uid
  limit 1;

  if v_student is null and v_email <> '' then
    select s.id, s.user_id into v_student, v_claimed
    from public.students s
    where s.academy_id = v_academy
      and lower(trim(coalesce(s.email, ''))) = v_email
    order by s.created_at asc
    limit 1;
  end if;

  if v_student is null and length(v_phone) >= 10 then
    select s.id, s.user_id into v_student, v_claimed
    from public.students s
    where s.academy_id = v_academy
      and regexp_replace(coalesce(s.phone, ''), '\\D', '', 'g') in (v_phone, '55' || v_phone)
    order by s.created_at asc
    limit 1;
  end if;

  if v_student is not null and v_claimed is not null and v_claimed <> v_uid then
    raise exception 'Essa ficha já tem acesso. Entre com o e-mail e a senha que você criou.';
  end if;

  if exists (select 1 from public.profiles where id = v_uid) then
    update public.profiles
    set
      academy_id = v_academy,
      role = 'student',
      name = coalesce(nullif(name, ''), v_label, split_part(v_email, '@', 1), 'Aluno'),
      email = case when email is null or email = '' then v_email else email end,
      phone = case when phone is null or phone = '' then nullif(trim(p_phone), '') else phone end
    where id = v_uid;
  else
    insert into public.profiles (id, academy_id, name, role, email, phone)
    values (
      v_uid,
      v_academy,
      coalesce(v_label, split_part(v_email, '@', 1), 'Aluno'),
      'student',
      v_email,
      nullif(trim(p_phone), '')
    );
  end if;

  if v_student is not null then
    update public.students
    set
      user_id = v_uid,
      email = case when email is null or email = '' then v_email else email end,
      phone = case when phone is null or phone = '' then nullif(trim(p_phone), '') else phone end
    where id = v_student;
  else
    insert into public.students (
      academy_id, user_id, name, email, phone, division, belt, status, monthly_fee
    ) values (
      v_academy,
      v_uid,
      coalesce(v_label, split_part(v_email, '@', 1), 'Aluno'),
      nullif(v_email, ''),
      nullif(trim(p_phone), ''),
      'adult',
      'white',
      'active',
      0
    );
  end if;

  return v_academy;
end;
$$;

revoke all on function public.join_academy_as_student(text, text, text) from public;
grant execute on function public.join_academy_as_student(text, text, text) to authenticated;

create or replace function public.register_academy(
  p_name text,
  p_slug text,
  p_city text,
  p_state text,
  p_plan text,
  p_owner_name text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_slug text := p_slug;
  v_name_key text := regexp_replace(lower(trim(coalesce(p_name, ''))), '[^a-z0-9]', '', 'g');
  v_city_key text := regexp_replace(lower(trim(coalesce(p_city, ''))), '[^a-z0-9]', '', 'g');
  v_profile_academy uuid;
  v_profile_role text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select p.academy_id, p.role into v_profile_academy, v_profile_role
  from public.profiles p
  where p.id = auth.uid();

  if found then
    if v_profile_academy is not null then
      return v_profile_academy;
    end if;
    if v_profile_role = 'student' then
      raise exception 'Este e-mail já é de um aluno. Use outro e-mail para a academia.';
    end if;
  end if;

  select a.id into v_id
  from public.academies a
  where lower(a.slug) = lower(trim(v_slug))
     or (
       v_name_key <> ''
       and regexp_replace(lower(trim(a.name)), '[^a-z0-9]', '', 'g') = v_name_key
       and (
         v_city_key = ''
         or regexp_replace(lower(trim(coalesce(a.city, ''))), '[^a-z0-9]', '', 'g') = v_city_key
       )
     )
  order by a.created_at asc
  limit 1;

  if v_id is not null then
    insert into public.profiles (id, academy_id, name, role, email)
    values (
      auth.uid(),
      v_id,
      p_owner_name,
      'owner',
      coalesce(auth.jwt()->>'email', '')
    )
    on conflict (id) do update
      set academy_id = excluded.academy_id,
          role = 'owner',
          name = coalesce(nullif(public.profiles.name, ''), excluded.name),
          email = coalesce(nullif(public.profiles.email, ''), excluded.email);
    return v_id;
  end if;

  if exists (select 1 from public.academies where slug = v_slug) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end if;
  insert into public.academies (name, slug, city, state, plan, pix_name, join_code)
  values (p_name, v_slug, p_city, p_state, coalesce(p_plan, 'essencial'), p_name, public.jiupro_join_code())
  returning id into v_id;
  insert into public.profiles (id, academy_id, name, role, email)
  values (
    auth.uid(),
    v_id,
    p_owner_name,
    'owner',
    coalesce(auth.jwt()->>'email', '')
  )
  on conflict (id) do update
    set academy_id = excluded.academy_id,
        role = 'owner',
        name = coalesce(nullif(public.profiles.name, ''), excluded.name),
        email = coalesce(nullif(public.profiles.email, ''), excluded.email);
  return v_id;
end;
$$;

revoke all on function public.register_academy(text, text, text, text, text, text) from public;
grant execute on function public.register_academy(text, text, text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
`;

export function studentAppInviteMessage(academy: Academy, student?: Pick<Student, "name" | "email">) {
  const who = student ? firstName(student.name) : "professor";
  const link = studentJoinUrl(academy.joinCode || academy.slug);
  if (student) {
    const emailHint = student.email?.trim()
      ? `Usa o e-mail ${student.email.trim()} (o mesmo da ficha) e cria a senha.`
      : "Usa o mesmo e-mail ou WhatsApp da ficha e cria a senha.";
    return `Fala, ${who}.

Sua ficha já está na ${academy.name}.

Abre este link, confirma o nome da academia e cria tua senha:

${link}

${emailHint}

Já criou senha? Entra em ${publicAppUrl()}/login.`;
  }
  return `Fala.

App da ${academy.name}:

${link}

Se a academia já te cadastrou, confirma o nome da academia e cria a senha com o mesmo e-mail ou WhatsApp da ficha.

Se ainda não te cadastrou, busca o nome da academia nessa tela e se cadastra — sua ficha aparece na lista da academia.`;
}

export function studentAppInviteHref(
  academy: Academy,
  phone: string,
  student?: Pick<Student, "name" | "email">,
) {
  return waHref(phone, studentAppInviteMessage(academy, student));
}
