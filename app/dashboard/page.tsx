import Link from "next/link";
import { redirect } from "next/navigation";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GridPattern } from "@/components/ui/grid-pattern";
import { createClient } from "@/lib/supabase/server";
import type { Project, TaskWithRelations } from "@/lib/types";
import { cn, formatDate, isOverdue } from "@/lib/utils";

/* ─── Icons ──────────────────────────────────────────────── */
function FolderIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 5.5C2 4.67 2.67 4 3.5 4H7.72C8.12 4 8.5 4.19 8.74 4.51L9.75 5.88C9.98 6.2 10.37 6.38 10.78 6.38H16.5C17.33 6.38 18 7.05 18 7.88V15C18 15.83 17.33 16.5 16.5 16.5H3.5C2.67 16.5 2 15.83 2 15V5.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>;
}
function TaskIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" /><path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function WarningIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3L18 17H2L10 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M10 9V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="10" cy="14.5" r="0.75" fill="currentColor" /></svg>;
}
function CheckIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" /><path d="M6.5 10.5L8.5 12.5L13.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function PlusIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 2.5v10M2.5 7.5h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}
function MembersChip() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.2" /><path d="M1 10c0-1.66 1.34-3 3-3s3 1.34 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><circle cx="9" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M11 10c0-1.1-.67-2-1.5-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>;
}
function ListChip() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 3.5h5M4 6h5M4 8.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><circle cx="2" cy="3.5" r=".7" fill="currentColor" /><circle cx="2" cy="6" r=".7" fill="currentColor" /><circle cx="2" cy="8.5" r=".7" fill="currentColor" /></svg>;
}

const statConfig = [
  { key: "projects", label: "Total Projects",   icon: FolderIcon,  color: "text-teal-600",    bg: "bg-teal-50",    ring: "ring-teal-100",    accent: "from-teal-500" },
  { key: "openTasks", label: "My Open Tasks",   icon: TaskIcon,    color: "text-blue-600",    bg: "bg-blue-50",    ring: "ring-blue-100",    accent: "from-blue-500" },
  { key: "overdue",   label: "Overdue Tasks",   icon: WarningIcon, color: "text-rose-600",    bg: "bg-rose-50",    ring: "ring-rose-100",    accent: "from-rose-500" },
  { key: "completed", label: "Completed Tasks", icon: CheckIcon,   color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100", accent: "from-emerald-500" },
];

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: memberships } = await supabase
    .from("project_members")
    .select("project_id, projects(id, name, description, owner_id, created_at)")
    .eq("user_id", user.id);

  const projects = ((memberships ?? []).map((item: any) => item.projects).filter(Boolean) ?? []) as Project[];
  const projectIds = projects.map((p) => p.id);

  const { data: myTasks } = await supabase
    .from("tasks")
    .select("*, projects(id, name), assignee:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url, created_at)")
    .eq("assigned_to", user.id)
    .order("due_date", { ascending: true, nullsFirst: false });

  const tasks = (myTasks ?? []) as TaskWithRelations[];
  const openTasks = tasks.filter((t) => t.status !== "done");
  const overdueTasks = tasks.filter((t) => isOverdue(t.due_date, t.status));

  const { data: completedTasks } = projectIds.length > 0
    ? await supabase.from("tasks").select("id").in("project_id", projectIds).eq("status", "done")
    : { data: [] };

  const recentProjects = await Promise.all(
    projects
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(async (project) => {
        const [{ count: memberCount }, { count: taskCount }] = await Promise.all([
          supabase.from("project_members").select("id", { count: "exact", head: true }).eq("project_id", project.id),
          supabase.from("tasks").select("id", { count: "exact", head: true }).eq("project_id", project.id),
        ]);
        return { ...project, member_count: memberCount ?? 0, task_count: taskCount ?? 0 };
      })
  );

  const statValues: Record<string, number> = {
    projects: projects.length,
    openTasks: openTasks.length,
    overdue: overdueTasks.length,
    completed: completedTasks?.length ?? 0,
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Hero banner with grid pattern ───────────────── */}
      <div className="relative overflow-hidden rounded-2xl px-6 py-8 sm:px-8 sm:py-10"
        style={{ background: "linear-gradient(135deg, #0f766e 0%, #0a5c55 60%, #064e46 100%)" }}
      >
        <GridPattern
          width={32} height={32}
          squares={[[2,2],[5,4],[8,1],[12,3],[3,6],[7,5],[11,2],[15,4],[4,8],[9,7],[13,5],[1,9]]}
          className={cn(
            "fill-white/0 stroke-white/10",
            "[mask-image:radial-gradient(600px_circle_at_top_right,white,transparent)]"
          )}
        />
        {/* Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-300/70">Workspace</p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Dashboard</h1>
            <p className="mt-1.5 text-sm text-white/50">Your projects, tasks, and current priorities.</p>
          </div>
          <Link href="/projects/new">
            <button className="inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 shadow-lg">
              <PlusIcon /> New Project
            </button>
          </Link>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────── */}
      <section className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        {statConfig.map(({ key, label, icon: Icon, color, bg, ring, accent }) => (
          <div
            key={key}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
          >
            {/* Subtle gradient strip top */}
            <div className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-80", accent, "to-transparent")} />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 truncate">{label}</p>
                <p className="mt-2.5 text-3xl font-bold text-slate-800">{statValues[key]}</p>
              </div>
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1", bg, ring, color)}>
                <Icon />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Tasks + Projects ─────────────────────────────── */}
      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">

        {/* My tasks */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">My Tasks</h2>
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-semibold text-slate-500">
              {tasks.length}
            </span>
          </div>

          {tasks.length === 0 ? (
            <EmptyState icon={<TaskIcon />} heading="No assigned tasks" subtext="Tasks assigned to you will appear here." />
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const overdue = isOverdue(task.due_date, task.status);
                const priorityDot = task.priority === "high" ? "bg-rose-500" : task.priority === "medium" ? "bg-amber-400" : "bg-emerald-400";
                return (
                  <Link key={task.id} href={`/projects/${task.project_id}`} className="block group">
                    <div className={cn(
                      "flex items-center gap-3 rounded-xl border bg-white px-4 py-3.5 shadow-card transition-all duration-150",
                      "group-hover:shadow-card-hover group-hover:-translate-y-0.5",
                      overdue ? "border-rose-200 bg-rose-50/50" : "border-slate-200 group-hover:border-teal-200"
                    )}>
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", priorityDot)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{task.title}</p>
                        <p className="text-xs text-slate-400">{task.projects?.name ?? "Project"}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <StatusBadge status={task.status} />
                        <span className={cn("text-xs font-medium", overdue ? "text-rose-600" : "text-slate-400")}>
                          {overdue ? "⚠ " : ""}{formatDate(task.due_date)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent projects */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">Recent Projects</h2>
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-semibold text-slate-500">
              {recentProjects.length}
            </span>
          </div>

          {recentProjects.length === 0 ? (
            <EmptyState
              icon={<FolderIcon />} heading="No projects yet" subtext="Create a project to start organising work."
              action={<Link href="/projects/new"><Button><PlusIcon /> New Project</Button></Link>}
            />
          ) : (
            <div className="space-y-2">
              {recentProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="block group">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-card transition-all duration-150 group-hover:shadow-card-hover group-hover:-translate-y-0.5 group-hover:border-teal-200">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-ethara-teal transition-colors">{project.name}</p>
                      {project.description && <p className="mt-0.5 truncate text-xs text-slate-400">{project.description}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MembersChip />{project.member_count}</span>
                      <span className="flex items-center gap-1"><ListChip />{project.task_count}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </section>
    </div>
  );
}
