"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import type { ProjectWithCounts } from "@/lib/types";

function FolderIcon() {
  return <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 7C3 5.9 3.9 5 5 5H10.17C10.58 5 10.97 5.19 11.22 5.51L12.38 7H19C20.1 7 21 7.9 21 9V18C21 19.1 20.1 20 19 20H5C3.9 20 3 19.1 3 18V7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>;
}

function PlusIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 2.5v10M2.5 7.5h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

type SortBy = "created_at" | "name";
type SortOrder = "asc" | "desc";

export function ProjectList({ projects }: { projects: ProjectWithCounts[] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const filteredProjects = useMemo(() => {
    let result = projects.filter((project) => {
      if (search) {
        const query = search.toLowerCase();
        const nameMatch = project.name.toLowerCase().includes(query);
        const descMatch = project.description?.toLowerCase().includes(query) ?? false;
        if (!nameMatch && !descMatch) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "created_at") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "name") {
        cmp = a.name.localeCompare(b.name);
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return result;
  }, [projects, search, sortBy, sortOrder]);

  return (
    <>
      {/* Search and sort controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-800 appearance-none cursor-pointer transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
            aria-label="Sort by"
          >
            <option value="created_at">Sort: Created</option>
            <option value="name">Sort: Name</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            aria-label={sortOrder === "asc" ? "Sort descending" : "Sort ascending"}
          >
            {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
          </button>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderIcon />}
          heading={search ? "No projects found" : "No projects yet"}
          subtext={search ? "Try a different search term." : "Create your first project — you'll automatically become its admin."}
          action={
            !search ? (
              <Link href="/projects/new">
                <Button><PlusIcon /> Create Project</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}
    </>
  );
}
