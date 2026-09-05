-- JiuPro — schema multi-tenant para academias de Jiu-Jitsu
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
  created_at timestamptz not null default now()
);

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
grant execute on function public.current_academy_id() to authenticated, anon;

drop policy if exists "profiles self" on public.profiles;
create policy "profiles self" on public.profiles
  for select using (id = auth.uid() or academy_id = public.current_academy_id());

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "academy members" on public.academies;
create policy "academy members" on public.academies
  for select using (id = public.current_academy_id());

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
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    return (select academy_id from public.profiles where id = auth.uid());
  end if;
  if exists (select 1 from public.academies where slug = v_slug) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end if;
  insert into public.academies (name, slug, city, state, plan, pix_name)
  values (p_name, v_slug, p_city, p_state, coalesce(p_plan, 'essencial'), p_name)
  returning id into v_id;
  insert into public.profiles (id, academy_id, name, role, email)
  values (
    auth.uid(),
    v_id,
    p_owner_name,
    'owner',
    coalesce(auth.jwt()->>'email', '')
  );
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

-- Faz o PostgREST (API) enxergar as tabelas novas neste projeto vazio.
notify pgrst, 'reload schema';
