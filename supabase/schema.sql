-- TatameX — schema multi-tenant para academias de Jiu-Jitsu
-- Rode no SQL Editor do Supabase. RLS isolada por academia.

create extension if not exists "pgcrypto";

create table if not exists public.academies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  city text,
  state text,
  address text,
  phone text,
  instagram text,
  pix_key text,
  pix_name text,
  plan text not null default 'essencial',
  stripe_customer_id text,
  stripe_subscription_id text,
  monthly_goal numeric not null default 0,
  drop_in_fee numeric not null default 40,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.academies add column if not exists brand_logo text;
alter table public.academies add column if not exists brand_tagline text;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  academy_id uuid references public.academies(id) on delete cascade,
  name text not null,
  email text,
  role text not null check (role in ('owner', 'instructor', 'student')),
  phone text,
  avatar_hue int not null default 12,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  birth_date date,
  guardian_name text,
  division text not null default 'adult',
  belt text not null default 'white',
  stripes int not null default 0,
  join_date date not null default current_date,
  last_promotion_date date,
  status text not null default 'active',
  monthly_fee numeric not null default 0,
  notes text,
  avatar_hue int not null default 40,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  name text not null,
  weekday int not null,
  start_time time not null,
  duration_min int not null default 60,
  instructor_id uuid references public.profiles(id),
  division text not null default 'adult',
  gi boolean not null default true,
  capacity int not null default 24
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  date date not null default current_date,
  checked_in_at timestamptz not null default now(),
  method text not null default 'app',
  status text not null default 'pending',
  validated_at timestamptz,
  validated_by uuid,
  unique (student_id, class_id, date)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  month text not null,
  amount numeric not null,
  status text not null default 'pending',
  paid_at timestamptz,
  method text
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  description text not null,
  category text not null,
  amount numeric not null,
  date date not null default current_date
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  name text not null,
  sku text,
  category text not null,
  size text,
  quantity int not null default 0,
  min_quantity int not null default 0,
  cost numeric not null default 0,
  price numeric not null default 0
);

create table if not exists public.graduations (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  from_belt text not null,
  to_belt text not null,
  stripes int not null default 0,
  date date not null default current_date,
  notes text
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null default current_date,
  instructor_name text,
  notes text not null,
  recommend_promotion boolean not null default false
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  author_name text,
  author_role text,
  content text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  primary key (post_id, profile_id)
);

alter table public.academies enable row level security;
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.classes enable row level security;
alter table public.attendance enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.inventory enable row level security;
alter table public.graduations enable row level security;
alter table public.evaluations enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;

create or replace function public.current_academy_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select academy_id from public.profiles where id = auth.uid()
$$;

revoke all on function public.current_academy_id() from public;
grant execute on function public.current_academy_id() to authenticated;

drop policy if exists "profiles self" on public.profiles;
create policy "profiles self" on public.profiles
  for select using (id = auth.uid() or academy_id = public.current_academy_id());

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "academy members" on public.academies;
create policy "academy members" on public.academies
  for select using (
    id = public.current_academy_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('owner', 'instructor')
    )
  );

drop policy if exists "students by academy" on public.students;
create policy "students by academy" on public.students
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

drop policy if exists "classes by academy" on public.classes;
create policy "classes by academy" on public.classes
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

drop policy if exists "attendance by academy" on public.attendance;
create policy "attendance by academy" on public.attendance
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

drop policy if exists "payments by academy" on public.payments;
create policy "payments by academy" on public.payments
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

drop policy if exists "expenses by academy" on public.expenses;
create policy "expenses by academy" on public.expenses
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

drop policy if exists "inventory by academy" on public.inventory;
create policy "inventory by academy" on public.inventory
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

drop policy if exists "graduations by academy" on public.graduations;
create policy "graduations by academy" on public.graduations
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

drop policy if exists "evaluations by academy" on public.evaluations;
create policy "evaluations by academy" on public.evaluations
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

drop policy if exists "posts by academy" on public.posts;
create policy "posts by academy" on public.posts
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

drop policy if exists "likes by academy" on public.post_likes;
create policy "likes by academy" on public.post_likes
  for all using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.academy_id = public.current_academy_id()
    )
  )
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.academy_id = public.current_academy_id()
    )
  );

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  title text not null,
  kind text not null,
  date date not null,
  time text,
  place text,
  notes text,
  fee numeric not null default 0
);

create table if not exists public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key (event_id, student_id)
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  item_id uuid references public.inventory(id) on delete set null,
  item_name text not null,
  quantity int not null default 1,
  amount numeric not null,
  date date not null default current_date,
  method text
);

alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.sales enable row level security;

drop policy if exists "events by academy" on public.events;
create policy "events by academy" on public.events
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

drop policy if exists "event rsvps by academy" on public.event_rsvps;
create policy "event rsvps by academy" on public.event_rsvps
  for all using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.academy_id = public.current_academy_id()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.academy_id = public.current_academy_id()
    )
  );

drop policy if exists "sales by academy" on public.sales;
create policy "sales by academy" on public.sales
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

create table if not exists public.drop_ins (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  name text not null,
  phone text,
  class_id uuid references public.classes(id) on delete set null,
  date date not null default current_date,
  amount numeric not null,
  method text
);

alter table public.drop_ins enable row level security;

drop policy if exists "drop ins by academy" on public.drop_ins;
create policy "drop ins by academy" on public.drop_ins
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

-- Snapshot da academia (cadastro real). A demo Equipe Origem não usa isto.
alter table public.academies add column if not exists app_state jsonb;

drop policy if exists "academy update" on public.academies;
create policy "academy update" on public.academies
  for update using (id = public.current_academy_id())
  with check (id = public.current_academy_id());

-- Código curto da academia para o aluno entrar no PWA.
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

-- Idempotente para quem já rodou uma versão anterior do schema
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists avatar_hue int not null default 12;
alter table public.students add column if not exists avatar_hue int not null default 40;
alter table public.posts add column if not exists author_name text;
alter table public.posts add column if not exists author_role text;
alter table public.students add column if not exists cpf text;
alter table public.students add column if not exists asaas_customer_id text;
alter table public.payments add column if not exists asaas_payment_id text;
alter table public.payments add column if not exists asaas_invoice_url text;
alter table public.payments add column if not exists asaas_pix_copy text;
alter table public.payments add column if not exists asaas_status text;
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

-- Planilha de vendas do dono do TatameX (painel /operacao). Sem policy: só service role.
create table if not exists public.operator_leads (
  id uuid primary key default gen_random_uuid(),
  academy_name text not null,
  city text,
  state text,
  phone text,
  instagram text,
  owner_name text,
  pain text,
  status text not null default 'novo'
    check (status in ('novo','falou','demo','trial','fechou','nao')),
  notes text,
  follow_up_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.operator_leads enable row level security;

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

alter table public.academies add column if not exists billing_status text not null default 'none';
alter table public.academies add column if not exists due_day int not null default 10;

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

create or replace function public.profiles_protect_identity()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  new.role := old.role;
  new.academy_id := old.academy_id;
  return new;
end;
$$;

drop trigger if exists profiles_protect_identity on public.profiles;
create trigger profiles_protect_identity
  before update on public.profiles
  for each row execute function public.profiles_protect_identity();

create or replace function public.academies_protect_billing()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  new.plan := old.plan;
  new.billing_status := old.billing_status;
  new.stripe_customer_id := old.stripe_customer_id;
  new.stripe_subscription_id := old.stripe_subscription_id;
  return new;
end;
$$;

drop trigger if exists academies_protect_billing on public.academies;
create trigger academies_protect_billing
  before update on public.academies
  for each row execute function public.academies_protect_billing();

drop policy if exists "academy update" on public.academies;
create policy "academy update" on public.academies
  for update using (id = public.current_academy_id() and public.is_academy_staff())
  with check (id = public.current_academy_id() and public.is_academy_staff());

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

drop policy if exists "classes by academy" on public.classes;
drop policy if exists "classes read academy" on public.classes;
drop policy if exists "classes write staff" on public.classes;
create policy "classes read academy" on public.classes
  for select using (academy_id = public.current_academy_id());
create policy "classes write staff" on public.classes
  for all using (academy_id = public.current_academy_id() and public.is_academy_staff())
  with check (academy_id = public.current_academy_id() and public.is_academy_staff());

drop policy if exists "attendance by academy" on public.attendance;
drop policy if exists "attendance read academy" on public.attendance;
drop policy if exists "attendance write staff" on public.attendance;
create policy "attendance read academy" on public.attendance
  for select using (academy_id = public.current_academy_id());
create policy "attendance write staff" on public.attendance
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

drop policy if exists "expenses by academy" on public.expenses;
drop policy if exists "expenses read academy" on public.expenses;
drop policy if exists "expenses write staff" on public.expenses;
create policy "expenses write staff" on public.expenses
  for all using (academy_id = public.current_academy_id() and public.is_academy_staff())
  with check (academy_id = public.current_academy_id() and public.is_academy_staff());

drop policy if exists "inventory by academy" on public.inventory;
drop policy if exists "inventory read academy" on public.inventory;
drop policy if exists "inventory write staff" on public.inventory;
create policy "inventory write staff" on public.inventory
  for all using (academy_id = public.current_academy_id() and public.is_academy_staff())
  with check (academy_id = public.current_academy_id() and public.is_academy_staff());

drop policy if exists "graduations by academy" on public.graduations;
drop policy if exists "graduations read academy" on public.graduations;
drop policy if exists "graduations read self" on public.graduations;
drop policy if exists "graduations write staff" on public.graduations;
create policy "graduations read academy" on public.graduations
  for select using (
    academy_id = public.current_academy_id()
    and (public.is_academy_staff() or student_id = public.current_student_id())
  );
create policy "graduations write staff" on public.graduations
  for all using (academy_id = public.current_academy_id() and public.is_academy_staff())
  with check (academy_id = public.current_academy_id() and public.is_academy_staff());

drop policy if exists "evaluations by academy" on public.evaluations;
drop policy if exists "evaluations read academy" on public.evaluations;
drop policy if exists "evaluations read self" on public.evaluations;
drop policy if exists "evaluations write staff" on public.evaluations;
create policy "evaluations read academy" on public.evaluations
  for select using (
    academy_id = public.current_academy_id()
    and (public.is_academy_staff() or student_id = public.current_student_id())
  );
create policy "evaluations write staff" on public.evaluations
  for all using (academy_id = public.current_academy_id() and public.is_academy_staff())
  with check (academy_id = public.current_academy_id() and public.is_academy_staff());

drop policy if exists "posts by academy" on public.posts;
drop policy if exists "posts read academy" on public.posts;
drop policy if exists "posts write staff" on public.posts;
create policy "posts read academy" on public.posts
  for select using (academy_id = public.current_academy_id());
create policy "posts write staff" on public.posts
  for all using (academy_id = public.current_academy_id() and public.is_academy_staff())
  with check (academy_id = public.current_academy_id() and public.is_academy_staff());

drop policy if exists "events by academy" on public.events;
drop policy if exists "events read academy" on public.events;
drop policy if exists "events write staff" on public.events;
create policy "events read academy" on public.events
  for select using (academy_id = public.current_academy_id());
create policy "events write staff" on public.events
  for all using (academy_id = public.current_academy_id() and public.is_academy_staff())
  with check (academy_id = public.current_academy_id() and public.is_academy_staff());

drop policy if exists "sales by academy" on public.sales;
drop policy if exists "sales read academy" on public.sales;
drop policy if exists "sales write staff" on public.sales;
create policy "sales write staff" on public.sales
  for all using (academy_id = public.current_academy_id() and public.is_academy_staff())
  with check (academy_id = public.current_academy_id() and public.is_academy_staff());

drop policy if exists "drop ins by academy" on public.drop_ins;
drop policy if exists "drop ins read academy" on public.drop_ins;
drop policy if exists "drop ins write staff" on public.drop_ins;
create policy "drop ins write staff" on public.drop_ins
  for all using (academy_id = public.current_academy_id() and public.is_academy_staff())
  with check (academy_id = public.current_academy_id() and public.is_academy_staff());

alter table public.academies add column if not exists updated_at timestamptz not null default now();

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

create table if not exists public.academy_memberships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  academy_id uuid not null references public.academies(id) on delete cascade,
  role text not null check (role in ('owner', 'instructor', 'student')),
  created_at timestamptz not null default now(),
  primary key (user_id, academy_id)
);

alter table public.academy_memberships enable row level security;

drop policy if exists "own memberships" on public.academy_memberships;
drop policy if exists "read house memberships" on public.academy_memberships;
create policy "read house memberships" on public.academy_memberships
  for select using (
    user_id = auth.uid()
    or (academy_id = public.current_academy_id() and public.is_academy_staff())
  );

insert into public.academy_memberships (user_id, academy_id, role)
select p.id, p.academy_id, p.role
from public.profiles p
where p.academy_id is not null
on conflict (user_id, academy_id) do update set role = excluded.role;

create or replace function public.touch_academy_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.academy_id is null then
    return new;
  end if;
  insert into public.academy_memberships (user_id, academy_id, role)
  values (new.id, new.academy_id, new.role)
  on conflict (user_id, academy_id) do update set role = excluded.role;
  return new;
end;
$$;

drop trigger if exists profiles_touch_membership on public.profiles;
create trigger profiles_touch_membership
  after insert or update of academy_id, role on public.profiles
  for each row execute function public.touch_academy_membership();

create or replace function public.list_my_academies()
returns table (
  id uuid,
  name text,
  slug text,
  city text,
  state text,
  role text
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.name, a.slug, a.city, a.state, m.role
  from public.academy_memberships m
  join public.academies a on a.id = m.academy_id
  where m.user_id = auth.uid()
  order by a.name
$$;

revoke all on function public.list_my_academies() from public;
grant execute on function public.list_my_academies() to authenticated;

create or replace function public.switch_academy(p_academy_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if auth.uid() is null then
    raise exception 'Entre de novo.';
  end if;

  select m.role into v_role
  from public.academy_memberships m
  where m.user_id = auth.uid() and m.academy_id = p_academy_id;

  if v_role is null then
    raise exception 'Você não faz parte desta academia.';
  end if;

  update public.profiles
    set academy_id = p_academy_id, role = v_role
    where id = auth.uid();

  return p_academy_id;
end;
$$;

revoke all on function public.switch_academy(uuid) from public;
grant execute on function public.switch_academy(uuid) to authenticated;

create or replace function public.list_house_staff()
returns table (
  id uuid,
  academy_id uuid,
  name text,
  email text,
  phone text,
  role text,
  avatar_hue int
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, m.academy_id, p.name, p.email, p.phone, m.role, p.avatar_hue
  from public.academy_memberships m
  join public.profiles p on p.id = m.user_id
  where m.academy_id = public.current_academy_id()
    and m.role in ('owner', 'instructor')
    and public.is_academy_staff()
  order by case m.role when 'owner' then 0 else 1 end, p.name
$$;

revoke all on function public.list_house_staff() from public;
grant execute on function public.list_house_staff() to authenticated;

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

create or replace function public.update_my_student_profile(p_phone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := nullif(trim(p_phone), '');
begin
  if auth.uid() is null then
    raise exception 'Entre de novo.';
  end if;
  update public.profiles
    set phone = v_phone
    where id = auth.uid();
  update public.students
    set phone = coalesce(v_phone, phone)
    where user_id = auth.uid()
      and academy_id = public.current_academy_id();
end;
$$;

revoke all on function public.update_my_student_profile(text) from public;
grant execute on function public.update_my_student_profile(text) to authenticated;

notify pgrst, 'reload schema';
