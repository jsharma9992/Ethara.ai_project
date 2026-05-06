import { NextRequest } from "next/server";
import { apiResponse, apiError, requireProjectMember, paginatedResponse, getPaginationParams } from "@/lib/api-utils";
import { createCommentSchema, validate } from "@/lib/validations";
import type { TaskComment } from "@/lib/types";

// GET /api/projects/[id]/tasks/[taskId]/comments - List comments
export async function GET(request: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const { supabase, error } = await requireProjectMember(params.id);
  if (error) return error;

  const { page, limit, offset } = getPaginationParams(new URL(request.url).searchParams);

  // Verify task belongs to project
  const { data: task } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", params.taskId)
    .eq("project_id", params.id)
    .single();

  if (!task) {
    return apiError("Task not found", 404);
  }

  const { data: comments, count } = await supabase
    .from("task_comments")
    .select("*, profiles(id, full_name, email, avatar_url, created_at)", { count: "exact" })
    .eq("task_id", params.taskId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (!comments) {
    return apiResponse(paginatedResponse([], 0, page, limit));
  }

  return apiResponse(paginatedResponse(comments as TaskComment[], count ?? 0, page, limit));
}

// POST /api/projects/[id]/tasks/[taskId]/comments - Create comment
export async function POST(request: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const { user, supabase, error } = await requireProjectMember(params.id);
  if (error) return error;
  if (!user) return apiError("Unauthorized", 401);

  // Verify task belongs to project
  const { data: task } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", params.taskId)
    .eq("project_id", params.id)
    .single();

  if (!task) {
    return apiError("Task not found", 404);
  }

  const body = await request.json();
  const validated = validate(createCommentSchema, body);
  if ("error" in validated) return apiError(validated.error);

  const { data, error: insertError } = await supabase
    .from("task_comments")
    .insert({
      task_id: params.taskId,
      user_id: user.id,
      content: validated.content,
    })
    .select("*, profiles(id, full_name, email, avatar_url, created_at)")
    .single();

  if (insertError) return apiError(insertError.message, 500);

  // Log activity
  await supabase.rpc("log_activity", {
    p_project_id: params.id,
    p_task_id: params.taskId,
    p_action: "commented",
    p_entity_type: "comment",
    p_entity_id: data.id,
    p_details: { content_preview: validated.content.substring(0, 50) },
  });

  return apiResponse(data as TaskComment, 201);
}
