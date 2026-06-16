"use client";

import { useQuery } from "@tanstack/react-query";
import { getServiceAnalytics } from "@/lib/repositories";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, cn } from "@/lib/format";
import { BarChart3 } from "lucide-react";
import type { Timeframe } from "@/lib/repositories/job_repository";

export function ServiceAnalyticsWidget({ timeframe }: { timeframe: Timeframe }) {
  const query = useQuery({
    queryKey: ["serviceAnalytics", timeframe],
    queryFn: () => getServiceAnalytics(timeframe),
  });

  if (query.isLoading) {
    return (
      <section className="rounded-md border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <Skeleton className="h-5 w-1/3" />
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </section>
    );
  }

  if (query.isError || !query.data) {
    return (
      <section className="rounded-md border border-gray-200 bg-white p-5 text-center text-gray-500">
        Failed to load service analytics.
      </section>
    );
  }

  const { topByVolume, topByRevenue } = query.data;

  // Find max volume to scale the progress bars relative to the top item
  const maxVolume = topByVolume.length > 0 ? topByVolume[0].volume : 1;
  const maxRevenue = topByRevenue.length > 0 ? topByRevenue[0].revenue : 1;

  return (
    <section className="rounded-md border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <BarChart3 className="h-4 w-4 text-theme-accent" />
          Service Analytics
        </h2>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Top by Volume */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Top by Volume
          </h3>
          {topByVolume.length === 0 ? (
            <p className="text-sm text-gray-400">No data available.</p>
          ) : (
            <ul className="space-y-4">
              {topByVolume.map((item, i) => {
                const percentage = Math.min(100, (item.volume / maxVolume) * 100);
                return (
                  <li key={i} className="relative">
                    <div className="flex justify-between text-sm font-medium text-gray-900 mb-1 z-10 relative">
                      <span className="truncate pr-4">{item.name}</span>
                      <span>{item.volume}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-red-100">
                      <div
                        className="h-full rounded-full bg-red-600"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right Column: Top by Revenue */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Top by Revenue
          </h3>
          {topByRevenue.length === 0 ? (
            <p className="text-sm text-gray-400">No data available.</p>
          ) : (
            <ul className="space-y-4">
              {topByRevenue.map((item, i) => {
                const percentage = Math.min(100, (item.revenue / maxRevenue) * 100);
                return (
                  <li key={i} className="relative">
                    <div className="flex justify-between text-sm font-medium text-gray-900 mb-1 z-10 relative">
                      <span className="truncate pr-4">{item.name}</span>
                      <span>₹{formatCurrency(item.revenue)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
