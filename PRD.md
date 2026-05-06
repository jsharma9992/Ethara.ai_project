# PRD — Project Management Platform
**Product:** Ethara.ai Internal Project & Task Manager  
**Version:** 1.0.0  
**Status:** In Development  
**Last Updated:** May 2026  
**Owner:** Ethara.ai Engineering

---

## 1. Overview

### 1.1 Purpose
A lightweight, internal project management tool for Ethara.ai teams to create projects, assign tasks, track progress, and collaborate — with clear role-based access control.

### 1.2 Problem Statement
Teams need a simple, focused tool to manage work across projects without the overhead of heavyweight platforms. The goal is to keep it lean, fast, and purpose-built for Ethara.ai workflows.

### 1.3 Goals
- Enable teams to create and manage projects end-to-end
- Allow task creation, assignment, prioritization, and status tracking
- Enforce role-based access (Admin vs Member) at both UI and database level
- Provide a clear dashboard view of work across all projects

### 1.4 Non-Goals
- Time tracking
- File attachments / document storage
- Real-time collaboration (live cursors, comments)
- Third-party integrations (Slack, GitHub, etc.) in v1
- Mobile native app

---

## 2. Users & Roles

### 2.1 User Types

| Role | Description |
|------|-------------|
| **Admin** | Project creator or promoted member. Full CRUD on the project, tasks, and team. |
| **Member** | Invited collaborator. Can view all project data and update task status only. |

### 2.2 Role Permissions Matrix

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ✅ (becomes admin) |
| Edit project details | ✅ | ❌ |
| Delete project | ✅ | ❌ |
| Invite members | ✅ | ❌ |
| Remove members | ✅ | ❌ |
| Change member role | ✅ | ❌ |
| Create task | ✅ | ❌ |
| Edit task | ✅ | ❌ |
| Delete task | ✅ | ❌ |
| Update task status | ✅ | ✅ |
| View all tasks | ✅ | ✅ |
| View dashboard | ✅ | ✅ |

---

## 3. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Styling | Tailwind CSS |
| Hosting | Vercel (recommended) |

---

## 4. Database Schema

### 4.1 Tables

#### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | FK → auth.users |
| full_name | text | Required |
| email | text | Required, unique |
| avatar_url | text | Nullable |
| created_at | timestamp | Auto |

#### `projects`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | Required |
| description | text | Nullable |
| owner_id | uuid | FK → profiles |
| created_at | timestamp | Auto |

#### `project_members`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| project_id | uuid | FK → projects |
| user_id | uuid | FK → profiles |
| role | text | `'admin'` or `'member'` |
| joined_at | timestamp | Auto |

#### `tasks`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| project_id | uuid | FK → projects |
| title | text | Required |
| description | text | Nullable |
| status | text | `'todo'` / `'in_progress'` / `'done'` |
| priority | text | `'low'` / `'medium'` / `'high'` |
| assigned_to | uuid | FK → profiles, nullable |
| due_date | date | Nullable |
| created_by | uuid | FK → profiles |
| created_at | timestamp | Auto |
| updated_at | timestamp | Auto-updated |

### 4.2 Row-Level Security (RLS) Rules
- Users can only read/write data for projects they're members of
- Only admins can insert/update/delete tasks
- Members can only update the `status` field on tasks
- Profiles are readable by any authenticated user
- All mutations validated server-side before hitting the DB

---

## 5. Feature Specifications

### 5.1 Authentication

**Signup (`/auth/signup`)**
- Fields: Full Name, Email, Password
- Validations: valid email format, password min 8 chars
- On success: auto-creates `profiles` row → redirect to `/dashboard`

**Login (`/auth/login`)**
- Fields: Email, Password
- On success: redirect to `/dashboard`
- Error: show inline message for invalid credentials

**Session Management**
- Supabase session stored in cookies (SSR-compatible)
- Middleware protects all `/dashboard` and `/projects` routes
- Unauthenticated users redirected to `/auth/login`

---

### 5.2 Dashboard (`/dashboard`)

**Summary Cards (top row)**
- Total Projects (user is a member of)
- My Open Tasks (assigned to me, not done)
- Overdue Tasks (due_date < today, status ≠ done)
- Completed Tasks (status = done, across all projects)

**My Tasks Section**
- List of tasks assigned to the current user
- Shows: task title, project name, status badge, priority badge, due date
- Overdue tasks highlighted in red
- Clickable → navigates to project detail

**Recent Projects Section**
- Last 5 projects the user is a member of
- Shows: project name, member count, task count
- Quick link to project detail page

---

### 5.3 Projects

**Project List (`/projects`)**
- All projects the user belongs to
- Each card: project name, description, role badge, member count, task count
- "New Project" button (top right)
- Empty state if no projects

**Create Project (`/projects/new`)**
- Fields: Name (required), Description (optional)
- On create: user auto-added as admin → redirect to `/projects/[id]`

**Project Detail (`/projects/[id]`)**
- Project header: name, description, edit button (admin only)
- Tabs or sections: Tasks | Members
- Task list with filters (by status, priority, assignee)
- Member list with roles

---

### 5.4 Task Management

**Task Card displays:**
- Title, description (truncated)
- Status badge: `Todo` / `In Progress` / `Done`
- Priority badge: `Low` / `Medium` / `High`
- Assigned user avatar + name
- Due date (red if overdue)

**Create Task (Admin only)**
- Fields: Title*, Description, Status, Priority, Assignee (dropdown of project members), Due Date
- Inline form or modal

**Edit Task (Admin only)**
- Same fields as create
- Pre-populated with existing values

**Delete Task (Admin only)**
- Confirmation prompt before deletion

**Update Status (Admin + Member)**
- Dropdown on task card to change status
- Saves immediately on change

---

### 5.5 Team Management (Admin only)

**Member List**
- Shows: avatar, name, email, role badge
- Admin can change role (promote/demote)
- Admin can remove member (cannot remove self if sole admin)

**Invite Member**
- Input: email address
- Looks up existing profile by email
- Adds to `project_members` with `member` role
- Error if user not found or already a member

---

## 6. UI & Design

### 6.1 Layout
- **Sidebar** (desktop): Logo, Dashboard, Projects, User info, Logout
- **Top bar** (mobile): Hamburger menu
- **Main content**: Full-width with max-width container

### 6.2 Components
- `Button` — primary, secondary, danger variants
- `Badge` — status and priority badges with color coding
- `Card` — project and task cards
- `Input` / `Textarea` — form fields with error states
- `Modal` — for task create/edit forms
- `Toast` — success/error notifications
- `EmptyState` — illustrated empty states for lists

### 6.3 Status Color Coding
| Status | Color |
|--------|-------|
| Todo | Gray |
| In Progress | Blue |
| Done | Green |
| Overdue | Red |

### 6.4 Priority Color Coding
| Priority | Color |
|----------|-------|
| Low | Green |
| Medium | Yellow/Amber |
| High | Red |

---

## 7. Project Structure

```
/app
  /auth
    /login/page.tsx
    /signup/page.tsx
  /dashboard/page.tsx
  /projects
    /page.tsx
    /new/page.tsx
    /[id]/page.tsx
  layout.tsx
  page.tsx              ← redirects to /dashboard

/components
  /ui                   ← Button, Badge, Card, Input, Modal, Toast
  /layout               ← Sidebar, Navbar
  /projects             ← ProjectCard, ProjectForm
  /tasks                ← TaskCard, TaskForm, TaskList
  /members              ← MemberList, InviteMember

/lib
  /supabase
    client.ts           ← browser client
    server.ts           ← server component client
    middleware.ts        ← auth middleware
  types.ts              ← all TypeScript interfaces
  utils.ts              ← helpers (date formatting, etc.)

/hooks
  useAuth.ts
  useProjects.ts
  useTasks.ts

middleware.ts           ← Next.js route protection
```

---

## 8. API / Data Layer

All data mutations go through **Next.js Server Actions** for consistency and security.

### Key Actions
| Action | File | Auth Check |
|--------|------|------------|
| createProject | actions/projects.ts | Authenticated |
| updateProject | actions/projects.ts | Admin of project |
| deleteProject | actions/projects.ts | Admin of project |
| createTask | actions/tasks.ts | Admin of project |
| updateTask | actions/tasks.ts | Admin of project |
| updateTaskStatus | actions/tasks.ts | Member of project |
| deleteTask | actions/tasks.ts | Admin of project |
| inviteMember | actions/members.ts | Admin of project |
| updateMemberRole | actions/members.ts | Admin of project |
| removeMember | actions/members.ts | Admin of project |

---

## 9. Validations

### Client-side
- Required field checks before form submission
- Email format validation
- Date picker prevents invalid ranges

### Server-side (Server Actions)
- Re-validate role permissions on every mutation
- Verify project membership before any data access
- Sanitize all string inputs
- Return typed error messages to the UI

---

## 10. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 11. Milestones

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1** | Supabase schema + RLS + types | 🔲 Todo |
| **Phase 2** | Auth (signup, login, middleware) | 🔲 Todo |
| **Phase 3** | Dashboard page | 🔲 Todo |
| **Phase 4** | Projects list + create | 🔲 Todo |
| **Phase 5** | Project detail + tasks CRUD | 🔲 Todo |
| **Phase 6** | Team management | 🔲 Todo |
| **Phase 7** | Polish (empty states, toasts, responsiveness) | 🔲 Todo |

---

## 12. Out of Scope (v1)

- Email notifications
- File uploads / attachments
- Task comments / activity log
- Kanban board view (list view only in v1)
- OAuth (Google, GitHub login)
- Billing / subscription management
- API documentation / public API
- Dark mode

---

## 13. Success Criteria

- [ ] User can sign up, log in, and log out
- [ ] User can create a project and becomes admin
- [ ] Admin can invite members by email
- [ ] Admin can create, edit, delete tasks with all fields
- [ ] Member can update task status but cannot create/edit/delete tasks
- [ ] Dashboard shows accurate counts (open, overdue, done)
- [ ] Overdue tasks are visually highlighted
- [ ] All protected routes redirect unauthenticated users to login
- [ ] RLS prevents unauthorized data access at the database level
- [ ] App is responsive on mobile and desktop

---

*Built for Ethara.ai · Internal tooling v1.0*
