"use client";

import { useState, useTransition } from "react";
import { inviteMember, removeMember, updateMemberRole } from "@/app/actions/members";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { RoleBadge } from "@/components/ui/Badge";
import type { ProjectMemberWithProfile, ProjectRole } from "@/lib/types";
import { initials } from "@/lib/utils";

function UserPlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="5.5" cy="5" r="2.8" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 12.5c0-2.49 2.01-4.5 4.5-4.5S10 10.01 10 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11.5 5V9M9.5 7H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M2 3H11M4.5 3V2H8.5V3M5 5.5V9.5M8 5.5V9.5M2.5 3L3 11C3 11.55 3.45 12 4 12H9C9.55 12 10 11.55 10 11L10.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MembersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 17c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="15" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M18 17c0-2.21-1.34-4-3-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const selectCls =
  "h-8 rounded-lg border border-ethara-line bg-white px-3 pr-7 text-xs text-ethara-ink appearance-none cursor-pointer transition focus:border-ethara-teal focus:ring-2 focus:ring-ethara-teal/20 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed";

export function MemberList({
  projectId,
  members,
  isAdmin,
  currentUserId
}: {
  projectId: string;
  members: ProjectMemberWithProfile[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const adminCount = members.filter((m) => m.role === "admin").length;

  function invite(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await inviteMember(projectId, formData);
      if (result.success) {
        setSuccess("Invitation sent successfully.");
      } else {
        setError(result.error ?? "Unable to invite member.");
      }
    });
  }

  function changeRole(memberId: string, role: ProjectRole) {
    setError(null);
    startTransition(async () => {
      const result = await updateMemberRole(projectId, memberId, role);
      if (!result.success) setError(result.error ?? "Unable to update role.");
    });
  }

  function remove(memberId: string) {
    if (!window.confirm("Remove this member from the project?")) return;
    setError(null);
    startTransition(async () => {
      const result = await removeMember(projectId, memberId);
      if (!result.success) setError(result.error ?? "Unable to remove member.");
    });
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ethara-ink">
          Members
          <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-semibold text-slate-500">
            {members.length}
          </span>
        </h2>
      </div>

      {/* Invite form (admin only) */}
      {isAdmin ? (
        <Card variant="flat" className="bg-slate-50/60">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Invite member</p>
          <form action={invite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label=""
                name="email"
                type="email"
                placeholder="colleague@company.com"
                aria-label="Email to invite"
              />
            </div>
            <Button loading={isPending} size="sm" className="shrink-0">
              <UserPlusIcon />
              Invite
            </Button>
          </form>
          {success ? (
            <p className="mt-2.5 rounded-lg bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700">{success}</p>
          ) : null}
          {error ? (
            <p className="mt-2.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>
          ) : null}
        </Card>
      ) : null}

      {/* Member list */}
      <div className="space-y-2">
        {members.map((member) => {
          const profile = member.profiles;
          const name = profile?.full_name ?? profile?.email ?? "Member";
          const isSoleAdminSelf =
            member.user_id === currentUserId && member.role === "admin" && adminCount <= 1;

          return (
            <div
              key={member.id}
              className="flex flex-col gap-3 rounded-xl border border-ethara-line bg-white px-4 py-3 shadow-card sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ethara-teal/10 text-sm font-bold text-ethara-teal">
                  {initials(name) || "M"}
                </div>

                {/* Name + email */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ethara-ink">{name}</p>
                  {profile?.email && profile.email !== name ? (
                    <p className="truncate text-xs text-slate-400">{profile.email}</p>
                  ) : null}
                </div>
              </div>

              {/* Role + actions */}
              <div className="flex items-center gap-2 sm:shrink-0">
                {isAdmin ? (
                  <div className="relative">
                    <select
                      value={member.role}
                      onChange={(e) => changeRole(member.id, e.target.value as ProjectRole)}
                      disabled={isPending || isSoleAdminSelf}
                      title={
                        isSoleAdminSelf
                          ? "You are the sole admin — promote another member first."
                          : undefined
                      }
                      className={selectCls}
                      aria-label="Change member role"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                    </span>
                  </div>
                ) : (
                  <RoleBadge role={member.role} />
                )}

                {isAdmin ? (
                  <button
                    type="button"
                    disabled={isSoleAdminSelf || isPending}
                    onClick={() => remove(member.id)}
                    title={
                      isSoleAdminSelf
                        ? "Cannot remove the sole admin — promote another member first."
                        : "Remove member"
                    }
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition
                      ${
                        isSoleAdminSelf
                          ? "cursor-not-allowed text-slate-200"
                          : "text-slate-400 hover:bg-red-50 hover:text-red-600"
                      }
                    `}
                    aria-label="Remove member"
                  >
                    <TrashIcon />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Non-admin error */}
      {!isAdmin && error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>
      ) : null}
    </section>
  );
}
