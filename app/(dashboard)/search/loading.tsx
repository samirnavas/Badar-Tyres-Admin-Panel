import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SearchLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-theme-accent" />
        <p className="mt-4 text-sm font-medium text-gray-900">Searching…</p>
        <p className="mt-1 text-sm text-gray-500">
          Looking for matches across customers, vehicles, and job cards
        </p>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white"
          >
            <div className="border-b border-gray-100 px-5 py-3">
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="space-y-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-[80%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
