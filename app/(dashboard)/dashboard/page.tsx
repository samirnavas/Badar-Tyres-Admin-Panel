"use client";

import { useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

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
import { useJobs } from "@/lib/hooks";
import { useQuery } from "@tanstack/react-query";
import { getDashboardMetrics, getServiceAnalytics } from "@/lib/repositories";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ServiceAnalyticsWidget } from "@/components/dashboard/ServiceAnalyticsWidget";
import { RevenueChartWidget } from "@/components/dashboard/RevenueChartWidget";
import { UpcomingServicesWidget } from "@/components/dashboard/UpcomingServicesWidget";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, cn } from "@/lib/format";
import type { Job } from "@/lib/types";
import type { Timeframe } from "@/lib/repositories/job_repository";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeframe = (searchParams.get("timeframe") as Timeframe) || "today";

  const handleTimeframeChange = (newTimeframe: Timeframe) => {
    const params = new URLSearchParams(searchParams);
    params.set("timeframe", newTimeframe);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const jobs = useJobs();
  
  const dashboardMetricsQuery = useQuery({
    queryKey: ["dashboardMetrics", timeframe],
    queryFn: () => getDashboardMetrics(timeframe),
  });

  const serviceAnalyticsQuery = useQuery({
    queryKey: ["serviceAnalytics", timeframe],
    queryFn: () => getServiceAnalytics(timeframe),
  });

  const recent = (jobs.data ?? []).slice(0, 5);

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
          {/* Timeframe Selector */}
          <div className="flex rounded-md border border-gray-200 bg-white p-1">
            {(["today", "week", "month", "all"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold capitalize transition-colors rounded-sm",
                  timeframe === tf
                    ? "bg-theme-accent text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {tf === "all" ? "All Time" : tf === "today" ? "Today" : `This ${tf}`}
              </button>
            ))}
          </div>
          <Link
            href="/jobs/create"
            className="inline-flex items-center gap-2 rounded-md bg-theme-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark"
          >
            <Plus className="h-4 w-4" /> New Job
          </Link>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Revenue"
          value={`₹${formatCurrency(dashboardMetricsQuery.data?.revenue ?? 0)}`}
          icon={TrendingUp}
          loading={dashboardMetricsQuery.isLoading}
        />
        <MetricCard
          label="Avg Ticket Size"
          value={`₹${formatCurrency(serviceAnalyticsQuery.data?.averageTicketSize ?? 0)}`}
          icon={TrendingUp}
          loading={serviceAnalyticsQuery.isLoading}
        />
        <MetricCard
          label="Pending Jobs"
          value={dashboardMetricsQuery.data?.pendingJobs ?? 0}
          icon={Clock}
          loading={dashboardMetricsQuery.isLoading}
        />
        <MetricCard
          label="Completed Jobs"
          value={dashboardMetricsQuery.data?.completedJobs ?? 0}
          icon={CheckCircle2}
          loading={dashboardMetricsQuery.isLoading}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Revenue Trend */}
          <RevenueChartWidget timeframe={timeframe} />

          {/* Service Analytics */}
          <ServiceAnalyticsWidget timeframe={timeframe} />

          {/* Recent Customer Activities */}
          <section className="rounded-md border border-gray-200 bg-white">
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
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Upcoming Services & Notifications */}
          <UpcomingServicesWidget />

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

