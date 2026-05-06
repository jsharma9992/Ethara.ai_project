import { createClient } from "@/lib/supabase/server";
import type { ProjectRole } from "@/lib/types";

export async function getAuthedSupabase() {
  const supabase = createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) return { supabase, user: null, error: "You must be logged in." };
  return { supabase, user, error: null };
}

export async function getProjectRole(projectId: string, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data.role as ProjectRole;
}

export async function requireProjectRole(projectId: string, minimum: ProjectRole = "member") {
  const { supabase, user, error } = await getAuthedSupabase();
  if (error || !user) return { supabase, user: null, role: null, error };

  const role = await getProjectRole(projectId, user.id);
  if (!role) return { supabase, user, role: null, error: "You are not a member of this project." };
  if (minimum === "admin" && role !== "admin") {
    return { supabase, user, role, error: "Only project admins can perform this action." };
  }

  return { supabase, user, role, error: null };
}

export function sanitize(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}
