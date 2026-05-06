import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MemberList } from "@/components/members/MemberList";
import { ProjectHeaderActions } from "@/components/projects/ProjectHeaderActions";
import { TaskList } from "@/components/tasks/TaskList";
import { RoleBadge } from "@/components/ui/Badge";
import { GridPattern } from "@/components/ui/grid-pattern";
import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectMemberWithProfile, TaskWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";

function BackIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11.5L4.5 7L9 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

const gradients = [
  "from-teal-600 to-cyan-600",
  "from-violet-600 to-purple-600",
  "from-amber-600 to-orange-500",
  "from-rose-600 to-pink-600",
  "from-sky-600 to-blue-600",
  "from-emerald-600 to-teal-600",
  "from-indigo-600 to-violet-600",
];
function getGradient(id: string) {
  return gradients[id.charCodeAt(0) % gradients.length];
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: membership } = await supabase
    .from("project_members").select("role")
    .eq("project_id", params.id).eq("user_id", user.id).single();
  if (!membership) notFound();

  const [{ data: project }, { data: tasks }, { data: members }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", params.id).single(),
    supabase.from("tasks")
      .select("*, assignee:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url, created_at)")
      .eq("project_id", params.id).order("created_at", { ascending: false }),
    supabase.from("project_members")
      .select("*, profiles(id, full_name, email, avatar_url, created_at)")
      .eq("project_id", params.id).order("joined_at", { ascending: true }),
  ]);
  if (!project) notFound();

  const isAdmin = membership.role === "admin";
  const gradient = getGradient(params.id);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Breadcrumb */}
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-ethara-teal">
        <BackIcon /> Projects
      </Link>

      {/* Project header with grid pattern */}
      <div className={cn("relative overflow-hidden rounded-2xl bg-gradient-to-br", gradient)}>
        <GridPattern
          width={28} height={28}
          squares={[[1,2],[3,1],[6,3],[9,1],[12,2],[2,5],[5,4],[8,5],[11,3],[4,7],[7,6],[10,7]]}
          className={cn(
            "fill-white/0 stroke-white/10",
            "[mask-image:radial-gradient(500px_circle_at_bottom_right,white,transparent)]"
          )}
        />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <h1 className="text-2xl font-bold text-white sm:text-3xl truncate">{project.name}</h1>
                <RoleBadge role={membership.role} onDark />
              </div>
              <p className="max-w-3xl text-sm leading-relaxed text-white/60">
                {project.description || "No description yet."}
              </p>
            </div>
            {isAdmin ? <ProjectHeaderActions project={project as Project} /> : null}
          </div>
        </div>
      </div>

      {/* Tasks + Members */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <TaskList
          projectId={params.id}
          tasks={(tasks ?? []) as TaskWithRelations[]}
          members={(members ?? []) as ProjectMemberWithProfile[]}
          isAdmin={isAdmin}
        />
        <MemberList
          projectId={params.id}
          members={(members ?? []) as ProjectMemberWithProfile[]}
          isAdmin={isAdmin}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
