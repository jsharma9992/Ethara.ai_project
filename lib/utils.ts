import type { TaskPriority, TaskStatus } from "@/lib/types";

function parseDateValue(value: string | null | undefined) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T00:00:00` : trimmed;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(date: string | null | undefined) {
  const parsed = parseDateValue(date);
  if (!parsed) return "No date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parsed);
}

export function isOverdue(dueDate: string | null | undefined, status?: TaskStatus) {
  if (!dueDate || status === "done") return false;

  const parsed = parseDateValue(dueDate);
  if (!parsed) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return parsed < today;
}

export function getPriorityColor(priority: TaskPriority) {
  const colors: Record<TaskPriority, string> = {
    low: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    high: "bg-red-100 text-red-800 border-red-200"
  };
  return colors[priority];
}

export function getStatusColor(status: TaskStatus) {
  const colors: Record<TaskStatus, string> = {
    todo: "bg-gray-100 text-gray-700 border-gray-200",
    in_progress: "bg-blue-100 text-blue-800 border-blue-200",
    done: "bg-green-100 text-green-800 border-green-200"
  };
  return colors[status];
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function cleanString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
