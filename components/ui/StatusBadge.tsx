"use client";

import { cn } from "@/lib/format";
import type { JobStatus } from "@/lib/types";
import type { JobCardStatus } from "@/lib/models/JobCard";
import { normalizeJobStatus } from "@/lib/models/JobCard";

export type BadgeStatus = JobStatus | JobCardStatus | "Draft" | "Invoiced";

const styles: Record<BadgeStatus, string> = {
  Estimate: "bg-gray-100 text-gray-600 border-gray-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Closed: "bg-slate-100 text-slate-700 border-slate-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
  Draft: "bg-gray-100 text-gray-600 border-gray-200",
  Invoiced: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  running: "bg-amber-50 text-amber-700 border-amber-200",
  delayed: "bg-theme-accent-soft text-theme-accent border-theme-accent/30",
  pending: "bg-gray-100 text-gray-600 border-gray-200",
};

const labels: Record<BadgeStatus, string> = {
  Estimate: "Estimate",
  Approved: "Approved",
  "In Progress": "In Progress",
  Completed: "Completed",
  Closed: "Closed",
  Cancelled: "Cancelled",
  Draft: "Estimate",
  Invoiced: "Completed",
  completed: "Completed",
  running: "Running",
  delayed: "Delayed",
  pending: "Pending",
};

export function StatusBadge({
  status,
  className,
}: {
  status: BadgeStatus | string;
  className?: string;
}) {
  const normalized = normalizeJobStatus(status) as BadgeStatus;
  const displayStatus =
    status === "Draft" || status === "Invoiced"
      ? (status as BadgeStatus)
      : normalized;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        styles[displayStatus] ?? styles.Estimate,
        className,
      )}
    >
      {labels[displayStatus] ?? labels[normalized] ?? status}
    </span>
  );
}
