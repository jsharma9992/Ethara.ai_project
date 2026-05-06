import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ProjectRole } from "@/lib/types";

// API Response helpers
export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess(data?: Record<string, unknown>) {
  return NextResponse.json({ success: true, ...data });
}

// Auth helpers for API routes
export async function getAuthUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { user: null, supabase, error: "Unauthorized" };
  }
  return { user, supabase, error: null };
}

export async function requireAuth() {
  const { user, supabase, error } = await getAuthUser();
  if (error) {
    return { user: null, supabase, error: apiError(error, 401) };
  }
  return { user, supabase, error: null };
}

// Project role helpers
export async function getProjectRole(supabase: ReturnType<typeof createClient>, projectId: string, userId: string) {
  const { data, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data.role as ProjectRole;
}

export async function requireProjectMember(projectId: string) {
  const { user, supabase, error } = await requireAuth();
  if (error || !user) return { user: null, supabase, role: null, error };

  const role = await getProjectRole(supabase, projectId, user.id);
  if (!role) {
    return { user, supabase, role: null, error: apiError("Not a member of this project", 403) };
  }

  return { user, supabase, role, error: null };
}

export async function requireProjectAdmin(projectId: string) {
  const result = await requireProjectMember(projectId);
  if (result.error) return result;

  if (result.role !== "admin") {
    return { ...result, error: apiError("Admin access required", 403) };
  }

  return result;
}

// Pagination helper
export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
