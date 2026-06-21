"use client";

import { useEffect, useState } from "react";
import { useIsMutating } from "@tanstack/react-query";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  );
  const pendingMutations = useIsMutating();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  const hasPendingSync = pendingMutations > 0;

  return (
    <div
      className={`fixed top-0 left-0 z-50 flex w-full items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white ${
        hasPendingSync ? "bg-amber-500" : "bg-red-500"
      }`}
    >
      <WifiOff size={16} />
      {hasPendingSync
        ? "Offline. Your changes are saved locally and will sync automatically when the connection is restored."
        : "No internet connection. The app is running in offline mode. Some features may be unavailable."}
    </div>
  );
}
