import PageContainer from "@/web/components/layout/page-container";
import { buttonVariants } from "@/web/components/ui/button";
import { Heading } from "@/web/components/ui/heading";
import { Separator } from "@/web/components/ui/separator";
import { Employee } from "@/web/constants/data";
import { fakeUsers } from "@/web/constants/mock-api";
import { searchParamsCache } from "@/web/lib/searchparams";
import { cn } from "@/web/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import QuestionsTable from "./questions-tables";
import {
  createSupabaseServerClient,
  getUser,
  Question,
} from "@/web/lib/supabase-server";
import { getTranslations } from "next-intl/server";

type TSocketsListingPage = {};

export default async function QuestionsListingPage({}: TSocketsListingPage) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get("page");
  const search = searchParamsCache.get("q");
  const pageLimit = searchParamsCache.get("limit");
  const supabase = await createSupabaseServerClient();

  const [totalQuestions, pageQuestions, t] = await Promise.all([
    supabase.from("questions").select("*", { count: "exact" }),
    supabase
      .from("questions")
      .select("*")
      .range(
        (Number(page || 1) - 1) * Number(pageLimit || 10),
        Number(page || 1) * Number(pageLimit || 10) - 1,
      ),
    getTranslations(),
  ]);

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
  };

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title={`${t("questions.listing.title")} (${totalQuestions.count})`}
            description={t("questions.listing.description")}
          />

          <Link
            href={"/questions/new"}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Plus className="mr-2 h-4 w-4" /> {t("questions.listing.addNew")}
          </Link>
        </div>
        <Separator />
        <QuestionsTable
          data={pageQuestions.data ?? []}
          totalData={totalQuestions.count ?? 0}
        />
      </div>
    </PageContainer>
  );
}
