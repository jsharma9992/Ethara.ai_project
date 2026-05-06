"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskForm } from "@/components/tasks/TaskForm";
import type { ProjectMemberWithProfile, TaskPriority, TaskStatus, TaskWithRelations } from "@/lib/types";

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function TaskIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.5 11l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const selectCls =
  "h-9 rounded-lg border border-ethara-line bg-white px-3 pr-8 text-sm text-ethara-ink appearance-none cursor-pointer transition focus:border-ethara-teal focus:ring-2 focus:ring-ethara-teal/20 focus:outline-none";

export function TaskList({
  projectId,
  tasks,
  members,
  isAdmin
}: {
  projectId: string;
  tasks: TaskWithRelations[];
  members: ProjectMemberWithProfile[];
  isAdmin: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [priority, setPriority] = useState<TaskPriority | "all">("all");
  const [assignee, setAssignee] = useState("all");

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (status !== "all" && task.status !== status) return false;
        if (priority !== "all" && task.priority !== priority) return false;
        if (assignee !== "all" && (task.assigned_to ?? "") !== assignee) return false;
        return true;
      }),
    [assignee, priority, status, tasks]
  );

  return (
    <section className="space-y-4">
      {/* Header + Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ethara-ink">
            Tasks
            <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-semibold text-slate-500">
              {filteredTasks.length}
            </span>
          </h2>
          {isAdmin ? (
            <Button size="sm" onClick={() => setAdding(true)}>
              <PlusIcon />
              Add Task
            </Button>
          ) : null}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus | "all")}
              className={selectCls}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </span>
          </div>

          <div className="relative">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority | "all")}
              className={selectCls}
              aria-label="Filter by priority"
            >
              <option value="all">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </span>
          </div>

          <div className="relative">
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className={selectCls}
              aria-label="Filter by assignee"
            >
              <option value="all">All assignees</option>
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.profiles?.full_name ?? member.profiles?.email ?? "Member"}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </span>
          </div>
        </div>
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<TaskIcon />}
          heading="No tasks found"
          subtext="Tasks matching your filters will appear here."
        />
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} projectId={projectId} isAdmin={isAdmin} members={members} />
          ))}
        </div>
      )}

      <Modal open={adding} title="Add task" onClose={() => setAdding(false)}>
        <TaskForm projectId={projectId} members={members} onDone={() => setAdding(false)} />
      </Modal>
    </section>
  );
}
