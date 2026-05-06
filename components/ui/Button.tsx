"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-ethara-teal text-white hover:bg-ethara-tealDark border-ethara-teal hover:border-ethara-tealDark shadow-sm",
    secondary:
      "bg-white text-ethara-ink hover:bg-slate-50 border-ethara-line shadow-sm",
    danger:
      "bg-red-600 text-white hover:bg-red-700 border-red-600 hover:border-red-700 shadow-sm",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 border-transparent hover:text-ethara-ink"
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-9 px-4 text-sm gap-2",
    lg: "h-11 px-5 text-sm gap-2"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg border font-medium transition-all duration-150",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ethara-teal focus-visible:ring-offset-2",
        sizes[size],
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
}
