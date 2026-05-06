"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { cn, initials } from "@/lib/utils";
import { GridPattern } from "@/components/ui/grid-pattern";

/* ─── Icons ──────────────────────────────────────────────── */
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 4.5C1.5 3.67 2.17 3 3 3H6.17C6.56 3 6.92 3.18 7.16 3.48L8 4.5H13C13.83 4.5 14.5 5.17 14.5 6V12C14.5 12.83 13.83 13.5 13 13.5H3C2.17 13.5 1.5 12.83 1.5 12V4.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M6 2H2.5C2.22 2 2 2.22 2 2.5V12.5C2 12.78 2.22 13 2.5 13H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10 5L13 7.5L10 10M5 7.5H13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2.5 5H15.5M2.5 9H15.5M2.5 13H15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { href: "/projects",  label: "Projects",  Icon: FolderIcon   }
];

function NavLink({ href, label, Icon, active, onClick }: {
  href: string; label: string;
  Icon: React.FC<{ className?: string }>;
  active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
        active
          ? "bg-white/15 text-white shadow-sm"
          : "text-white/60 hover:bg-white/10 hover:text-white"
      )}
    >
      {active && <span className="absolute left-0 top-2 h-[calc(100%-16px)] w-0.5 rounded-full bg-white/80" />}
      <Icon className="shrink-0" />
      {label}
    </Link>
  );
}

function ProfileFooter({ profile, onLogout }: { profile: Profile | null; onLogout: () => void }) {
  const name = profile?.full_name ?? "Ethara user";
  const email = profile?.email ?? "";
  return (
    <div className="border-t border-white/10 pt-4 space-y-3">
      <div className="flex items-center gap-3 min-w-0 px-1">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
          {initials(name) || "E"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{name}</p>
          {email && <p className="truncate text-xs text-white/50">{email}</p>}
        </div>
      </div>
      <button
        onClick={onLogout}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white/50 transition hover:bg-white/10 hover:text-white"
      >
        <LogOutIcon />
        Sign out
      </button>
    </div>
  );
}

export function AppShell({ children, profile }: { children: ReactNode; profile: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthPage = pathname.startsWith("/auth");

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  /* ── Auth layout ──────────────────────────────────────── */
  if (isAuthPage) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
        style={{ background: "linear-gradient(135deg, #0d1117 0%, #0f766e22 50%, #0d1117 100%)" }}
      >
        {/* Animated grid background */}
        <GridPattern
          width={40}
          height={40}
          squares={[
            [2,3],[5,1],[8,4],[12,2],[16,6],[3,8],[7,10],[11,7],[14,3],
            [1,12],[6,14],[9,11],[13,15],[17,9],[4,16],[10,1],[15,13]
          ]}
          className={cn(
            "fill-teal-500/5 stroke-teal-500/10",
            "[mask-image:radial-gradient(900px_circle_at_center,white,transparent)]"
          )}
        />
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-emerald-500/8 blur-3xl" />
        <div className="relative z-10 w-full max-w-md">{children}</div>
      </main>
    );
  }

  /* ── App layout ───────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col lg:flex"
        style={{ background: "linear-gradient(180deg, #0f766e 0%, #0a5c55 60%, #064e46 100%)" }}
      >
        {/* Subtle grid on sidebar */}
        <GridPattern
          width={24} height={24} strokeDasharray="3 2"
          className="fill-white/0 stroke-white/5 [mask-image:linear-gradient(to_bottom,white,transparent)]"
        />

        {/* Brand */}
        <div className="relative px-5 py-6">
          <Link href="/dashboard" className="flex items-center group">
            <img src="/logo_white_text.png" alt="Ethara.ai" className="h-9 w-auto drop-shadow-md" />
          </Link>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.href} href={item.href} label={item.label} Icon={item.Icon}
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            />
          ))}
        </nav>

        {/* Profile footer */}
        <div className="relative px-4 pb-6">
          <ProfileFooter profile={profile} onLogout={logout} />
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center">
            <img src="/logo_white_text.png" alt="Ethara.ai" className="h-6 w-auto brightness-0" />
          </Link>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 top-[57px] z-20 bg-slate-900/30 backdrop-blur-[1px] lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-x-0 top-[57px] z-20 pb-5 pt-3 shadow-xl lg:hidden animate-fade-in"
            style={{ background: "linear-gradient(180deg, #0f766e 0%, #0a5c55 100%)" }}
          >
            <nav className="px-3 space-y-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.href} href={item.href} label={item.label} Icon={item.Icon}
                  active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </nav>
            <div className="mt-4 px-4">
              <ProfileFooter profile={profile} onLogout={logout} />
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
