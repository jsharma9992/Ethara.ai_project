"use server";

import { revalidatePath } from "next/cache";
import { getAuthedSupabase, requireProjectRole, sanitize } from "@/app/actions/helpers";
import type { ActionResult, Project } from "@/lib/types";

export async function createProject(formData: FormData): Promise<ActionResult<Project>> {
  const { supabase, user, error } = await getAuthedSupabase();
  if (error || !user) return { success: false, error };

  const name = sanitize(formData.get("name"));
  const description = sanitize(formData.get("description")) || null;
  if (!name) return { success: false, error: "Project name is required." };

  const projectId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const { error: projectError } = await supabase
    .from("projects")
    .insert({ id: projectId, name, description, owner_id: user.id });

  if (projectError) return { success: false, error: projectError.message };

  const { error: memberError } = await supabase
    .from("project_members")
    .insert({ project_id: projectId, user_id: user.id, role: "admin" });

  if (memberError) return { success: false, error: memberError.message };

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return {
    success: true,
    data: { id: projectId, name, description, owner_id: user.id, created_at: createdAt } as Project
  };
}

export async function updateProject(projectId: string, formData: FormData): Promise<ActionResult<Project>> {
  const guard = await requireProjectRole(projectId, "admin");
  if (guard.error || !guard.user) return { success: false, error: guard.error ?? "Unauthorized." };

  const name = sanitize(formData.get("name"));
  const description = sanitize(formData.get("description")) || null;
  if (!name) return { success: false, error: "Project name is required." };

  const { data, error } = await guard.supabase
    .from("projects")
    .update({ name, description })
    .eq("id", projectId)
    .select("*")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { success: true, data: data as Project };
}

export async function deleteProject(projectId: string): Promise<ActionResult<{ id: string }>> {
  const guard = await requireProjectRole(projectId, "admin");
  if (guard.error || !guard.user) return { success: false, error: guard.error ?? "Unauthorized." };

  const { error } = await guard.supabase.from("projects").delete().eq("id", projectId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true, data: { id: projectId } };
}
