import { cn } from "@/lib/format";
import type { JobStatus } from "@/lib/types";

const styles: Record<JobStatus, string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  running: "bg-amber-50 text-amber-700 border-amber-200",
  delayed: "bg-theme-accent-soft text-theme-accent border-theme-accent/30",
  pending: "bg-gray-100 text-gray-600 border-gray-200",
};

const labels: Record<JobStatus, string> = {
  completed: "Completed",
  running: "Running",
  delayed: "Delayed",
  pending: "Pending",
};

export function StatusBadge({
  status,
  className,
}: {
  status: JobStatus;
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
