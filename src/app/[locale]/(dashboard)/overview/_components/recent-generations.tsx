"use client";
import { useSupabase } from "@/lib/supabase-client";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";
import { memo } from "react";

export const RecentGenerations = memo(function RecentGenerations({
  userId,
}: {
  userId: string;
}) {
  const supabase = useSupabase();
  const { data } = useQuery(
    supabase
      .from("ai_results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  );

  return (
    <div className="space-y-8">
      {data?.map((generation) => (
        <div className="flex items-center" key={generation.id}>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">
              {new Date(generation.created_at).toLocaleDateString()}
            </span>
            <p className="text-sm font-medium leading-none">
              {generation.prompt}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
});
