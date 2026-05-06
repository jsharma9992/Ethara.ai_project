import { NextRequest } from "next/server";
import { apiResponse, apiError, requireProjectMember, requireProjectAdmin, paginatedResponse, getPaginationParams } from "@/lib/api-utils";
import { inviteMemberSchema, validate } from "@/lib/validations";
import type { ProjectMemberWithProfile } from "@/lib/types";

// GET /api/projects/[id]/members - List project members
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, error } = await requireProjectMember(params.id);
  if (error) return error;

  const { page, limit, offset } = getPaginationParams(new URL(request.url).searchParams);

  const { data: members, count } = await supabase
    .from("project_members")
    .select("*, profiles(id, full_name, email, avatar_url, created_at)", { count: "exact" })
    .eq("project_id", params.id)
    .order("joined_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (!members) {
    return apiResponse(paginatedResponse([], 0, page, limit));
  }

  return apiResponse(paginatedResponse(members as ProjectMemberWithProfile[], count ?? 0, page, limit));
}

// POST /api/projects/[id]/members - Invite member (admin only)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, error } = await requireProjectAdmin(params.id);
  if (error) return error;

  const body = await request.json();
  const validated = validate(inviteMemberSchema, body);
  if ("error" in validated) return apiError(validated.error);

  // Find user by email
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", validated.email.toLowerCase())
    .single();

  if (!profile) {
    return apiError("No user found with that email", 404);
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", params.id)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existing) {
    return apiError("User is already a project member", 400);
  }

  // Add as member
  const { data, error: insertError } = await supabase
    .from("project_members")
    .insert({ project_id: params.id, user_id: profile.id, role: "member" })
    .select("*, profiles(id, full_name, email, avatar_url, created_at)")
    .single();

  if (insertError) return apiError(insertError.message, 500);

  return apiResponse(data as ProjectMemberWithProfile, 201);
}
