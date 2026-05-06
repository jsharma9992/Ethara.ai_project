import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function EmptyState({
  icon,
  heading,
  subtext,
  action
}: {
  icon: ReactNode;
  heading: string;
  subtext: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-2xl text-ethara-teal ring-1 ring-teal-100">
        {icon}
      </div>
      <h2 className="text-base font-semibold text-ethara-ink">{heading}</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">{subtext}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  );
}
