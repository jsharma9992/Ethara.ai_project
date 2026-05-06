# Ethara.ai — Project & Task Management Platform

A full-stack project management application built for internal team collaboration. It lets teams create projects, manage tasks with priority and due dates, invite members, and track progress — all with strict role-based access enforced at both the application and database level.

---

## What this project does

Managing work across a team without the bloat of enterprise tools was the core motivation here. Most project management software is either too heavy (Jira, Monday) or too simple (sticky notes, shared spreadsheets). This application sits in the middle — purpose-built, fast, and opinionated.

**The core workflow:**

A user signs up and creates a project. They immediately become that project's admin. From there, they can invite teammates by email, create tasks with titles, descriptions, priorities, assignees, and due dates, and track everything from a personal dashboard. Teammates invited as members can see all project data and update task statuses — but they can't restructure the project or its tasks.

Everything is scoped to project membership. You can only see projects you belong to. You can only touch tasks inside your projects. The database enforces this independently of the application layer.

---

## Features

### Authentication
- Email and password sign up with full name capture
- Secure login with inline validation and clear error messaging
- Sessions are stored in cookies and work correctly with server-side rendering
- Every protected route is gated at the middleware level — unauthenticated requests are redirected to login before any page code runs

### Dashboard
The dashboard gives each user a personal overview of their workload across all projects. It shows four live counters: total projects, open tasks assigned to them, overdue tasks, and completed tasks. Below that, two sections — one listing all tasks assigned to them (sorted by due date, with overdue tasks visually flagged), and one showing recently active projects with member and task counts.

### Projects
- Create a project with a name and optional description
- The creator is automatically added as admin
- Projects page shows all projects the user belongs to, with role, member count, and task count on each card
- Admins can edit project details or delete the project entirely

### Tasks
Each task has a title, description, status (Todo / In Progress / Done), priority (Low / Medium / High), assignee, and due date. Tasks are displayed with color-coded badges and a priority-colored left border strip so you can read the status at a glance. Overdue tasks are flagged with a warning indicator.

Admins have full control — create, edit, delete. Members can change the status of any task, which is the primary collaboration action. The status dropdown updates immediately on change without a full page reload.

Filtering is built into the task list — you can filter by status, priority, or assignee. The task count badge updates live as you apply filters.

### Team Management
Admins can invite any registered user to a project by email. Once invited, the new member appears in the member list immediately. Admins can promote members to admin or demote admins to member. There is a guard that prevents an admin from removing themselves or demoting themselves if they are the only admin on the project — the button is visibly disabled with a tooltip explaining why.

---

## Tech Stack

### Next.js 14 (App Router)
The entire application is built on Next.js 14 using the App Router. This was chosen because it makes it straightforward to mix server and client components in the same application. Pages that only need to read data are server components — they fetch directly from Supabase on the server with no client-side JavaScript overhead. Interactive pieces like task cards, forms, and the member list are client components.

The `output: "standalone"` configuration in `next.config.mjs` produces a self-contained production build that doesn't depend on `node_modules` at runtime, which is what makes container deployment on Railway work cleanly.

### TypeScript
The entire codebase is TypeScript. Every database entity has a corresponding interface in `lib/types.ts`. Server actions return a typed `ActionResult<T>` so that calling code always knows whether an action succeeded and what shape the data is. This eliminates a whole class of runtime errors.

### Supabase (PostgreSQL + Auth)
Supabase handles both the database and authentication. The database is PostgreSQL with Row-Level Security (RLS) policies that act as a second layer of authorization — even if the application layer had a bug, a user could not read or write another user's project data through the database. Authentication uses Supabase Auth with email and password, and sessions are managed through the `@supabase/ssr` package which handles the cookie-based session correctly in a server-rendered Next.js app.

### Server Actions
All data mutations happen through Next.js Server Actions. There is no separate API layer. When a user submits a form or clicks a button that changes data, the action runs on the server, validates the user's permissions, sanitizes the input, writes to the database, and revalidates the relevant Next.js cache paths. This pattern keeps the data flow simple and the authorization logic centralized.

### Tailwind CSS
Styling is done with Tailwind CSS. The design system uses a custom color palette defined in `tailwind.config.ts` — the primary teal (`ethara-teal`) is `#0f766e`, and all other colors flow from that. The visual design uses gradient headers with SVG grid patterns as background textures, glassmorphism on the auth pages, and lift animations on interactive cards.

---

## Architecture

```
/app
  /auth/login          ← Public. Email + password login form.
  /auth/signup         ← Public. Full name, email, password registration.
  /dashboard           ← Protected. Personal task and project overview.
  /projects            ← Protected. All projects the user belongs to.
  /projects/new        ← Protected. Create a new project.
  /projects/[id]       ← Protected. Task list + member list for one project.
  /actions             ← Server Actions (projects, tasks, members).
  layout.tsx           ← Root layout with sidebar navigation.

/components
  /layout/AppShell     ← Sidebar, mobile header, auth page wrapper.
  /ui                  ← Button, Card, Badge, Input, Modal, Toast, EmptyState, GridPattern.
  /projects            ← ProjectCard, ProjectForm, ProjectHeaderActions.
  /tasks               ← TaskList, TaskCard, TaskForm.
  /members             ← MemberList.

/lib
  /supabase
    client.ts          ← Browser-side Supabase client.
    server.ts          ← Server-side Supabase client + getCurrentUserProfile().
    middleware.ts       ← Session refresh + route protection logic.
  types.ts             ← TypeScript interfaces for all database entities.
  utils.ts             ← Date formatting, color helpers, cn(), initials().

middleware.ts          ← Next.js middleware — intercepts all requests and enforces auth.
railway.toml           ← Railway deployment configuration.
```

---

## Database Schema

### `profiles`
Mirrors `auth.users`. Created automatically on signup via a Supabase trigger. Stores the user's display name, email, and avatar URL.

### `projects`
Each project has a name, optional description, and an `owner_id` pointing to the user who created it.

### `project_members`
The join table between users and projects. Every user who has access to a project has a row here with their role — either `admin` or `member`. This table is what RLS policies check to determine whether a database operation is permitted.

### `tasks`
Tasks belong to a project. Each task has a title, description, status (`todo` / `in_progress` / `done`), priority (`low` / `medium` / `high`), an optional assignee, an optional due date, and references to who created it.

---

## Security Model

Authorization is enforced at two independent layers:

**Application layer (Server Actions):** Every Server Action calls `requireProjectRole()` before touching the database. This function checks that the current user is authenticated and has the required role (admin or member) for the given project. If not, it returns an error immediately.

**Database layer (Row-Level Security):** Supabase RLS policies are defined on every table. A user can only select, insert, update, or delete rows where they have a corresponding membership in `project_members`. Even a direct database query from a compromised client cannot bypass this — the policies run inside PostgreSQL.

The combination means there is no single point of failure. A bug in the Server Action authorization would be caught by RLS, and vice versa.

---

## Role Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ (becomes admin) | ✅ (becomes admin) |
| Edit / delete project | ✅ | ❌ |
| Invite members | ✅ | ❌ |
| Remove members | ✅ | ❌ |
| Change member role | ✅ | ❌ |
| Create / edit / delete tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ |
| View all project data | ✅ | ✅ |
| View personal dashboard | ✅ | ✅ |

---

## Deployment

The application is configured for deployment on Railway. The `railway.toml` file specifies the build command (`npm run build`) and start command (`npm start`). Next.js produces a standalone output that runs as a Node.js server.

Two environment variables are required:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These are set in Railway's environment variable dashboard. Every push to the main branch triggers an automatic redeploy.

---

## Design Decisions Worth Noting

**No separate API routes.** Server Actions replace what would traditionally be `POST /api/tasks`, `DELETE /api/projects/:id`, and so on. This cuts down the amount of code significantly and keeps authorization logic in one place rather than scattered across route handlers.

**Server components for data fetching.** Pages that only display data are async server components that fetch directly from Supabase. This means the HTML arrives fully rendered — there is no loading spinner on the initial page load for data.

**Standalone Next.js output.** Using `output: "standalone"` in the Next.js config means the production build includes only the files needed to run the server, not the full `node_modules` tree. This produces a smaller, faster Docker-friendly artifact.

**Deterministic project color theming.** Each project's detail page has a unique gradient header color derived from the project's UUID. This is done without storing any color preference — the first character of the ID maps to one of seven gradients. It makes the UI feel more personalized without any additional data.

---

## What's not in v1

Real-time updates (live task status changes without refresh), file attachments, task comments, email notifications, OAuth login, and a Kanban board view are all intentionally out of scope. The goal was a complete, well-executed feature set rather than an incomplete one with more surface area.
