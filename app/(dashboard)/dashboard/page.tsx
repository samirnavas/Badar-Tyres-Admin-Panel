"use client";

import {
  LayoutGrid,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Plus,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMetrics, useJobs } from "@/lib/hooks";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, cn } from "@/lib/format";
import type { Job } from "@/lib/types";

export default function DashboardPage() {
  const metrics = useMetrics();
  const jobs = useJobs();

  const m = metrics.data;
  const recent = (jobs.data ?? []).slice(0, 5);
  const runningProgress =
    m && m.totalJobs > 0 ? (m.running / m.totalJobs) * 100 : 0;

  const activeJobs = (jobs.data ?? []).filter((j) => j.status === "running");
  const blockedJobs = (jobs.data ?? []).filter((j) => j.status === "delayed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Overview
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Real-time workshop metrics and queue status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            <Calendar className="h-4 w-4" /> Today
          </button>
          <Link
            href="/jobs/create"
            className="inline-flex items-center gap-2 rounded-md bg-theme-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark"
          >
            <Plus className="h-4 w-4" /> New Job
          </Link>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          label="Total Jobs"
          value={m?.totalJobs ?? 0}
          icon={LayoutGrid}
          loading={metrics.isLoading}
          caption={
            <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
              <TrendingUp className="h-3 w-3" /> 12%
            </span>
          }
        />
        <MetricCard
          label="Running"
          value={m?.running ?? 0}
          icon={RefreshCw}
          loading={metrics.isLoading}
          progress={runningProgress}
        />
        <MetricCard
          label="Completed"
          value={m?.completed ?? 0}
          icon={CheckCircle2}
          loading={metrics.isLoading}
        />
        <MetricCard
          label="Delayed"
          value={m?.delayed ?? 0}
          icon={AlertTriangle}
          accent
          loading={metrics.isLoading}
          caption={
            <span className="text-xs font-semibold text-theme-accent">
              Critical
            </span>
          }
        />
        <MetricCard
          label="Pending"
          value={m?.pending ?? 0}
          icon={Clock}
          loading={metrics.isLoading}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Customer Activities */}
        <section className="rounded-md border border-gray-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">
              Recent Customer Activities
            </h2>
            <Link
              href="/jobs"
              className="text-sm font-semibold text-theme-accent hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Job ID</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 5 }).map((__, j) => (
                          <td key={j} className="px-5 py-4">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : recent.map((job) => {
                      const isDelayed = job.status === "delayed";
                      return (
                        <tr
                          key={job.id}
                          className={isDelayed ? "bg-theme-accent-soft/40" : ""}
                        >
                          <td
                            className={`px-5 py-4 font-semibold ${
                              isDelayed ? "text-theme-accent" : "text-gray-900"
                            }`}
                          >
                            {job.jobNumber}
                          </td>
                          <td className="px-5 py-4 text-gray-900">
                            {job.customerName}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {job.services[0]?.name ?? "—"}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={job.status} />
                          </td>
                          <td className="px-5 py-4 text-right font-medium text-gray-900">
                            ₹ {formatCurrency(job.grandTotal)}
                          </td>
                        </tr>
                      );
                    })}
                {!jobs.isLoading && recent.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-sm text-gray-500"
                    >
                      No recent activity to show.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="block lg:hidden divide-y divide-gray-100">
            {jobs.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-16 w-full" />
                </div>
              ))
            ) : (
              recent.map((job) => <RecentActivityCardMobile key={job.id} job={job} />)
            )}
            {!jobs.isLoading && recent.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-gray-500">
                No recent activity to show.
              </div>
            )}
          </div>
        </section>

        {/* Workshop Bay Queue */}
        <section className="rounded-md border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <LayoutGrid className="h-4 w-4 text-theme-accent" />
              Workshop Bay Queue
            </h2>
          </div>

          <div className="space-y-5 p-5">
            {jobs.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))
            ) : (
              <>
                {activeJobs.slice(0, 2).map((job, i) => (
                  <BaySlot
                    key={job.id}
                    bay={i + 1}
                    state="active"
                    title={`${job.customerName} (${job.jobNumber})`}
                    subtitle={job.services[0]?.name ?? job.vehicleModel}
                  />
                ))}
                {blockedJobs.slice(0, 1).map((job) => (
                  <BaySlot
                    key={job.id}
                    bay={activeJobs.slice(0, 2).length + 1}
                    state="blocked"
                    title={`${job.customerName} (${job.jobNumber})`}
                    subtitle={job.delay ? `Delayed · ${job.delay}` : "Awaiting parts delivery."}
                  />
                ))}
                <BaySlot
                  bay={
                    activeJobs.slice(0, 2).length + blockedJobs.slice(0, 1).length + 1
                  }
                  state="available"
                />
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function BaySlot({
  bay,
  state,
  title,
  subtitle,
}: {
  bay: number;
  state: "active" | "blocked" | "available";
  title?: string;
  subtitle?: string;
}) {
  const meta = {
    active: { dot: "bg-emerald-500", label: "Active" },
    blocked: { dot: "bg-theme-accent", label: "Blocked" },
    available: { dot: "bg-gray-300", label: "Available" },
  }[state];

  return (
    <div className="relative pl-6">
      <span
        className={`absolute left-0 top-1 h-3 w-3 rounded-full ${meta.dot}`}
      />
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        Bay {bay} · {meta.label}
      </p>

      {state === "available" ? (
        <Link
          href="/jobs/create"
          className="flex items-center justify-center rounded-md border border-dashed border-gray-300 px-4 py-5 text-sm font-medium text-gray-500 transition-colors hover:border-theme-accent hover:text-theme-accent"
        >
          + Assign Next Job
        </Link>
      ) : (
        <div className="rounded-md border border-gray-200 p-3">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="mt-0.5 text-xs text-gray-600">{subtitle}</p>
          {state === "active" && (
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-2/3 rounded-full bg-amber-500" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecentActivityCardMobile({ job }: { job: Job }) {
  const isDelayed = job.status === "delayed";
  return (
    <div className={cn("p-4 border-b border-gray-100", isDelayed ? "bg-theme-accent-soft/40" : "bg-white")}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className={`font-semibold ${isDelayed ? "text-theme-accent" : "text-gray-900"}`}>
            {job.jobNumber}
          </div>
          <div className="text-sm text-gray-900 mt-0.5">{job.customerName}</div>
        </div>
        <StatusBadge status={job.status} />
      </div>
      <div className="flex justify-between items-end text-sm">
        <div className="text-gray-600">
          {job.services[0]?.name ?? "—"}
        </div>
        <div className="font-medium text-gray-900">
          ₹ {formatCurrency(job.grandTotal)}
        </div>
      </div>
    </div>
  );
}

