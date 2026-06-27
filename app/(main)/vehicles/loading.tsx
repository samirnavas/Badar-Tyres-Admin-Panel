import { Skeleton } from "@/components/ui/Skeleton";

export default function VehiclesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-96" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-72" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full" />
        ))}
      </div>
    </div>
  );
}
