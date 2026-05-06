import type { TaskPriority, TaskStatus } from "@/lib/types";
import { cn, getPriorityColor, getStatusColor } from "@/lib/utils";

const statusLabels: Record<TaskStatus, string> = {
  todo:        "Todo",
  in_progress: "In Progress",
  done:        "Done"
};

const priorityLabels: Record<TaskPriority, string> = {
  low:    "Low",
  medium: "Medium",
  high:   "High"
};

const statusDot: Record<TaskStatus, string> = {
  todo:        "bg-slate-400",
  in_progress: "bg-blue-500",
  done:        "bg-emerald-500"
};

const priorityDot: Record<TaskPriority, string> = {
  low:    "bg-emerald-400",
  medium: "bg-amber-400",
  high:   "bg-red-500"
};

export function StatusBadge({ status, dot = false }: { status: TaskStatus; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        getStatusColor(status)
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusDot[status])} />}
      {statusLabels[status]}
    </span>
  );
}

export function PriorityBadge({ priority, dot = false }: { priority: TaskPriority; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        getPriorityColor(priority)
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", priorityDot[priority])} />}
      {priorityLabels[priority]}
    </span>
  );
}

export function RoleBadge({ role, onDark = false }: { role: "admin" | "member"; onDark?: boolean }) {
  if (onDark) {
    return (
      <span className="inline-flex items-center rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
        {role === "admin" ? "Admin" : "Member"}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
        role === "admin"
          ? "border-teal-200 bg-teal-50 text-teal-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      )}
    >
      {role === "admin" ? "Admin" : "Member"}
    </span>
  );
}
