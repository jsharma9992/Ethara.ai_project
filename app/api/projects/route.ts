import { NextRequest } from "next/server";
import { apiResponse, apiError, requireAuth, paginatedResponse, getPaginationParams } from "@/lib/api-utils";
import { createProjectSchema, projectFilterSchema, validate } from "@/lib/validations";
import type { Project } from "@/lib/types";

// GET /api/projects - List user's projects with pagination and search
export async function GET(request: NextRequest) {
  const { user, supabase, error } = await requireAuth();
  if (error || !user) return error;

  const { searchParams } = new URL(request.url);
  const filter = validate(projectFilterSchema, Object.fromEntries(searchParams));
  if ("error" in filter) return apiError(filter.error);

  const { page, limit, offset } = getPaginationParams(searchParams);

  // Get user's project memberships
  let query = supabase
    .from("project_members")
    .select("role, projects(id, name, description, owner_id, created_at)", { count: "exact" })
    .eq("user_id", user.id);

  // Search in project name
  if (filter.search) {
    query = query.ilike("projects.name", `%${filter.search}%`);
  }

  // Sorting
  const sortColumn = filter.sort_by === "name" ? "projects.name" : "projects.created_at";
  // Note: Sorting on joined table requires raw query or post-processing
  // For simplicity, we'll sort after fetching

  const { data: memberships, count } = await query.range(offset, offset + limit - 1);

  if (!memberships) {
    return apiResponse(paginatedResponse([], 0, page, limit));
  }

  // Transform and sort
  let projects = memberships
    .filter((m: any) => m.projects)
    .map((m: any) => ({
      ...m.projects,
      role: m.role,
    })) as (Project & { role: string })[];

  // Sort in memory
  projects.sort((a, b) => {
    const aVal = filter.sort_by === "name" ? a.name : a.created_at;
    const bVal = filter.sort_by === "name" ? b.name : b.created_at;
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return filter.sort_order === "asc" ? cmp : -cmp;
  });

  // Get member and task counts
  const projectsWithCounts = await Promise.all(
    projects.map(async (project) => {
      const [{ count: memberCount }, { count: taskCount }] = await Promise.all([
        supabase.from("project_members").select("id", { count: "exact", head: true }).eq("project_id", project.id),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("project_id", project.id),
      ]);
      return { ...project, member_count: memberCount ?? 0, task_count: taskCount ?? 0 };
    })
  );

  return apiResponse(paginatedResponse(projectsWithCounts, count ?? 0, page, limit));
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  const { user, supabase, error } = await requireAuth();
  if (error || !user) return error;

  const body = await request.json();
  const validated = validate(createProjectSchema, body);
  if ("error" in validated) return apiError(validated.error);

  const projectId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // Create project
  const { error: projectError } = await supabase
    .from("projects")
    .insert({
      id: projectId,
      name: validated.name,
      description: validated.description ?? null,
      owner_id: user.id,
    });

  if (projectError) return apiError(projectError.message, 500);

  // Add creator as admin
  const { error: memberError } = await supabase
    .from("project_members")
    .insert({ project_id: projectId, user_id: user.id, role: "admin" });

  if (memberError) return apiError(memberError.message, 500);

  return apiResponse({
    id: projectId,
    name: validated.name,
    description: validated.description ?? null,
    owner_id: user.id,
    created_at: createdAt,
  }, 201);
}
