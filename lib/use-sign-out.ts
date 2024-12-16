"use client";
import { signOut } from "next-auth/react";
import { useSupabase } from "./supabase-client";

export function useSignOut({
  redirectTo,
}: {
  redirectTo?: string;
} = {}) {
  const supabase = useSupabase();

  return {
    signOut: async () => {
      await supabase.auth.signOut();
      await signOut({
        redirectTo: redirectTo ?? window.location.href,
      });
    },
  };
}
