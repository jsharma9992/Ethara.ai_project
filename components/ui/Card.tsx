import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "flat" | "elevated";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverable?: boolean;
}

export function Card({ variant = "default", hoverable = false, className, ...props }: CardProps) {
  const variants: Record<CardVariant, string> = {
    default:  "border border-ethara-line bg-white shadow-card",
    flat:     "border border-ethara-line bg-white",
    elevated: "border border-ethara-line bg-white shadow-card-hover"
  };

  return (
    <div
      className={cn(
        "rounded-xl p-5",
        variants[variant],
        hoverable && "transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer",
        className
      )}
      {...props}
    />
  );
}
