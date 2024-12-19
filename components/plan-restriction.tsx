import { FEATURES } from "@/constants/plan";
import { getUserPlan, PlanWithProduct, SurePlanResult } from "@/lib/stripe";
import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { getPlanRange } from "@/lib/utils";
import { memo } from "react";

type PlanRestrictionChildren =
  | React.ReactNode
  | ((props: {
      plan: PlanWithProduct;
      planRange: {
        from: number;
        to: number;
      };
      numberOfMonthlyAnswers: number;
    }) => React.ReactNode);

export function PlanRestriction({
  plan,
  children,
  withValidPlanContent,
  numberOfAnswers,
}: {
  plan: PlanWithProduct | undefined;
  children: PlanRestrictionChildren;
  withValidPlanContent?: React.ReactNode;
  numberOfAnswers?: number;
}) {
  if (!plan) {
    return null;
  }

  const planRange = getPlanRange(plan);

  if (!planRange) {
    return null;
  }

  if (
    typeof numberOfAnswers !== "undefined" &&
    withValidPlanContent &&
    numberOfAnswers < planRange.to
  ) {
    return withValidPlanContent;
  }

  return typeof children === "function"
    ? children({
        plan,
        planRange,
        numberOfMonthlyAnswers: numberOfAnswers ?? Infinity,
      })
    : children;
}

export async function PlanRestrictionWrapper({
  children,
  withValidPlanContent,
}: {
  children: PlanRestrictionChildren;
  withValidPlanContent?: React.ReactNode;
}) {
  const user = await getUser();
  const supabaseClient = await createSupabaseServerClient();
  const [userPlan, numberOfAnswers] = await Promise.all([
    getUserPlan(),
    supabaseClient
      .from("answers")
      .select("*, quizes ( user )", {
        count: "exact",
      })
      .eq("quizes.user", user.id)
      .gte(
        "created_at",
        new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      ),
  ]);

  return (
    <PlanRestriction
      plan={userPlan?.plan}
      numberOfAnswers={numberOfAnswers.count ?? Infinity}
      withValidPlanContent={withValidPlanContent}
    >
      {children}
    </PlanRestriction>
  );
}

export const PlanFeatureLimitation = memo(function PlanFeatureLimitation({
  forbiddenFallback,
  planDescr,
  requestedFeatures,
  children,
}: {
  forbiddenFallback: React.ReactNode;
  planDescr: SurePlanResult;
  requestedFeatures: (keyof typeof FEATURES)[];
  children: React.ReactNode;
}) {
  if (
    requestedFeatures.some((feature) => !Boolean(planDescr.features[feature]))
  ) {
    return forbiddenFallback;
  }

  return children;
});
