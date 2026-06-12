"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, MoreVertical, ChevronLeft, ChevronRight, Edit, Trash } from "lucide-react";
import { useJobs, useDeleteJob } from "@/lib/hooks";
import type { JobStatus, Job } from "@/lib/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatCurrency } from "@/lib/format";

type TabValue = JobStatus | "all";

const tabs: { value: TabValue; label: string; alert?: boolean }[] = [
  { value: "all", label: "View All" },
  { value: "running", label: "Active Run" },
  { value: "completed", label: "Completed Invoices" },
  { value: "delayed", label: "Delayed Service Alerts", alert: true },
];

const urgency: Record<JobStatus, { label: string; className: string }> = {
  delayed: {
    label: "Delayed Parts",
    className: "bg-theme-accent-soft text-theme-accent border-theme-accent/30",
  },
  running: {
    label: "Active Run",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  completed: {
    label: "Completed",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  pending: {
    label: "Routine",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
};

function JobRow({ job }: { job: Job }) {
  const router = useRouter();
  const deleteJob = useDeleteJob();
  const [menuOpen, setMenuOpen] = useState(false);
  const u = urgency[job.status];

  const handleRowClick = () => {
    router.push(`/jobs/${job.id}`);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    router.push(`/jobs/${job.id}/edit`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (confirm("Are you sure you want to delete this job card?")) {
      deleteJob.mutate(job.id);
    }
  };

  return (
    <tr
      onClick={handleRowClick}
      className="cursor-pointer transition-colors hover:bg-gray-50"
    >
      <td className="px-5 py-4 font-semibold text-theme-accent">
        <span className="hover:underline">
          {job.jobNumber}
        </span>
      </td>
      <td className="px-5 py-4 text-gray-600">
        {job.date}, {job.time}
      </td>
      <td className="px-5 py-4 font-medium text-gray-900">
        {job.vehicleNumber || "—"}
      </td>
      <td className="px-5 py-4 text-gray-900">
        {job.customerName}
      </td>
      <td className="px-5 py-4 text-gray-600">
        {job.technician}
      </td>
      <td className="px-5 py-4">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            u.className,
          )}
        >
          {u.label}
        </span>
      </td>
      <td className="px-5 py-4 text-right font-semibold text-gray-900">
        ₹ {formatCurrency(job.grandTotal)}
      </td>
      <td className="px-5 py-4 text-right relative">
        <button
          onClick={handleMenuClick}
          className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div
            className="absolute right-8 top-4 z-10 w-36 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 border border-gray-200"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              onClick={handleEdit}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit className="h-4 w-4" /> Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              <Trash className="h-4 w-4" /> Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function JobsPage() {
  const [tab, setTab] = useState<TabValue>("all");
  const { data: jobs, isLoading, isError, error } = useJobs({ status: tab });

  const rows = jobs ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Job Cards Lifecycle
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track active vehicle service operations across all bays.
          </p>
        </div>
        <Link
          href="/jobs/create"
          className="inline-flex items-center gap-2 rounded-md bg-theme-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark"
        >
          <Plus className="h-4 w-4" /> New Job Card
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-3.5 py-2 text-sm font-medium transition-colors",
              tab === t.value
                ? "border-theme-accent bg-theme-accent text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900",
            )}
          >
            {t.alert && (
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  tab === t.value ? "bg-white" : "bg-theme-accent",
                )}
              />
            )}
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Job ID</th>
                <th className="px-5 py-3">Date In</th>
                <th className="px-5 py-3">Reg Code</th>
                <th className="px-5 py-3">Customer Identity</th>
                <th className="px-5 py-3">Maintenance Specialist</th>
                <th className="px-5 py-3">Urgency Status</th>
                <th className="px-5 py-3 text-right">Totals (Inc. ₹)</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading &&
                rows.map((job) => (
                  <JobRow key={job.id} job={job} />
                ))}

              {!isLoading && isError && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-theme-accent"
                  >
                    {(error as Error)?.message ??
                      "Failed to load job cards. Is the API running?"}
                  </td>
                </tr>
              )}

              {!isLoading && !isError && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    No job cards match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
          <p className="text-xs text-gray-500">
            {isLoading
              ? "Loading records…"
              : `Showing ${rows.length === 0 ? 0 : 1} to ${rows.length} of ${rows.length} records`}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-400 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
