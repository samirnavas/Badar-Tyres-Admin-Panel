"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, LogOut, ShieldX } from "lucide-react";
import type { UserRole } from "@/lib/models/User";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isInitialized, hasPermission, permissionsLoaded, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace("/login");
    }
  }, [user, isInitialized, router]);

  if (!isInitialized || !user || !permissionsLoaded) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!hasPermission(pathname)) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <ShieldX className="h-7 w-7 text-red-500" />
          </div>
          <p className="text-5xl font-bold tracking-tight text-gray-900">403</p>
          <p className="mt-3 text-lg font-semibold text-gray-800">
            Forbidden: You do not have access to this module
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Your role ({user.role as UserRole}) is not permitted to view this
            page. Contact an administrator if you need access.
          </p>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
