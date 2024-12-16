"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const ReactQueryClientProvider = ({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: React.ReactNode;
}) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
