"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6">
      <ErrorState
        icon={AlertTriangle}
        title="Something went wrong"
        description="We encountered an unexpected error. Please try refreshing the page or contact support if the issue persists."
        retryAction={() => reset()}
      />
    </div>
  );
}
