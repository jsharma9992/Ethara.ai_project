"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ArrowRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M3 7.5H12M8.5 4L12 7.5L8.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(formData: FormData) {
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const nextErrors: Record<string, string> = {};
    if (!fullName) nextErrors.fullName = "Full name is required.";
    if (!email) nextErrors.email = "Email is required.";
    else if (!emailPattern.test(email)) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Password is required.";
    else if (password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } }
      });
      if (error) { setErrors({ form: error.message }); return; }
      router.push("/dashboard");
      router.refresh();
    });
  }

  const fieldCls = (err?: string) => cn(
    "h-11 w-full rounded-xl border bg-white/8 px-4 text-sm text-white placeholder:text-white/60",
    "outline-none transition-all focus:bg-white/12 focus:ring-2 focus:ring-teal-400/40",
    err ? "border-red-400/40" : "border-white/10 focus:border-teal-400/50"
  );

  return (
    <div className="w-full animate-fade-in">
      {/* Brand */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-6 flex items-center justify-center">
          <img src="/logo_white_text.png" alt="Ethara.ai" className="h-14 w-auto drop-shadow-lg" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-white/50">Join your team on Ethara.ai</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
        <form action={onSubmit} className="space-y-4">
          {errors.form ? (
            <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-medium text-red-300">
              {errors.form}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/70" htmlFor="fullName">Full name</label>
            <input id="fullName" name="fullName" autoComplete="name" placeholder="Jane Smith" className={fieldCls(errors.fullName)} />
            {errors.fullName && <p className="text-xs text-red-400 font-medium">{errors.fullName}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/70" htmlFor="email">Work email</label>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" className={fieldCls(errors.email)} />
            {errors.email && <p className="text-xs text-red-400 font-medium">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/70" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" placeholder="Min. 8 characters" className={fieldCls(errors.password)} />
            {errors.password && <p className="text-xs text-red-400 font-medium">{errors.password}</p>}
            {!errors.password && <p className="text-xs text-white/30">Must be at least 8 characters long.</p>}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-ethara-teal font-semibold text-white text-sm shadow-lg shadow-teal-900/40 transition-all hover:bg-ethara-tealDark hover:shadow-teal-900/60 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>Create account <ArrowRightIcon /></>
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-white/40">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-teal-400 hover:text-teal-300 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
