"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/** Provider TanStack Query untuk state management & caching */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 menit
            retry: 1,
          },
        },
      })
  );

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <QueryClientProvider client={queryClient}>{children as any}</QueryClientProvider>
  );
}
