"use client";
import { useSupabase } from "@/lib/supabase-client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/web/components/ui/avatar";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";
import { useLocale, useTranslations } from "next-intl";

export function RecentSales({ userId }: { userId: string }) {
  const locale = useLocale();
  const t = useTranslations("overview.recentSales");
  const supabase = useSupabase();
  const { data } = useQuery(
    supabase
      .from("answers")
      .select("id, client_email, created_at") // Fetch only the created_at column for optimization
      .eq("user", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  );

  return (
    <div className="space-y-8">
      {data?.map((answer) => (
        <div className="flex items-center" key={answer.id}>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">
              {answer.client_email
                ? answer.client_email
                : t("noEmailAvailable")}
            </p>
            <p className="text-sm text-muted-foreground">
              {answer.created_at
                ? new Date(answer.created_at).toLocaleDateString(locale, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })
                : t("noDateAvailable")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
