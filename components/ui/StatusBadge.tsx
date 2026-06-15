import { cn } from "@/lib/format";
import type { JobStatus } from "@/lib/types";
import type { JobCardStatus } from "@/lib/models/JobCard";

export type BadgeStatus = JobStatus | JobCardStatus;

const styles: Record<BadgeStatus, string> = {
  // Relational JobCard statuses
  Draft: "bg-gray-100 text-gray-600 border-gray-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Invoiced: "bg-violet-50 text-violet-700 border-violet-200",
  // Legacy Job statuses (dashboard / older views)
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  running: "bg-amber-50 text-amber-700 border-amber-200",
  delayed: "bg-theme-accent-soft text-theme-accent border-theme-accent/30",
  pending: "bg-gray-100 text-gray-600 border-gray-200",
};

const labels: Record<BadgeStatus, string> = {
  Draft: "Draft",
  "In Progress": "In Progress",
  Completed: "Completed",
  Invoiced: "Invoiced",
  completed: "Completed",
  running: "Running",
  delayed: "Delayed",
  pending: "Pending",
};

export function StatusBadge({
  status,
  className,
}: {
  status: BadgeStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        styles[status],
        className,
      )}
    >
      {labels[status]}
    </span>
  );
}
