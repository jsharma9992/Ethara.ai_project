# Ethara.ai — Project Management App

A web app where teams can create projects, add tasks, invite people, and track what's done. Built with Next.js, Supabase, and TypeScript.

---

## What it does

You sign up, create a project, and you become the admin. You can then invite your teammates by email, create tasks with priorities and deadlines, assign them to people, and everyone can see the progress on a shared dashboard.

There are two roles — **Admin** and **Member**. Admins control everything. Members can only update task statuses (like moving something from "In Progress" to "Done"). The app enforces this both in the code and at the database level, so there's no way around it.

---

## Pages

- **Login / Signup** — standard email and password auth
- **Dashboard** — shows your tasks, overdue items, and recent projects at a glance
- **Projects** — list of all projects you're part of
- **Project Detail** — task list with filters, member list, and team management

---

## Tech stack

- **Next.js 14** — the main framework, handles routing and server-side rendering
- **TypeScript** — so the code doesn't break silently
- **Supabase** — handles the database (PostgreSQL) and login/auth
- **Tailwind CSS** — for all the styling
- **Railway** — where the app is deployed

---

## Who can do what

| Action | Admin | Member |
|--------|-------|--------|
| Create a project | Yes | Yes (becomes admin) |
| Edit or delete project | Yes | No |
| Invite or remove members | Yes | No |
| Create, edit, delete tasks | Yes | No |
| Change task status | Yes | Yes |
| View everything | Yes | Yes |

---

## Database tables

- `profiles` — stores name, email, and avatar for each user
- `projects` — project name, description, who created it
- `project_members` — links users to projects with their role
- `tasks` — title, description, status, priority, assignee, due date

---

## Security

Every action checks permissions twice — once in the server code, and once in the database using Supabase Row-Level Security (RLS). Even if someone bypasses the frontend, the database won't let them read or write data they're not supposed to touch.

---

## Project structure

```
/app          pages and server actions
/components   reusable UI pieces (buttons, cards, modals, etc.)
/lib          Supabase setup and shared utilities
middleware.ts handles auth and redirects
railway.toml  deployment config
```

---

## Environment variables needed

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Running locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

---

*Built for Ethara.ai · May 2026*
