import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/format";
import { Skeleton } from "@/components/ui/Skeleton";

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: boolean;
  loading?: boolean;
  caption?: React.ReactNode;
  progress?: number;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  accent = false,
  loading = false,
  caption,
  progress,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-md border bg-white p-4",
        accent ? "border-theme-accent" : "border-gray-200",
      )}
    >
      <div className="flex items-center justify-between">
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wide",
            accent ? "text-theme-accent" : "text-gray-500",
          )}
        >
          {label}
        </p>
        <Icon
          className={cn(
            "h-4 w-4",
            "text-theme-accent",
          )}
        />
      </div>

      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-9 w-16" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-3xl font-bold tracking-tight",
                accent ? "text-theme-accent" : "text-gray-900",
              )}
            >
              {value}
            </span>
            {caption}
          </div>
        )}
      </div>

      {typeof progress === "number" && !loading && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-amber-500"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
