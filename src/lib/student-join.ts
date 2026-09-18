import { firstName, waHref } from "@/lib/whatsapp";
import { publicAppUrl } from "@/lib/app-url";
import { looksLikeHouseCode, studentJoinUrl } from "@/lib/join-code";
import { ACADEMY_MEMBERSHIP_SQL } from "@/lib/memberships";
import type { Academy, Student } from "@/lib/types";

export type PublicAcademyJoin = {
  id?: string;
  name: string;
  city: string;
  state: string;
  slug: string;
  joinCode: string;
};

export function mapPublicHouse(row: Record<string, unknown>): PublicAcademyJoin {
  const slug = String(row.slug ?? "").trim();
  const join = String(row.join_code ?? "").trim();
  const id = String(row.id ?? "").trim();
  return {
    id: id || undefined,
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
alter table public.academies add column if not exists brand_logo text;
alter table public.academies add column if not exists brand_tagline text;

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
       length(regexp_replace(lower(trim(p_code)), '[^a-z0-9]', '', 'g')) >= 4
       and regexp_replace(lower(a.name), '[^a-z0-9]', '', 'g')
         = regexp_replace(lower(trim(p_code)), '[^a-z0-9]', '', 'g')
     )
     or (
       length(regexp_replace(lower(trim(p_code)), '[^a-z0-9]', '', 'g')) >= 4
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
  if v_q is null or length(v_q) < 3 then
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
       length(regexp_replace(lower(v_q), '[^a-z0-9]', '', 'g')) >= 4
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

drop function if exists public.join_academy_as_student(text, text, text);
drop function if exists public.join_academy_as_student(text, text, text, date, text, text);

create or replace function public.join_academy_as_student(
  p_code text,
  p_name text,
  p_phone text,
  p_birth_date date default null,
  p_guardian_name text default null,
  p_division text default null
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
  v_claimed uuid;
  v_profile_academy uuid;
  v_profile_role text;
  v_label text;
  v_plan text;
  v_limit int;
  v_count int;
  v_division text;
  v_guardian text := nullif(trim(p_guardian_name), '');
  v_birth date := p_birth_date;
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
       length(regexp_replace(lower(v_q), '[^a-z0-9]', '', 'g')) >= 4
       and regexp_replace(lower(a.name), '[^a-z0-9]', '', 'g')
         = regexp_replace(lower(v_q), '[^a-z0-9]', '', 'g')
     )
     or (
       length(regexp_replace(lower(v_q), '[^a-z0-9]', '', 'g')) >= 4
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
    if exists (
      select 1 from public.academy_memberships m
      where m.user_id = v_uid
        and m.academy_id = v_academy
        and m.role in ('owner', 'instructor')
    ) or (
      v_profile_academy is not distinct from v_academy
      and v_profile_role is distinct from 'student'
    ) then
      raise exception 'Este e-mail já é da equipe da academia. Use outro e-mail no app do aluno.';
    end if;
  end if;

  v_label := nullif(trim(p_name), '');
  v_division := case
    when lower(trim(coalesce(p_division, ''))) = 'kids' then 'kids'
    when v_birth is not null and v_birth > (current_date - interval '16 years') then 'kids'
    else 'adult'
  end;

  if v_division = 'kids' and v_guardian is null then
    raise exception 'No kids, informe o nome do responsável (LGPD, art. 14).';
  end if;

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

  if v_student is not null and v_claimed is not null and v_claimed <> v_uid then
    raise exception 'Essa ficha já tem acesso. Entre com o e-mail e a senha que você criou.';
  end if;

  if v_student is null then
    select a.plan into v_plan from public.academies a where a.id = v_academy;
    v_limit := case
      when v_plan = 'essencial' then 50
      when v_plan = 'equipe' then null
      else 200
    end;
    if v_limit is not null then
      select count(*)::int into v_count from public.students s where s.academy_id = v_academy;
      if v_count >= v_limit then
        raise exception 'Esta academia chegou ao limite de % alunos do plano atual. Fale com a secretaria.', v_limit;
      end if;
    end if;
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
      phone = case when phone is null or phone = '' then nullif(trim(p_phone), '') else phone end,
      guardian_name = coalesce(v_guardian, guardian_name),
      birth_date = coalesce(v_birth, birth_date),
      division = case when v_division = 'kids' then 'kids' else division end
    where id = v_student;
  else
    insert into public.students (
      academy_id, user_id, name, email, phone, birth_date, guardian_name, division, belt, status, monthly_fee
    ) values (
      v_academy,
      v_uid,
      coalesce(v_label, split_part(v_email, '@', 1), 'Aluno'),
      nullif(v_email, ''),
      nullif(trim(p_phone), ''),
      v_birth,
      v_guardian,
      v_division,
      'white',
      'active',
      0
    );
  end if;

  return v_academy;
end;
$$;

revoke all on function public.join_academy_as_student(text, text, text, date, text, text) from public;
grant execute on function public.join_academy_as_student(text, text, text, date, text, text) to authenticated;

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
    if v_profile_role = 'student'
       and not exists (
         select 1 from public.academy_memberships m
         where m.user_id = auth.uid() and m.role in ('owner', 'instructor')
       )
    then
      raise exception 'Este e-mail já é de um aluno. Use outro e-mail para a academia.';
    end if;
    if v_profile_academy is not null
       and exists (
         select 1 from public.academies a
         where a.id = v_profile_academy
           and (
             lower(trim(a.name)) = lower(trim(p_name))
             or a.slug = p_slug
           )
       )
    then
      return v_profile_academy;
    end if;
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

alter table public.attendance add column if not exists status text;
alter table public.attendance add column if not exists validated_at timestamptz;
alter table public.attendance add column if not exists validated_by uuid;
update public.attendance
  set status = 'pending'
  where coalesce(method, 'app') = 'app'
    and validated_at is null
    and coalesce(status, 'pending') <> 'no_show';
update public.attendance set status = 'pending' where status is null;
alter table public.attendance alter column status set default 'pending';
alter table public.attendance alter column status set not null;

create or replace function public.is_academy_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('owner', 'instructor')
  )
$$;

revoke all on function public.is_academy_staff() from public;
grant execute on function public.is_academy_staff() to authenticated;

create or replace function public.current_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select s.id
  from public.students s
  where s.user_id = auth.uid()
    and s.academy_id = public.current_academy_id()
  order by s.created_at asc
  limit 1
$$;

revoke all on function public.current_student_id() from public;
grant execute on function public.current_student_id() to authenticated;

create or replace function public.student_class_directory()
returns table (
  id uuid,
  name text,
  belt text,
  stripes int,
  division text,
  status text,
  avatar_hue int
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.name, s.belt, s.stripes, s.division, s.status, s.avatar_hue
  from public.students s
  where s.academy_id = public.current_academy_id()
    and s.status in ('active', 'trial')
$$;

revoke all on function public.student_class_directory() from public;
grant execute on function public.student_class_directory() to authenticated;

drop policy if exists "profiles self" on public.profiles;
create policy "profiles self" on public.profiles
  for select using (
    id = auth.uid()
    or (academy_id = public.current_academy_id() and public.is_academy_staff())
  );

drop policy if exists "students by academy" on public.students;
drop policy if exists "students read academy" on public.students;
drop policy if exists "students read self" on public.students;
drop policy if exists "students read staff" on public.students;
drop policy if exists "students write staff" on public.students;
create policy "students read staff" on public.students
  for select using (academy_id = public.current_academy_id() and public.is_academy_staff());
create policy "students read self" on public.students
  for select using (user_id = auth.uid());
create policy "students write staff" on public.students
  for all using (academy_id = public.current_academy_id() and public.is_academy_staff())
  with check (academy_id = public.current_academy_id() and public.is_academy_staff());

drop policy if exists "payments by academy" on public.payments;
drop policy if exists "payments read academy" on public.payments;
drop policy if exists "payments read self" on public.payments;
drop policy if exists "payments read staff" on public.payments;
drop policy if exists "payments write staff" on public.payments;
create policy "payments read staff" on public.payments
  for select using (academy_id = public.current_academy_id() and public.is_academy_staff());
create policy "payments read self" on public.payments
  for select using (student_id = public.current_student_id());
create policy "payments write staff" on public.payments
  for all using (academy_id = public.current_academy_id() and public.is_academy_staff())
  with check (academy_id = public.current_academy_id() and public.is_academy_staff());

drop policy if exists "expenses read academy" on public.expenses;
drop policy if exists "inventory read academy" on public.inventory;
drop policy if exists "sales read academy" on public.sales;
drop policy if exists "drop ins read academy" on public.drop_ins;

drop policy if exists "graduations read academy" on public.graduations;
create policy "graduations read academy" on public.graduations
  for select using (
    academy_id = public.current_academy_id()
    and (public.is_academy_staff() or student_id = public.current_student_id())
  );

drop policy if exists "evaluations read academy" on public.evaluations;
create policy "evaluations read academy" on public.evaluations
  for select using (
    academy_id = public.current_academy_id()
    and (public.is_academy_staff() or student_id = public.current_student_id())
  );

alter table public.academies add column if not exists updated_at timestamptz not null default now();
alter table public.academies add column if not exists billing_status text not null default 'none';
alter table public.academies add column if not exists due_day int not null default 10;

create or replace function public.academies_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists academies_touch_updated_at on public.academies;
create trigger academies_touch_updated_at
  before update on public.academies
  for each row execute function public.academies_touch_updated_at();

drop policy if exists "academy members" on public.academies;
drop policy if exists "academy staff read" on public.academies;
create policy "academy staff read" on public.academies
  for select using (id = public.current_academy_id() and public.is_academy_staff());

create or replace function public.academy_for_member()
returns table (
  id uuid,
  name text,
  slug text,
  city text,
  state text,
  address text,
  phone text,
  instagram text,
  pix_key text,
  pix_name text,
  plan text,
  monthly_goal numeric,
  drop_in_fee numeric,
  due_day int,
  join_code text,
  brand_logo text,
  brand_tagline text,
  billing_status text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id,
    a.name,
    a.slug,
    a.city,
    a.state,
    a.address,
    a.phone,
    a.instagram,
    a.pix_key,
    a.pix_name,
    a.plan,
    a.monthly_goal,
    a.drop_in_fee,
    a.due_day,
    a.join_code,
    a.brand_logo,
    a.brand_tagline,
    a.billing_status,
    a.created_at,
    a.updated_at
  from public.academies a
  where a.id = public.current_academy_id()
$$;

revoke all on function public.academy_for_member() from public;
grant execute on function public.academy_for_member() to authenticated;
` + ACADEMY_MEMBERSHIP_SQL + `
notify pgrst, 'reload schema';
`;

export function studentAppInviteMessage(academy: Academy, student?: Pick<Student, "name" | "email">) {
  const who = student ? firstName(student.name) : "professor";
  const link = studentJoinUrl(academy.joinCode || academy.slug);
  if (student) {
    const emailHint = student.email?.trim()
      ? `Usa o e-mail ${student.email.trim()} (o mesmo da ficha) e cria a senha.`
      : "Pede o e-mail da ficha para a secretaria e cria a senha com esse e-mail.";
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

Se a academia já te cadastrou, confirma o nome da academia e cria a senha com o mesmo e-mail da ficha.

Se ainda não te cadastrou, busca o nome da academia nessa tela e se cadastra — sua ficha aparece na lista da academia.`;
}

export function studentAppInviteHref(
  academy: Academy,
  phone: string,
  student?: Pick<Student, "name" | "email">,
) {
  return waHref(phone, studentAppInviteMessage(academy, student));
}
