import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { GridPattern } from "@/components/ui/grid-pattern";
import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectWithCounts } from "@/lib/types";
import { cn } from "@/lib/utils";

function FolderIcon() {
  return <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 7C3 5.9 3.9 5 5 5H10.17C10.58 5 10.97 5.19 11.22 5.51L12.38 7H19C20.1 7 21 7.9 21 9V18C21 19.1 20.1 20 19 20H5C3.9 20 3 19.1 3 18V7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>;
}
function PlusIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 2.5v10M2.5 7.5h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}

export default async function ProjectsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: memberships } = await supabase
    .from("project_members")
    .select("role, projects(id, name, description, owner_id, created_at)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const projects = await Promise.all(
    (memberships ?? []).map(async (membership: any) => {
      const project = membership.projects as Project;
      const [{ count: memberCount }, { count: taskCount }] = await Promise.all([
        supabase.from("project_members").select("id", { count: "exact", head: true }).eq("project_id", project.id),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("project_id", project.id),
      ]);
      return { ...project, role: membership.role, member_count: memberCount ?? 0, task_count: taskCount ?? 0 } satisfies ProjectWithCounts;
    })
  );

  return (
    <div className="space-y-7 animate-fade-in">

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl px-6 py-8 sm:px-8 sm:py-10"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f766e 100%)" }}
      >
        <GridPattern
          width={36} height={36}
          squares={[[1,1],[4,2],[7,1],[10,3],[13,1],[2,4],[5,3],[8,4],[11,2],[3,6],[6,5],[9,6]]}
          className={cn(
            "fill-white/0 stroke-white/8",
            "[mask-image:radial-gradient(500px_circle_at_top_left,white,transparent)]"
          )}
        />
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-300/70">Your workspace</p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Projects</h1>
            <p className="mt-1.5 text-sm text-white/50">
              {projects.length > 0
                ? `${projects.length} project${projects.length !== 1 ? "s" : ""} — all where you are a member.`
                : "All projects where you are a member."}
            </p>
          </div>
          <Link href="/projects/new">
            <button className="inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 shadow-lg">
              <PlusIcon /> New Project
            </button>
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderIcon />}
          heading="No projects yet"
          subtext="Create your first project — you'll automatically become its admin."
          action={
            <Link href="/projects/new">
              <Button><PlusIcon /> Create Project</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}
    </div>
  );
}
