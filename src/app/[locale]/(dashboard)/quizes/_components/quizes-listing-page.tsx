import PageContainer from "@/web/components/layout/page-container";
import { buttonVariants } from "@/web/components/ui/button";
import { Heading } from "@/web/components/ui/heading";
import { Separator } from "@/web/components/ui/separator";
import { searchParamsCache } from "@/web/lib/searchparams";
import { cn } from "@/web/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { createSupabaseServerClient, getUser } from "@/web/lib/supabase-server";
import QuizesTable from "./quizes-tables";
import { getTranslations } from "next-intl/server";

type TSocketsListingPage = {};

export default async function QuestionsListingPage({}: TSocketsListingPage) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get("page");
  const search = searchParamsCache.get("q");
  const user = await getUser();
  const pageLimit = searchParamsCache.get("limit");
  const supabase = await createSupabaseServerClient();
  const [totalQuestions, pageQuestions] = await Promise.all([
    supabase.from("quizes").select("*", { count: "exact" }),
    supabase
      .from("quizes")
      .select("*")
      .eq("user", user.id)
      .order("created_at", { ascending: false })
      .range(
        (Number(page || 1) - 1) * Number(pageLimit || 10),
        Number(page || 1) * Number(pageLimit || 10) - 1,
      ),
  ]);

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
  };

  const t = await getTranslations();

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title={`${t("quiz.listing.title")} (${totalQuestions.count})`}
            description={t("quiz.listing.description")}
          />

          <Link
            href={"/quizes/new"}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Plus className="mr-2 h-4 w-4" /> {t("quiz.listing.addNew")}
          </Link>
        </div>
        <Separator />
        <QuizesTable
          data={pageQuestions.data ?? []}
          totalData={totalQuestions.count ?? 0}
        />
      </div>
    </PageContainer>
  );
}
