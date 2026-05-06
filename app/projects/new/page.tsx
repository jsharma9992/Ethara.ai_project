import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ProjectForm } from "@/components/projects/ProjectForm";

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 11.5L4.5 7L9 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-ethara-teal"
      >
        <BackIcon />
        Back to Projects
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-ethara-ink">New Project</h1>
        <p className="mt-1 text-sm text-ethara-muted">
          Create a project and invite collaborators once it&apos;s ready.
        </p>
      </div>

      <Card variant="flat" className="border-2 border-dashed border-ethara-line bg-white">
        <ProjectForm />
      </Card>
    </div>
  );
}
