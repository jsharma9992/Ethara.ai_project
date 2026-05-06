import { NextRequest } from "next/server";
import { apiResponse, apiError, requireProjectMember, requireProjectAdmin, paginatedResponse, getPaginationParams } from "@/lib/api-utils";
import { createTaskSchema, taskFilterSchema, validate } from "@/lib/validations";
import type { Task, TaskWithRelations } from "@/lib/types";

// GET /api/projects/[id]/tasks - List tasks with filtering, sorting, pagination
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, error } = await requireProjectMember(params.id);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const filter = validate(taskFilterSchema, Object.fromEntries(searchParams));
  if ("error" in filter) return apiError(filter.error);

  const { page, limit, offset } = getPaginationParams(searchParams);

  // Build query
  let query = supabase
    .from("tasks")
    .select(`
      *,
      assignee:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url, created_at),
      creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url, created_at)
    `, { count: "exact" })
    .eq("project_id", params.id);

  // Apply filters
  if (filter.status) {
    query = query.eq("status", filter.status);
  }
  if (filter.priority) {
    query = query.eq("priority", filter.priority);
  }
  if (filter.assigned_to) {
    query = query.eq("assigned_to", filter.assigned_to);
  }
  if (filter.search) {
    query = query.ilike("title", `%${filter.search}%`);
  }

  // Sorting
  const sortColumn = filter.sort_by;
  query = query.order(sortColumn, { ascending: filter.sort_order === "asc" });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: tasks, count } = await query;

  if (!tasks) {
    return apiResponse(paginatedResponse([], 0, page, limit));
  }

  return apiResponse(paginatedResponse(tasks as TaskWithRelations[], count ?? 0, page, limit));
}

// POST /api/projects/[id]/tasks - Create task (admin only)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, error } = await requireProjectAdmin(params.id);
  if (error || !user) return error;

  const body = await request.json();
  const validated = validate(createTaskSchema, body);
  if ("error" in validated) return apiError(validated.error);

  const { data, error: insertError } = await supabase
    .from("tasks")
    .insert({
      project_id: params.id,
      title: validated.title,
      description: validated.description ?? null,
      status: validated.status,
      priority: validated.priority,
      assigned_to: validated.assigned_to ?? null,
      due_date: validated.due_date ?? null,
      created_by: user.id,
    })
    .select(`
      *,
      assignee:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url, created_at)
    `)
    .single();

  if (insertError) return apiError(insertError.message, 500);

  return apiResponse(data as Task, 201);
}
