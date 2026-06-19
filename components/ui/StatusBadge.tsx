"use client";

import { cn } from "@/lib/format";
import type { JobStatus } from "@/lib/types";
import type { JobCardStatus } from "@/lib/models/JobCard";
import { normalizeJobStatus } from "@/lib/models/JobCard";

export type BadgeStatus = string;

// Semantic mapping of statuses to colors
const styleCategories = {
  positive: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  neutral: "bg-gray-100 text-gray-700 border-gray-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

// Map each known status to a semantic category
const getCategory = (status: string) => {
  const normalized = status.toLowerCase();
  
  if (["completed", "paid", "open", "in stock", "invoiced", "approved"].includes(normalized)) {
    return styleCategories.positive;
  }
  if (["in progress", "partial", "occupied", "low stock", "running"].includes(normalized)) {
    return styleCategories.warning;
  }
  if (["estimate", "unpaid", "draft", "pending", "closed"].includes(normalized)) {
    return styleCategories.neutral;
  }
  if (["cancelled", "maintenance", "out of stock", "delayed"].includes(normalized)) {
    return styleCategories.critical;
  }
  
  return styleCategories.neutral; // Default
};

export function StatusBadge({
  status,
  className,
}: {
  status: BadgeStatus;
  className?: string;
}) {
  const displayStatus = status === "Draft" ? "Estimate" : status;
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        getCategory(status),
        className,
      )}
    >
      {displayStatus}
    </span>
  );
}
