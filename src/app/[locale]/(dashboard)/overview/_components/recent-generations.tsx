"use client";
import { getPromptLink } from "@/lib/private-links";
import { useSupabase } from "@/lib/supabase-client";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { memo } from "react";

export const RecentGenerations = memo(function RecentGenerations({
  userId,
}: {
  userId: string;
}) {
  const t = useTranslations();
  const supabase = useSupabase();
  const { data } = useQuery(
    supabase
      .from("ai_results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  );

  return (
    <div className="space-y-8">
      {data?.map((generation) => (
        <div className="flex items-center" key={generation.id}>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">
              <Link href={getPromptLink(generation.prompt_slug)}>
                {new Date(generation.created_at).toLocaleDateString()} -{" "}
                {t(`breadCrumbs.${generation.prompt_slug}`)}
              </Link>
            </span>
            <p className="text-sm font-medium leading-none">
              <Link href={getPromptLink(generation.prompt_slug)}>
                {generation.prompt
                  ? generation.prompt.length > 200
                    ? `${generation.prompt.substring(0, 197)}...`
                    : generation.prompt
                  : ""}
              </Link>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
});
