# Ethara.ai Project Manager

Internal project and task management app for Ethara.ai teams. It uses Next.js 14 App Router, TypeScript, Supabase Auth/database, RLS, server actions, and Tailwind CSS.

## Local Setup

```powershell
cd "C:\Users\Hp\OneDrive\Desktop\Ethara.ai"
nvm use 18
npm install --cache C:\tmp\npm-cache-ethara
```

Create `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

Set these values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Migration

Log in, link the project, and push migrations:

```powershell
npx supabase login
npx supabase link --project-ref your_project_ref --password 'your_database_password'
npx supabase db push
```

This applies the schema, profile creation trigger, RLS policies, and indexes in `supabase/migrations`.

## Run The App

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

## Verification

```powershell
npx tsc --noEmit
npm run build
```

If `npm run build` reports `.next\trace` permission errors on OneDrive, stop the dev server with `Ctrl+C`, delete `.next`, and run the build again.
