-- Task comments table
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 1000),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Activity log table
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null, -- 'created', 'updated', 'deleted', 'commented', 'assigned', 'status_changed'
  entity_type text not null, -- 'project', 'task', 'member', 'comment'
  entity_id uuid,
  details jsonb default '{}',
  created_at timestamp with time zone not null default now()
);

-- Indexes
create index task_comments_task_id_idx on public.task_comments(task_id);
create index activity_log_project_id_idx on public.activity_log(project_id);
create index activity_log_task_id_idx on public.activity_log(task_id);
create index activity_log_user_id_idx on public.activity_log(user_id);
create index activity_log_created_at_idx on public.activity_log(created_at desc);

-- Updated_at trigger for comments
create trigger comments_updated_at
before update on public.task_comments
for each row execute function public.touch_updated_at();

-- RLS policies
alter table public.task_comments enable row level security;
alter table public.activity_log enable row level security;

-- Task comments policies
create policy "Project members can read task comments"
on public.task_comments for select
to authenticated
using (
  exists (
    select 1 from public.tasks t
    join public.project_members pm on pm.project_id = t.project_id
    where t.id = task_id and pm.user_id = auth.uid()
  )
);

create policy "Project members can create task comments"
on public.task_comments for insert
to authenticated
with check (
  exists (
    select 1 from public.tasks t
    join public.project_members pm on pm.project_id = t.project_id
    where t.id = task_id and pm.user_id = auth.uid()
  )
  and user_id = auth.uid()
);

create policy "Users can update own comments"
on public.task_comments for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own comments or admins can delete any"
on public.task_comments for delete
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.tasks t
    join public.project_members pm on pm.project_id = t.project_id
    where t.id = task_id and pm.user_id = auth.uid() and pm.role = 'admin'
  )
);

-- Activity log policies
create policy "Project members can read activity log"
on public.activity_log for select
to authenticated
using (public.is_project_member(project_id));

create policy "System can insert activity log"
on public.activity_log for insert
to authenticated
with check (user_id = auth.uid());

-- Function to log activity
create or replace function public.log_activity(
  p_project_id uuid,
  p_task_id uuid default null,
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_details jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity_log (project_id, task_id, user_id, action, entity_type, entity_id, details)
  values (p_project_id, p_task_id, auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
end;
$$;
