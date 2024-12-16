import PageContainer from "@/web/components/layout/page-container";
import { buttonVariants } from "@/web/components/ui/button";
import { Heading } from "@/web/components/ui/heading";
import { Separator } from "@/web/components/ui/separator";
import { searchParamsCache } from "@/web/lib/searchparams";
import { cn, getPlanRange } from "@/web/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import AnswersTable from "./answers-tables";
import { createSupabaseServerClient, getUser } from "@/web/lib/supabase-server";
import { getTranslations } from "next-intl/server";
import { getSureUserPlan } from "@/lib/stripe";
import { PlanRestrictionWrapper } from "@/components/plan-restriction";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/web/database.types";

type TAnswersListingPage = {};

const createFilteredQuery = (
  supabase: SupabaseClient<Database>,
  userId: string,
  filters: {
    page: number | undefined | null;
    limit: number | undefined | null;
    quizId: string[];
  },
) => {
  let answerListQuery = supabase
    .from("answers")
    .select("*")
    .eq("user", userId)
    .order("created_at", { ascending: false });

  let totalAnswersQuery = supabase
    .from("answers")
    .select("id", { count: "exact" })
    .eq("user", userId);

  if (filters.quizId?.length > 0) {
    answerListQuery = answerListQuery.in("quiz", filters.quizId);
    totalAnswersQuery = totalAnswersQuery.in("quiz", filters.quizId);
  }

  return {
    answerListQuery: answerListQuery.range(
      (Number(filters.page || 1) - 1) * Number(filters.limit || 10),
      Number(filters.page || 1) * Number(filters.limit || 10) - 1,
    ),
    totalAnswersQuery,
  };
};

export default async function AnswersListingPage({}: TAnswersListingPage) {
  // Showcasing the use of search params cache in nested RSCs
  const search = searchParamsCache.get("q");
  const [userPlan, user, supabase] = await Promise.all([
    getSureUserPlan(),
    getUser(),
    createSupabaseServerClient(),
  ]);
  const planRange = getPlanRange(userPlan.plan);

  const filters = {
    page: searchParamsCache.get("page"),
    limit: searchParamsCache.get("limit"),
    quizId: searchParamsCache.get("quizId")?.split(".") ?? [],
    ...(search && { search }),
  };

  const { totalAnswersQuery, answerListQuery } = await createFilteredQuery(
    supabase,
    user.id,
    filters,
  );

  const [totalAnswers, pageAnswers, distinctQuizIds, t] = await Promise.all([
    totalAnswersQuery,
    answerListQuery,
    supabase
      .from("answers")
      .select("quiz, quizes (name)")
      .eq("user", user.id)
      .order("created_at", { ascending: false })
      .then((result) => {
        return Array.from(
          result?.data
            ?.reduce<Map<number, { value: number; label: string }>>(
              (map, answer) => {
                if (!map.has(answer.quiz) && answer.quizes) {
                  map.set(answer.quiz, {
                    value: answer.quiz,
                    label: answer.quizes?.name ?? "",
                  });
                }
                return map;
              },
              new Map(),
            )
            .values() ?? [],
        );
      }),

    getTranslations(),
  ]);

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <Heading
              title={`${t("answers.listing.title")} (${
                totalAnswers.count ?? 0
              })`}
              description={t("answers.listing.description")}
            />

            <PlanRestrictionWrapper>
              {({ planRange, numberOfMonthlyAnswers }) => (
                <div>
                  <p className="text-sm">
                    {t("answers.listing.answersInLastMonth")}:{" "}
                    <strong className="font-semibold">
                      {numberOfMonthlyAnswers}
                    </strong>
                  </p>
                  <p>
                    {t("answers.listing.answersRemainingInPlan")}:{" "}
                    <strong className="font-semibold">
                      {Math.max(
                        0,
                        (planRange.to ?? Infinity) - numberOfMonthlyAnswers,
                      )}
                    </strong>
                  </p>
                </div>
              )}
            </PlanRestrictionWrapper>
          </div>
          <Link
            href={"/answers/new"}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Plus className="mr-2 h-4 w-4" /> {t("answers.listing.addNew")}
          </Link>
        </div>
        <Separator />
        <PlanRestrictionWrapper
          withValidPlanContent={
            <AnswersTable
              quizIds={distinctQuizIds}
              data={pageAnswers.data ?? []}
              totalData={totalAnswers.count ?? 0}
            />
          }
        >
          {({ numberOfMonthlyAnswers }) => (
            <div
              className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4"
              role="alert"
            >
              <p className="font-bold">{t("answers.listing.limitReached")}</p>
              <p>
                {t("answers.listing.limitReachedDescription")}{" "}
                <span className="font-semibold">
                  {numberOfMonthlyAnswers} / {planRange?.to ?? 0}
                </span>
              </p>
              <Link
                href="/subscription"
                className="text-blue-500 hover:underline"
              >
                {t("answers.listing.upgradePlan")}
              </Link>
            </div>
          )}
        </PlanRestrictionWrapper>
      </div>
    </PageContainer>
  );
}
