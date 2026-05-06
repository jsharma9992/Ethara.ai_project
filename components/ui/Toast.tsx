"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M12.5 3.5L6 10.5L2.5 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M11.5 3.5L3.5 11.5M3.5 3.5L11.5 11.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Toast({
  message,
  type,
  onDone
}: {
  message: string | null;
  type: "success" | "error";
  onDone?: () => void;
}) {
  const [phase, setPhase] = useState<"enter" | "leave" | "hidden">("hidden");

  useEffect(() => {
    if (!message) {
      setPhase("hidden");
      return;
    }
    setPhase("enter");
    const hideTimer = window.setTimeout(() => setPhase("leave"), 3200);
    const doneTimer = window.setTimeout(() => {
      setPhase("hidden");
      onDone?.();
    }, 3400);
    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(doneTimer);
    };
  }, [message, onDone]);

  if (!message || phase === "hidden") return null;

  const isSuccess = type === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-5 right-5 z-[100] flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg max-w-sm",
        phase === "enter" ? "toast-enter" : "toast-leave",
        isSuccess
          ? "border-teal-200 bg-white text-teal-800"
          : "border-red-200 bg-white text-red-700"
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
          isSuccess ? "bg-teal-50 text-teal-600" : "bg-red-50 text-red-500"
        )}
      >
        {isSuccess ? <CheckIcon /> : <XIcon size={13} />}
      </span>
      <span className="flex-1 font-medium">{message}</span>
      <button
        onClick={() => { setPhase("leave"); setTimeout(() => { setPhase("hidden"); onDone?.(); }, 200); }}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition hover:bg-black/5",
          isSuccess ? "text-teal-500" : "text-red-400"
        )}
        aria-label="Dismiss notification"
      >
        <XIcon size={12} />
      </button>
    </div>
  );
}
