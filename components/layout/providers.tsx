"use client";
import React from "react";
import ThemeProvider from "./ThemeToggle/theme-provider";
import { SessionProvider, SessionProviderProps } from "next-auth/react";
import { createNextSupabaseClient } from "@/web/lib/supabase-client";
import { SupabaseContext } from "@/web/lib/supabase-client";
import { ReactQueryClientProvider } from "../providers/react-query";
import { TRPCProvider } from "../providers/TRPCProvider";
import { QueryClient } from "@tanstack/react-query";
import LocaleProvider from "../providers/date-fns";

const queryClient = new QueryClient();

export default function Providers({
  locale,
  session,
  children,
}: {
  locale: string;
  session: SessionProviderProps["session"];
  children: React.ReactNode;
}) {
  return (
    <>
      <SupabaseContext.Provider value={createNextSupabaseClient()}>
        <ReactQueryClientProvider queryClient={queryClient}>
          <TRPCProvider queryClient={queryClient}>
            <>
              <LocaleProvider localeString={locale} />
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
              >
                <SessionProvider session={session}>{children}</SessionProvider>
              </ThemeProvider>
            </>
          </TRPCProvider>
        </ReactQueryClientProvider>
      </SupabaseContext.Provider>
    </>
  );
}
