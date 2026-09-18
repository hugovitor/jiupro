import type { HouseMembership, Role } from "./types";

export type { HouseMembership };

export function mapHouseMembership(row: Record<string, unknown>): HouseMembership | null {
  const id = String(row.id ?? "").trim();
  if (!id) return null;
  const role = String(row.role ?? "student");
  if (role !== "owner" && role !== "instructor" && role !== "student") return null;
  return {
    id,
    name: String(row.name ?? "").trim(),
    slug: String(row.slug ?? "").trim(),
    city: String(row.city ?? "").trim(),
    state: String(row.state ?? "").trim(),
    role,
  };
}

export function staffOfHouse(
  memberships: Pick<HouseMembership, "id" | "role">[],
  academyId: string,
) {
  return memberships.some(
    (row) => row.id === academyId && (row.role === "owner" || row.role === "instructor"),
  );
}

export function canCreateAnotherHouse(
  role: Role | null | undefined,
  houses?: Pick<HouseMembership, "role">[],
) {
  if (role === "owner" || role === "instructor") return true;
  return Boolean(houses?.some((row) => row.role === "owner" || row.role === "instructor"));
}

export function routeForRole(role: Role) {
  return role === "student" ? "/aluno" : "/academia";
}

export function roleLabel(role: Role) {
  if (role === "owner") return "Dono";
  if (role === "instructor") return "Professor";
  return "Aluno";
}

export const ACADEMY_MEMBERSHIP_SQL = `
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
`;
