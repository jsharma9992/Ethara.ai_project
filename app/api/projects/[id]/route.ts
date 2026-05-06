import { NextRequest } from "next/server";
import { apiResponse, apiError, requireProjectMember, requireProjectAdmin } from "@/lib/api-utils";
import { updateProjectSchema, validate } from "@/lib/validations";

// GET /api/projects/[id] - Get project details
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, role, error } = await requireProjectMember(params.id);
  if (error) return error;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .single();

  if (projectError || !project) {
    return apiError("Project not found", 404);
  }

  // Get counts
  const [{ count: memberCount }, { count: taskCount }] = await Promise.all([
    supabase.from("project_members").select("id", { count: "exact", head: true }).eq("project_id", params.id),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("project_id", params.id),
  ]);

  return apiResponse({
    ...project,
    role,
    member_count: memberCount ?? 0,
    task_count: taskCount ?? 0,
  });
}

// PUT /api/projects/[id] - Update project (admin only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, error } = await requireProjectAdmin(params.id);
  if (error) return error;

  const body = await request.json();
  const validated = validate(updateProjectSchema, body);
  if ("error" in validated) return apiError(validated.error);

  const { data, error: updateError } = await supabase
    .from("projects")
    .update({
      name: validated.name,
      description: validated.description,
    })
    .eq("id", params.id)
    .select("*")
    .single();

  if (updateError) return apiError(updateError.message, 500);

  return apiResponse(data);
}

// DELETE /api/projects/[id] - Delete project (admin only)
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, error } = await requireProjectAdmin(params.id);
  if (error) return error;

  const { error: deleteError } = await supabase
    .from("projects")
    .delete()
    .eq("id", params.id);

  if (deleteError) return apiError(deleteError.message, 500);

  return apiResponse({ id: params.id, deleted: true });
}
