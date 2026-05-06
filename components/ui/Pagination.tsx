"use client";

import { cn } from "@/lib/utils";

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 11L4 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5 3L10 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  itemName?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, total, itemName = "items" }: PaginationProps) {
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row" aria-label="Pagination">
      <p className="text-xs text-slate-500">
        {total !== undefined && (
          <>
            {total} {itemName}{total !== 1 ? "s" : ""}
            <span className="hidden sm:inline"> · </span>
          </>
        )}
        <span className="hidden sm:inline">Page {currentPage} of {totalPages}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPrev}
          className={cn(
            "flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium transition",
            canPrev
              ? "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              : "cursor-not-allowed text-slate-300"
          )}
          aria-label="Previous page"
        >
          <ChevronLeft />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="flex items-center gap-0.5">
          {getPageNumbers().map((page, idx) =>
            page === "ellipsis" ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">…</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition",
                  page === currentPage
                    ? "bg-teal-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                )}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
          className={cn(
            "flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium transition",
            canNext
              ? "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              : "cursor-not-allowed text-slate-300"
          )}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight />
        </button>
      </div>
    </nav>
  );
}
