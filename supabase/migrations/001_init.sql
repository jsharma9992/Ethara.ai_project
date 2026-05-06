create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  avatar_url text,
  created_at timestamp with time zone not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone not null default now()
);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  joined_at timestamp with time zone not null default now(),
  unique (project_id, user_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index project_members_project_id_user_id_idx on public.project_members(project_id, user_id);
create index tasks_project_id_assigned_to_idx on public.tasks(project_id, assigned_to);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_updated_at
before update on public.tasks
for each row execute function public.touch_updated_at();

create or replace function public.prevent_member_task_field_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_project_admin(old.project_id, auth.uid()) then
    return new;
  end if;

  if new.project_id is distinct from old.project_id
    or new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.priority is distinct from old.priority
    or new.assigned_to is distinct from old.assigned_to
    or new.due_date is distinct from old.due_date
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Members can only update task status.';
  end if;

  return new;
end;
$$;

create trigger members_only_update_task_status
before update on public.tasks
for each row execute function public.prevent_member_task_field_updates();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;

create or replace function public.is_project_member(target_project_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = target_project_id
      and user_id = target_user_id
  );
$$;

create or replace function public.is_project_admin(target_project_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = target_project_id
      and user_id = target_user_id
      and role = 'admin'
  );
$$;

create policy "Authenticated users can read profiles"
on public.profiles for select
to authenticated
using (true);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Members can read projects"
on public.projects for select
to authenticated
using (owner_id = auth.uid() or public.is_project_member(id));

create policy "Authenticated users can create projects"
on public.projects for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Admins can update projects"
on public.projects for update
to authenticated
using (public.is_project_admin(id))
with check (public.is_project_admin(id));

create policy "Admins can delete projects"
on public.projects for delete
to authenticated
using (public.is_project_admin(id));

create policy "Members can read project memberships"
on public.project_members for select
to authenticated
using (public.is_project_member(project_id));

create policy "Project owners can add initial admin membership"
on public.project_members for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'admin'
  and exists (
    select 1
    from public.projects
    where projects.id = project_id
      and projects.owner_id = auth.uid()
  )
);

create policy "Admins can invite project members"
on public.project_members for insert
to authenticated
with check (public.is_project_admin(project_id));

create policy "Admins can update project members"
on public.project_members for update
to authenticated
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

create policy "Admins can remove project members"
on public.project_members for delete
to authenticated
using (public.is_project_admin(project_id));

create policy "Members can read tasks"
on public.tasks for select
to authenticated
using (public.is_project_member(project_id));

create policy "Admins can create tasks"
on public.tasks for insert
to authenticated
with check (public.is_project_admin(project_id) and created_by = auth.uid());

create policy "Admins can update tasks"
on public.tasks for update
to authenticated
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

create policy "Members can update task status"
on public.tasks for update
to authenticated
using (public.is_project_member(project_id))
with check (public.is_project_member(project_id));

create policy "Admins can delete tasks"
on public.tasks for delete
to authenticated
using (public.is_project_admin(project_id));
