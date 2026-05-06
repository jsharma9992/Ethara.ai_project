"use server";

import { revalidatePath } from "next/cache";
import { requireProjectRole, sanitize } from "@/app/actions/helpers";
import type { ActionResult, Task, TaskPriority, TaskStatus } from "@/lib/types";

const statuses: TaskStatus[] = ["todo", "in_progress", "done"];
const priorities: TaskPriority[] = ["low", "medium", "high"];

function parseTask(formData: FormData) {
  const title = sanitize(formData.get("title"));
  const status = sanitize(formData.get("status")) as TaskStatus;
  const priority = sanitize(formData.get("priority")) as TaskPriority;
  const assignedTo = sanitize(formData.get("assigned_to")) || null;
  const dueDate = sanitize(formData.get("due_date")) || null;

  if (!title) return { error: "Task title is required." };
  if (!statuses.includes(status)) return { error: "Choose a valid task status." };
  if (!priorities.includes(priority)) return { error: "Choose a valid priority." };

  return {
    data: {
      title,
      description: sanitize(formData.get("description")) || null,
      status,
      priority,
      assigned_to: assignedTo,
      due_date: dueDate
    }
  };
}

export async function createTask(projectId: string, formData: FormData): Promise<ActionResult<Task>> {
  const guard = await requireProjectRole(projectId, "admin");
  if (guard.error || !guard.user) return { success: false, error: guard.error ?? "Unauthorized." };

  const parsed = parseTask(formData);
  if (parsed.error || !parsed.data) return { success: false, error: parsed.error };

  const { data, error } = await guard.supabase
    .from("tasks")
    .insert({ ...parsed.data, project_id: projectId, created_by: guard.user.id })
    .select("*")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { success: true, data: data as Task };
}

export async function updateTask(projectId: string, taskId: string, formData: FormData): Promise<ActionResult<Task>> {
  const guard = await requireProjectRole(projectId, "admin");
  if (guard.error || !guard.user) return { success: false, error: guard.error ?? "Unauthorized." };

  const parsed = parseTask(formData);
  if (parsed.error || !parsed.data) return { success: false, error: parsed.error };

  const { data, error } = await guard.supabase
    .from("tasks")
    .update(parsed.data)
    .eq("id", taskId)
    .eq("project_id", projectId)
    .select("*")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { success: true, data: data as Task };
}

export async function updateTaskStatus(
  projectId: string,
  taskId: string,
  status: TaskStatus
): Promise<ActionResult<Task>> {
  const guard = await requireProjectRole(projectId, "member");
  if (guard.error || !guard.user) return { success: false, error: guard.error ?? "Unauthorized." };
  if (!statuses.includes(status)) return { success: false, error: "Choose a valid task status." };

  const { data, error } = await guard.supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("project_id", projectId)
    .select("*")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { success: true, data: data as Task };
}

export async function deleteTask(projectId: string, taskId: string): Promise<ActionResult<{ id: string }>> {
  const guard = await requireProjectRole(projectId, "admin");
  if (guard.error || !guard.user) return { success: false, error: guard.error ?? "Unauthorized." };

  const { error } = await guard.supabase.from("tasks").delete().eq("id", taskId).eq("project_id", projectId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { success: true, data: { id: taskId } };
}
