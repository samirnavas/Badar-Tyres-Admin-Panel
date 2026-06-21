import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6">
      <ErrorState
        icon={FileQuestion}
        title="Page Not Found"
        description="The resource you are looking for doesn't exist or has been moved."
      />
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
