"use client";

import { createBrowserClient } from "@supabase/ssr";
import { createContext, useContext } from "react";
import { Database } from "@/web/database.types";

import { User } from "./supabase-server";

export function createNextSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export const SupabaseContext = createContext<
  ReturnType<typeof createNextSupabaseClient>
>(createNextSupabaseClient());

export const useSupabase = () => {
  const supabase = useContext(SupabaseContext);
  if (!supabase) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }

  return supabase;
};

const SupabaseAuthContext = createContext<User | null>(null);

export const SupabaseAuthContextProvider = ({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) => {
  return (
    <SupabaseAuthContext.Provider value={user}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const user = useContext(SupabaseAuthContext);

  if (!user) {
    throw new Error(
      "useSupabaseAuth must be used within a SupabaseAuthProvider",
    );
  }

  if (!user.confirmed_at) {
    throw new Error("User e-email is not confirmed");
  }

  return user;
};
