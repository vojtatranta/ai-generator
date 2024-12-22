"use client";
import PageContainer from "@/web/components/layout/page-container";
import {
  PlanWithProduct,
  PlanWithProductAndSubscription,
  SurePlanResult,
} from "@/lib/stripe";
import { Heading } from "@/components/ui/heading";
import { useTranslations } from "next-intl";
import { Maybe } from "actual-maybe";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "next-intl";
import { trpcApi } from "@/components/providers/TRPCProvider";
import {
  DEFAULT_PLAN,
  DISPLAYED_STRIPE_PLANS,
  getPlanQuota,
} from "@/constants/plan";
import { formatPlanPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  PaymentModal,
  PaymentModalContainer,
  StripeKeyObject,
} from "@/components/payment-modal";
import { toast } from "sonner";
import { PlanSubscription } from "@/lib/supabase-server";
import { AlertTriangle, BugPlay, CircleAlert, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { If, Then } from "@/components/ui/condition";
import { Icons } from "@/components/icons";
import { isDefaultPlan } from "@/constants/data";
import { getSubscriptionLink } from "@/lib/private-links";

export default function SubscriptionPlans({
  activeSubscriptions,
  plans,
  paymentSuccess,
  paymentError,
  userPlan,
}: {
  activeSubscriptions: PlanSubscription[];
  plans: PlanWithProduct[];
  paymentSuccess: boolean;
  paymentError: string | null;
  userPlan: SurePlanResult;
}) {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const [paymentStripeObject, setPaymentStripeObject] =
    useState<StripeKeyObject | null>(null);
  const mutation = trpcApi.subscription.createSubscriptionRequest.useMutation();
  const cancelMutation = trpcApi.subscription.cancelSubscription.useMutation();

  useEffect(() => {
    if (paymentSuccess) {
      toast.success(t("subscription.successToast"));
    }

    if (paymentError) {
      toast.error(t(paymentError));
    }

    router.replace(getSubscriptionLink());
  }, [paymentSuccess, paymentError, t, router]);

  return (
    <PageContainer>
      {paymentStripeObject && (
        <PaymentModalContainer
          stripeObject={paymentStripeObject}
          isOpen={Boolean(paymentStripeObject)}
          onClose={() => setPaymentStripeObject(null)}
        />
      )}
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {t("subscription.plansHeading")}
          </CardTitle>
          <CardDescription>
            {t("subscription.plansDescription")}
          </CardDescription>
          <If
            condition={
              userPlan.trial &&
              !userPlan.trialExpired &&
              userPlan.remainsOfTrial != null
            }
          >
            <Then>
              <div className="bg-primary p-4 text-primary-foreground rounded-md max-w-[650px]">
                <div className="flex flex-row items-center gap-2">
                  <div className="flex flex-col gap-2">
                    <div className="font-medium">
                      {t("subscription.youHaveATrial")}
                    </div>
                    <div className="text-sm">
                      {t("subscription.trialDescription")}
                    </div>
                    <div className="text-sm">
                      {t("subscription.trialRemains", {
                        remains: Math.round(
                          (userPlan.remainsOfTrial ?? 0) / 1000 / 60 / 60 / 24,
                        ),
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </Then>
          </If>
          <If condition={userPlan.trialExpired}>
            <Then>
              <div className="bg-destructive p-4 text-primary-foreground rounded-md max-w-[650px]">
                <div className="flex flex-row items-center gap-2">
                  <CircleAlert className="h-12 w-12 mr-2" />
                  <div className="flex flex-col gap-2">
                    <div className="font-medium">
                      {t("subscription.trialExpired")}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("subscription.trialExpiredDescription")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Then>
          </If>
          <If condition={userPlan.planExceeded}>
            <Then>
              <div className="bg-destructive p-4 text-primary-foreground rounded-md max-w-[650px]">
                <div className="flex flex-row items-center gap-2">
                  <AlertTriangle className="h-12 w-12 mr-2" />
                  <div className="flex flex-col gap-2">
                    <div className="font-medium">
                      {t("subscription.planExceeded")}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("subscription.planExpiredDescription")}
                      </p>
                      <p>
                        {t("subscription.usedGenerations")}:{" "}
                        {userPlan.numberOfThisMonthGenerations}
                      </p>
                      <p>
                        {t("subscription.planQuota")}: {userPlan.planQuota}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Then>
          </If>
        </CardHeader>
        <CardContent className="max-w-[700px]">
          <div className="space-y-2">
            {DISPLAYED_STRIPE_PLANS.map((planName) =>
              Maybe.of(plans.find((p) => p.nickname === planName))
                .map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between border p-4 rounded-md"
                  >
                    <div>
                      <div className="flex flex-row items-center gap-2">
                        <h2 className="font-medium leading-none">
                          {plan.product.name}
                        </h2>
                        {userPlan?.plan.id === plan.id && (
                          <Badge variant="secondary">
                            {t("subscription.currentPlan")}
                          </Badge>
                        )}
                      </div>
                      <If
                        condition={Boolean(
                          "description_key" in plan.product.metadata &&
                            plan.product.metadata["description_key"],
                        )}
                      >
                        <Then>
                          <p className="text-sm text-muted-foreground">
                            {t(plan.product.metadata["description_key"])}
                          </p>
                        </Then>
                      </If>
                      {getPlanQuota(plan.nickname)
                        .andThen((quota) => (
                          <p className="mt-8 text-xs text-muted-foreground">
                            {quota} {t("subscription.quotaLabel")}
                          </p>
                        ))
                        .orNull()}
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-sm font-medium">
                        {formatPlanPrice(String(plan.amount), plan.currency, {
                          locale,
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("subscription.perPeriod")}
                      </div>
                      <If condition={!isDefaultPlan(plan)}>
                        <Then>
                          <Button
                            disabled={
                              userPlan?.plan.id === plan.id ||
                              mutation.isLoading
                            }
                            onClick={async () => {
                              const result = await mutation.mutateAsync({
                                planIdToSubscribe: plan.id,
                                locale,
                                currentDomain: window.location.origin,
                                subscriptionId: userPlan.subscription.id,
                              });

                              setPaymentStripeObject({
                                clientSessionSecret: String(
                                  result.clientSessionSecret,
                                ),
                                publishableApiKey: result.publishableApiKey,
                              });
                            }}
                          >
                            {t("subscription.subscribeButtonText")}
                          </Button>
                        </Then>
                      </If>
                    </div>
                  </div>
                ))
                .getValue(null),
            )}
          </div>
          <div>
            <h3 className="mt-4 text-lg font-medium">
              {t("subscription.allSubscriptions")}
            </h3>
            <ul className="mt-2 space-y-2">
              {activeSubscriptions.map((subscription) => (
                <li key={subscription.id}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{subscription.plan_name}</p>
                    <Button
                      disabled={
                        cancelMutation.isLoading ||
                        subscription.plan_name === DEFAULT_PLAN
                      }
                      onClick={async () => {
                        try {
                          await cancelMutation.mutateAsync({
                            subscriptionId: subscription.id,
                          });

                          toast.success(t("subscription.successToast"));
                          router.replace(getSubscriptionLink());
                        } catch (err) {
                          toast.error(String(err));
                        }
                      }}
                    >
                      {cancelMutation.isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("subscription.cancelSubscriptionButton")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
