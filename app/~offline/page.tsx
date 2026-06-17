import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <WifiOff className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-gray-900">You&apos;re offline</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-600">
        Badar Tyres needs an internet connection for live workshop data. Cached
        pages may still be available once you reconnect.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex items-center rounded-lg bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark"
      >
        Try again
      </Link>
    </div>
  );
}
