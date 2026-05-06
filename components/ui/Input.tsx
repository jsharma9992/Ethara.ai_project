import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id ?? props.name;

  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        id={inputId}
        className={cn(
          "h-10 w-full rounded-lg border bg-white px-3 text-sm text-ethara-ink placeholder:text-slate-400",
          "outline-none transition-all duration-150",
          "focus:border-ethara-teal focus:ring-2 focus:ring-ethara-teal/20",
          error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-ethara-line",
          className
        )}
        {...props}
      />
      {hint && !error ? <span className="block text-xs text-slate-400">{hint}</span> : null}
      {error ? <span className="block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

export function Textarea({
  label,
  error,
  hint,
  className,
  id,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const inputId = id ?? props.name;

  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        id={inputId}
        className={cn(
          "min-h-28 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ethara-ink placeholder:text-slate-400",
          "outline-none transition-all duration-150 resize-none",
          "focus:border-ethara-teal focus:ring-2 focus:ring-ethara-teal/20",
          error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-ethara-line",
          className
        )}
        {...props}
      />
      {hint && !error ? <span className="block text-xs text-slate-400">{hint}</span> : null}
      {error ? <span className="block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
