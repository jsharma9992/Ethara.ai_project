"use client";

import { useState, useTransition } from "react";
import { deleteTask, updateTaskStatus } from "@/app/actions/tasks";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { TaskForm } from "@/components/tasks/TaskForm";
import type { ProjectMemberWithProfile, TaskStatus, TaskWithRelations } from "@/lib/types";
import { cn, formatDate, initials, isOverdue } from "@/lib/utils";

const priorityBorderColor: Record<string, string> = {
  high:   "border-l-red-400",
  medium: "border-l-amber-400",
  low:    "border-l-emerald-400"
};

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M8.5 2L11 4.5L4 11.5H1.5V9L8.5 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M2 3H11M4.5 3V2H8.5V3M5 5.5V9.5M8 5.5V9.5M2.5 3L3 11C3 11.55 3.45 12 4 12H9C9.55 12 10 11.55 10 11L10.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const selectCls =
  "h-8 rounded-lg border border-ethara-line bg-white px-3 pr-7 text-xs text-ethara-ink appearance-none cursor-pointer transition focus:border-ethara-teal focus:ring-2 focus:ring-ethara-teal/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

export function TaskCard({
  task,
  projectId,
  isAdmin,
  members
}: {
  task: TaskWithRelations;
  projectId: string;
  isAdmin: boolean;
  members: ProjectMemberWithProfile[];
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const overdue = isOverdue(task.due_date, task.status);
  const assigneeName = task.assignee?.full_name ?? task.assignee?.email ?? null;
  const assigneeInitials = assigneeName ? initials(assigneeName) : null;

  function changeStatus(status: TaskStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateTaskStatus(projectId, task.id, status);
      if (!result.success) setError(result.error ?? "Unable to update status.");
    });
  }

  function removeTask() {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteTask(projectId, task.id);
      if (!result.success) setError(result.error ?? "Unable to delete task.");
    });
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border border-l-4 bg-white shadow-card transition-all duration-150",
        priorityBorderColor[task.priority] ?? "border-l-slate-300",
        overdue ? "border-red-200 bg-red-50/40" : "border-ethara-line hover:shadow-card-hover"
      )}
    >
      {/* Error alert */}
      {error ? (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-auto shrink-0 text-red-400 hover:text-red-600">×</button>
        </div>
      ) : null}

      <div className="p-3 sm:p-4">
        {/* Title + badges */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[14px] text-ethara-ink leading-snug">{task.title}</h3>
            {task.description ? (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                {task.description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-shrink-0 flex-wrap items-center gap-1.5">
            <StatusBadge status={task.status} dot />
            <PriorityBadge priority={task.priority} dot />
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ethara-line pt-3 text-xs text-slate-400">
          {/* Assignee */}
          <div className="flex items-center gap-2">
            {assigneeInitials ? (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ethara-teal/10 text-[10px] font-bold text-ethara-teal">
                {assigneeInitials}
              </div>
            ) : (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] text-slate-400">
                ?
              </div>
            )}
            <span className="truncate">{assigneeName ?? "Unassigned"}</span>
          </div>

          {/* Due date */}
          <span className={cn("font-medium", overdue ? "text-red-600" : "text-slate-400")}>
            {overdue ? "⚠ " : ""}{formatDate(task.due_date)}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {/* Status select */}
          <div className="relative w-full sm:w-auto">
            <select
              value={task.status}
              onChange={(e) => changeStatus(e.target.value as TaskStatus)}
              disabled={isPending}
              className={cn(selectCls, "w-full sm:w-auto")}
              aria-label="Change task status"
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            {isPending ? (
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin rounded-full border-2 border-ethara-teal border-t-transparent" />
            ) : (
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
              </span>
            )}
          </div>

          {isAdmin ? (
            <div className="flex gap-2 sm:ml-auto">
              <Button type="button" variant="secondary" size="sm" onClick={() => { setEditing(true); setError(null); }}>
                <EditIcon />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={isPending}
                onClick={removeTask}
              >
                <TrashIcon />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <Modal open={editing} title="Edit task" onClose={() => setEditing(false)}>
        <TaskForm projectId={projectId} members={members} task={task} onDone={() => setEditing(false)} />
      </Modal>
    </div>
  );
}
