import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name too long"),
  description: z.string().max(500, "Description too long").optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name too long"),
  description: z.string().max(500, "Description too long").nullable(),
});

// Task schemas
export const taskPrioritySchema = z.enum(["low", "medium", "high"]);
export const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);

export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  status: taskStatusSchema.default("todo"),
  priority: taskPrioritySchema.default("medium"),
  assigned_to: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200, "Title too long").optional(),
  description: z.string().max(2000, "Description too long").nullable().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: taskStatusSchema,
});

// Member schemas
export const projectRoleSchema = z.enum(["admin", "member"]);

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const updateMemberRoleSchema = z.object({
  role: projectRoleSchema,
});

// Comment schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment too long"),
});

// Pagination & filtering schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const taskFilterSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigned_to: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  sort_by: z.enum(["created_at", "due_date", "priority", "title"]).default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export const projectFilterSchema = z.object({
  search: z.string().max(100).optional(),
  sort_by: z.enum(["created_at", "name"]).default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

// API response helper types
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Validation helper
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T | { error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Validation failed" };
  }
  return result.data;
}
