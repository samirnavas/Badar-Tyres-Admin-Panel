"use client";

import { useState } from "react";
import {
  QueryClient,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { AuthProvider } from "@/lib/AuthContext";
import { PWARegister } from "@/components/PWARegister";
import { OfflineBanner } from "@/components/OfflineBanner";

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const persister = createSyncStoragePersister({
  storage:
    typeof window !== "undefined" ? window.localStorage : noopStorage,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            networkMode: "offlineFirst",
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 60 * 24,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            networkMode: "offlineFirst",
          },
        },
      }),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        dehydrateOptions: {
          shouldDehydrateQuery: defaultShouldDehydrateQuery,
        },
      }}
    >
      <AuthProvider>
        <OfflineBanner />
        {children}
        <PWARegister />
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
