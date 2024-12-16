"use client";

import { httpBatchLink, unstable_httpBatchStreamLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useRef, useState } from "react";
import { inferRouterInputs } from "@trpc/server";
import { inferRouterOutputs } from "@trpc/server";
import { createTRPCNext } from "@trpc/next";
import { loggerLink } from "@trpc/client/links/loggerLink";
import { QueryClient } from "@tanstack/react-query";
import { AppRouter } from "../api/trpc-router";

const trpc = createTRPCReact<AppRouter>();

export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;

export const trpcApi = createTRPCNext<AppRouter>({
  config() {
    return {
      queryClientConfig: {
        defaultOptions: {
          queries: {
            // stale time defaults to 30 seconds
            staleTime: 1000 * 30,
          },
        },
      },
      links: [
        loggerLink({
          enabled: (_opts) => process.env.NODE_ENV === "development",
        }),
        unstable_httpBatchStreamLink({
          url: `/api/trpc`,
          // Prevents batching of too many operations which can lead to router error due to too long request path
          maxURLLength: 2048,
        }),
      ],
    };
  },
  ssr: false,
});

export function TRPCProvider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
        }),
      ],
    }),
  );

  return (
    <trpc.Provider queryClient={queryClient} client={trpcClient}>
      {children}
    </trpc.Provider>
  );
}
