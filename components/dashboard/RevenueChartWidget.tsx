"use client";

import { useQuery } from "@tanstack/react-query";
import { getRevenueTrend } from "@/lib/repositories";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/format";
import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Timeframe } from "@/lib/repositories/job_repository";

export function RevenueChartWidget({ timeframe }: { timeframe: Timeframe }) {
  const query = useQuery({
    queryKey: ["revenueTrend", timeframe],
    queryFn: () => getRevenueTrend(timeframe),
  });

  if (query.isLoading) {
    return (
      <section className="rounded-md border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <Skeleton className="h-5 w-1/4" />
        </div>
        <div className="p-4">
          <Skeleton className="h-[160px] w-full" />
        </div>
      </section>
    );
  }

  if (query.isError || !query.data) {
    return (
      <section className="rounded-md border border-gray-200 bg-white p-5 text-center text-gray-500">
        Failed to load revenue trend.
      </section>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="text-sm font-bold text-gray-900">
            ₹{formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="rounded-md border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <TrendingUp className="h-4 w-4 text-theme-accent" />
          Revenue Trend
        </h2>
      </div>

      <div className="p-2 h-[250px]">
        {query.data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No revenue data for this timeframe.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={query.data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(val) => `₹${val}`}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#dc2626"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
