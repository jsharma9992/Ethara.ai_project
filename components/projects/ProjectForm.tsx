"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M7.5 2.5v10M2.5 7.5h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function ProjectForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) {
      setErrors({ name: "Project name is required." });
      return;
    }

    setErrors({});
    startTransition(async () => {
      const result = await createProject(formData);
      if (!result.success) setErrors({ form: result.error ?? "Unable to create project." });
      else if (result.data) router.push(`/projects/${result.data.id}`);
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      {errors.form ? (
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          {errors.form}
        </p>
      ) : null}
      <Input
        label="Project name"
        name="name"
        placeholder="e.g. Q3 Marketing Campaign"
        error={errors.name}
        autoFocus
      />
      <Textarea
        label="Description"
        name="description"
        placeholder="What is this project about? (optional)"
        hint="Members will see this on the project page."
      />
      <div className="flex items-center justify-end pt-1">
        <Button loading={isPending} className="min-w-36">
          <PlusIcon />
          Create Project
        </Button>
      </div>
    </form>
  );
}
