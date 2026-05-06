import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { RoleBadge } from "@/components/ui/Badge";
import type { ProjectWithCounts } from "@/lib/types";
import { formatDate } from "@/lib/utils";

/* Deterministic gradient from project ID */
const gradients = [
  "from-teal-400 to-cyan-500",
  "from-violet-400 to-purple-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-indigo-400 to-violet-500",
];

function getGradient(id: string) {
  const idx = id.charCodeAt(0) % gradients.length;
  return gradients[idx];
}

function MembersIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <circle cx="4.5" cy="4.5" r="2.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 11c0-1.93 1.57-3.5 3.5-3.5S8 9.07 8 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="10" cy="4.5" r="1.8" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 11c0-1.44-.9-2.66-2.5-2.66" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 6.5l1.8 1.8L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProjectCard({ project }: { project: ProjectWithCounts }) {
  const gradient = getGradient(project.id);

  return (
    <Link href={`/projects/${project.id}`} className="block group h-full">
      <div className="h-full rounded-xl border border-ethara-line bg-white shadow-card transition-all duration-200 group-hover:shadow-card-hover group-hover:-translate-y-0.5 overflow-hidden flex flex-col">
        {/* Gradient top strip */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

        <div className="flex flex-1 flex-col p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[15px] font-semibold leading-snug text-ethara-ink group-hover:text-ethara-teal transition-colors line-clamp-1">
              {project.name}
            </h2>
            {project.role ? <RoleBadge role={project.role} /> : null}
          </div>

          {/* Description */}
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
            {project.description || "No description yet."}
          </p>

          {/* Footer chips */}
          <div className="mt-4 flex items-center justify-between border-t border-ethara-line pt-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <MembersIcon />
                {project.member_count} member{project.member_count !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <TasksIcon />
                {project.task_count} task{project.task_count !== 1 ? "s" : ""}
              </span>
            </div>
            <span className="text-xs text-slate-300">
              {formatDate(project.created_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
