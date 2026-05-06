"use server";

import { revalidatePath } from "next/cache";
import { requireProjectRole, sanitize } from "@/app/actions/helpers";
import type { ActionResult, ProjectMember, ProjectRole } from "@/lib/types";

export async function inviteMember(projectId: string, formData: FormData): Promise<ActionResult<ProjectMember>> {
  const guard = await requireProjectRole(projectId, "admin");
  if (guard.error || !guard.user) return { success: false, error: guard.error ?? "Unauthorized." };

  const email = sanitize(formData.get("email")).toLowerCase();
  if (!email) return { success: false, error: "Email is required." };

  const { data: profile } = await guard.supabase.from("profiles").select("id").eq("email", email).single();
  if (!profile) return { success: false, error: "No user found with that email." };

  const { data: existing } = await guard.supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existing) return { success: false, error: "That user is already a project member." };

  const { data, error } = await guard.supabase
    .from("project_members")
    .insert({ project_id: projectId, user_id: profile.id, role: "member" })
    .select("*")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true, data: data as ProjectMember };
}

export async function updateMemberRole(
  projectId: string,
  memberId: string,
  role: ProjectRole
): Promise<ActionResult<ProjectMember>> {
  const guard = await requireProjectRole(projectId, "admin");
  if (guard.error || !guard.user) return { success: false, error: guard.error ?? "Unauthorized." };
  if (!["admin", "member"].includes(role)) return { success: false, error: "Choose a valid role." };

  const { data: target } = await guard.supabase
    .from("project_members")
    .select("id, user_id, role")
    .eq("id", memberId)
    .eq("project_id", projectId)
    .single();

  if (!target) return { success: false, error: "Member not found." };

  if (target.user_id === guard.user.id && target.role === "admin" && role === "member") {
    const { count } = await guard.supabase
      .from("project_members")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("role", "admin");

    if ((count ?? 0) <= 1) return { success: false, error: "You cannot demote yourself as the sole admin." };
  }

  const { data, error } = await guard.supabase
    .from("project_members")
    .update({ role })
    .eq("id", memberId)
    .eq("project_id", projectId)
    .select("*")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true, data: data as ProjectMember };
}

export async function removeMember(projectId: string, memberId: string): Promise<ActionResult<{ id: string }>> {
  const guard = await requireProjectRole(projectId, "admin");
  if (guard.error || !guard.user) return { success: false, error: guard.error ?? "Unauthorized." };

  const { data: target } = await guard.supabase
    .from("project_members")
    .select("id, user_id, role")
    .eq("id", memberId)
    .eq("project_id", projectId)
    .single();

  if (!target) return { success: false, error: "Member not found." };

  if (target.user_id === guard.user.id && target.role === "admin") {
    const { count } = await guard.supabase
      .from("project_members")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("role", "admin");

    if ((count ?? 0) <= 1) return { success: false, error: "You cannot remove yourself as the sole admin." };
  }

  const { error } = await guard.supabase.from("project_members").delete().eq("id", memberId).eq("project_id", projectId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { success: true, data: { id: memberId } };
}
