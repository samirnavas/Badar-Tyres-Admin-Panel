"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import { AuthProvider } from "@/lib/AuthContext";
import { PWARegister } from "@/components/PWARegister";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          dehydrate: {
            shouldDehydrateQuery: defaultShouldDehydrateQuery,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <PWARegister />
      </AuthProvider>
    </QueryClientProvider>
  );
}
