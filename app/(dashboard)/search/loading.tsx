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
        <Skeleton className="h-8 w-8 rounded-full mb-4" />
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="h-3 w-64" />
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
