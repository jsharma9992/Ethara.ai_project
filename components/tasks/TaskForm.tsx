"use client";

import { useState, useTransition } from "react";
import { createTask, updateTask } from "@/app/actions/tasks";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import type { ProjectMemberWithProfile, Task, TaskPriority, TaskStatus } from "@/lib/types";

const labelCls = "block space-y-1.5";
const labelTextCls = "text-sm font-medium text-slate-700";
const selectCls =
  "h-10 w-full rounded-lg border border-ethara-line bg-white px-3 pr-8 text-sm text-ethara-ink appearance-none cursor-pointer transition focus:border-ethara-teal focus:ring-2 focus:ring-ethara-teal/20 focus:outline-none";

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  );
}

export function TaskForm({
  projectId,
  members,
  task,
  onDone
}: {
  projectId: string;
  members: ProjectMemberWithProfile[];
  task?: Task;
  onDone?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    if (!String(formData.get("title") ?? "").trim()) {
      setError("Task title is required.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = task
        ? await updateTask(projectId, task.id, formData)
        : await createTask(projectId, formData);
      if (!result.success) {
        setError(result.error ?? "Unable to save task.");
        return;
      }
      onDone?.();
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>
      ) : null}

      <Input
        label="Title"
        name="title"
        placeholder="What needs to be done?"
        defaultValue={task?.title ?? ""}
        autoFocus
      />
      <Textarea
        label="Description"
        name="description"
        placeholder="Add more detail… (optional)"
        defaultValue={task?.description ?? ""}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelCls}>
          <span className={labelTextCls}>Status</span>
          <SelectWrapper>
            <select
              name="status"
              defaultValue={(task?.status ?? "todo") satisfies TaskStatus}
              className={selectCls}
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </SelectWrapper>
        </label>

        <label className={labelCls}>
          <span className={labelTextCls}>Priority</span>
          <SelectWrapper>
            <select
              name="priority"
              defaultValue={(task?.priority ?? "medium") satisfies TaskPriority}
              className={selectCls}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </SelectWrapper>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelCls}>
          <span className={labelTextCls}>Assignee</span>
          <SelectWrapper>
            <select
              name="assigned_to"
              defaultValue={task?.assigned_to ?? ""}
              className={selectCls}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.profiles?.full_name ?? member.profiles?.email ?? "Member"}
                </option>
              ))}
            </select>
          </SelectWrapper>
        </label>

        <Input
          label="Due date"
          name="due_date"
          type="date"
          defaultValue={task?.due_date ?? ""}
        />
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-ethara-line pt-4">
        <Button loading={isPending} className="min-w-32">
          {task ? "Save changes" : "Add task"}
        </Button>
      </div>
    </form>
  );
}
