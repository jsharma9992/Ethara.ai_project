import { NextRequest } from "next/server";
import { apiResponse, apiError, requireProjectMember, paginatedResponse, getPaginationParams } from "@/lib/api-utils";
import type { ActivityLog } from "@/lib/types";

// GET /api/projects/[id]/activity - Get project activity log
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, error } = await requireProjectMember(params.id);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const { page, limit, offset } = getPaginationParams(searchParams);
  const taskId = searchParams.get("task_id");

  let query = supabase
    .from("activity_log")
    .select("*, profiles(id, full_name, email, avatar_url, created_at)", { count: "exact" })
    .eq("project_id", params.id)
    .order("created_at", { ascending: false });

  if (taskId) {
    query = query.eq("task_id", taskId);
  }

  query = query.range(offset, offset + limit - 1);

  const { data: activities, count } = await query;

  if (!activities) {
    return apiResponse(paginatedResponse([], 0, page, limit));
  }

  return apiResponse(paginatedResponse(activities as ActivityLog[], count ?? 0, page, limit));
}
