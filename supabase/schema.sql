-- Tatame — schema multi-tenant para academias de Jiu-Jitsu
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
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  academy_id uuid references public.academies(id) on delete cascade,
  name text not null,
  role text not null check (role in ('owner', 'instructor', 'student')),
  phone text,
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
returns uuid language sql stable as $$
  select academy_id from public.profiles where id = auth.uid()
$$;

create policy "profiles self" on public.profiles
  for select using (id = auth.uid() or academy_id = public.current_academy_id());

create policy "academy members" on public.academies
  for select using (id = public.current_academy_id());

create policy "students by academy" on public.students
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

create policy "classes by academy" on public.classes
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

create policy "attendance by academy" on public.attendance
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

create policy "payments by academy" on public.payments
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

create policy "expenses by academy" on public.expenses
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

create policy "inventory by academy" on public.inventory
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

create policy "graduations by academy" on public.graduations
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

create policy "evaluations by academy" on public.evaluations
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

create policy "posts by academy" on public.posts
  for all using (academy_id = public.current_academy_id())
  with check (academy_id = public.current_academy_id());

create policy "likes by academy" on public.post_likes
  for all using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.academy_id = public.current_academy_id()
    )
  );
