import { NextRequest } from "next/server";
import { apiResponse, apiError, requireProjectAdmin } from "@/lib/api-utils";
import { updateMemberRoleSchema, validate } from "@/lib/validations";
import type { ProjectMember } from "@/lib/types";

// PUT /api/projects/[id]/members/[memberId] - Update member role (admin only)
export async function PUT(request: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  const { user, supabase, error } = await requireProjectAdmin(params.id);
  if (error || !user) return error;

  const body = await request.json();
  const validated = validate(updateMemberRoleSchema, body);
  if ("error" in validated) return apiError(validated.error);

  // Get target member
  const { data: target } = await supabase
    .from("project_members")
    .select("id, user_id, role")
    .eq("id", params.memberId)
    .eq("project_id", params.id)
    .single();

  if (!target) {
    return apiError("Member not found", 404);
  }

  // Prevent demoting/removing last admin
  if (target.user_id === user.id && target.role === "admin" && validated.role === "member") {
    const { count } = await supabase
      .from("project_members")
      .select("id", { count: "exact", head: true })
      .eq("project_id", params.id)
      .eq("role", "admin");

    if ((count ?? 0) <= 1) {
      return apiError("Cannot demote yourself as the sole admin", 400);
    }
  }

  const { data, error: updateError } = await supabase
    .from("project_members")
    .update({ role: validated.role })
    .eq("id", params.memberId)
    .eq("project_id", params.id)
    .select("*")
    .single();

  if (updateError) return apiError(updateError.message, 500);

  return apiResponse(data as ProjectMember);
}

// DELETE /api/projects/[id]/members/[memberId] - Remove member (admin only)
export async function DELETE(_request: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  const { user, supabase, error } = await requireProjectAdmin(params.id);
  if (error || !user) return error;

  // Get target member
  const { data: target } = await supabase
    .from("project_members")
    .select("id, user_id, role")
    .eq("id", params.memberId)
    .eq("project_id", params.id)
    .single();

  if (!target) {
    return apiError("Member not found", 404);
  }

  // Prevent removing last admin
  if (target.user_id === user.id && target.role === "admin") {
    const { count } = await supabase
      .from("project_members")
      .select("id", { count: "exact", head: true })
      .eq("project_id", params.id)
      .eq("role", "admin");

    if ((count ?? 0) <= 1) {
      return apiError("Cannot remove yourself as the sole admin", 400);
    }
  }

  const { error: deleteError } = await supabase
    .from("project_members")
    .delete()
    .eq("id", params.memberId)
    .eq("project_id", params.id);

  if (deleteError) return apiError(deleteError.message, 500);

  return apiResponse({ id: params.memberId, deleted: true });
}
