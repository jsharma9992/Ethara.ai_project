drop policy if exists "Members can read projects" on public.projects;

create policy "Members and owners can read projects"
on public.projects for select
to authenticated
using (owner_id = auth.uid() or public.is_project_member(id));
