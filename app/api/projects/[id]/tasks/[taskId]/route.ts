import { NextRequest } from "next/server";
import { apiResponse, apiError, requireProjectMember, requireProjectAdmin } from "@/lib/api-utils";
import { updateTaskSchema, updateTaskStatusSchema, validate } from "@/lib/validations";
import type { Task } from "@/lib/types";

// GET /api/projects/[id]/tasks/[taskId] - Get single task
export async function GET(_request: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const { supabase, error } = await requireProjectMember(params.id);
  if (error) return error;

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select(`
      *,
      assignee:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url, created_at),
      creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url, created_at)
    `)
    .eq("id", params.taskId)
    .eq("project_id", params.id)
    .single();

  if (taskError || !task) {
    return apiError("Task not found", 404);
  }

  return apiResponse(task);
}

// PUT /api/projects/[id]/tasks/[taskId] - Update task (admin for full update, member for status only)
export async function PUT(request: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const { role, supabase, error } = await requireProjectMember(params.id);
  if (error) return error;

  const body = await request.json();

  // Members can only update status
  if (role !== "admin") {
    const validated = validate(updateTaskStatusSchema, body);
    if ("error" in validated) return apiError(validated.error);

    const { data, error: updateError } = await supabase
      .from("tasks")
      .update({ status: validated.status })
      .eq("id", params.taskId)
      .eq("project_id", params.id)
      .select("*")
      .single();

    if (updateError) return apiError(updateError.message, 500);
    return apiResponse(data as Task);
  }

  // Admins can update all fields
  const validated = validate(updateTaskSchema, body);
  if ("error" in validated) return apiError(validated.error);

  const updateData: Record<string, unknown> = {};
  if (validated.title !== undefined) updateData.title = validated.title;
  if (validated.description !== undefined) updateData.description = validated.description;
  if (validated.status !== undefined) updateData.status = validated.status;
  if (validated.priority !== undefined) updateData.priority = validated.priority;
  if (validated.assigned_to !== undefined) updateData.assigned_to = validated.assigned_to;
  if (validated.due_date !== undefined) updateData.due_date = validated.due_date;

  const { data, error: updateError } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", params.taskId)
    .eq("project_id", params.id)
    .select("*")
    .single();

  if (updateError) return apiError(updateError.message, 500);

  return apiResponse(data as Task);
}

// DELETE /api/projects/[id]/tasks/[taskId] - Delete task (admin only)
export async function DELETE(_request: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const { supabase, error } = await requireProjectAdmin(params.id);
  if (error) return error;

  const { error: deleteError } = await supabase
    .from("tasks")
    .delete()
    .eq("id", params.taskId)
    .eq("project_id", params.id);

  if (deleteError) return apiError(deleteError.message, 500);

  return apiResponse({ id: params.taskId, deleted: true });
}
