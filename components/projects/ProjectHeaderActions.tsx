"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProject, updateProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { Project } from "@/lib/types";

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9.5 2.5L11.5 4.5L4.5 11.5H2.5V9.5L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 3.5H12M5 3.5V2H9V3.5M5.5 6V10.5M8.5 6V10.5M3 3.5L3.5 11.5C3.5 12.05 3.95 12.5 4.5 12.5H9.5C10.05 12.5 10.5 12.05 10.5 11.5L11 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProjectHeaderActions({ project }: { project: Project }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save(formData: FormData) {
    startTransition(async () => {
      const result = await updateProject(project.id, formData);
      if (!result.success) {
        setError(result.error ?? "Unable to update project.");
        return;
      }
      setEditing(false);
      setError(null);
    });
  }

  function remove() {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (!result.success) {
        setError(result.error ?? "Unable to delete project.");
        return;
      }
      router.push("/projects");
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => { setEditing(true); setError(null); }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
        >
          <EditIcon />
          Edit
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={remove}
          className="inline-flex items-center gap-1.5 rounded-xl border border-red-300/30 bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-100 backdrop-blur-sm transition hover:bg-red-500/35 disabled:opacity-50"
        >
          {isPending ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-200 border-t-transparent" /> : <TrashIcon />}
          Delete
        </button>
      </div>

      {error && !editing ? (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      ) : null}

      <Modal open={editing} title="Edit project" onClose={() => setEditing(false)}>
        <form action={save} className="space-y-4">
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>
          ) : null}
          <Input label="Project name" name="name" defaultValue={project.name} />
          <Textarea
            label="Description"
            name="description"
            defaultValue={project.description ?? ""}
            hint="Optional — briefly describe what this project is about."
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button loading={isPending}>Save changes</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
