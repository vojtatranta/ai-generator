"use client";
import PageContainer from "@/web/components/layout/page-container";
import { PlanWithProduct, PlanWithProductAndSubscription } from "@/lib/stripe";
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
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  userPlan: PlanWithProductAndSubscription;
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

    router.replace("/subscription");
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
                      <p className="text-sm text-muted-foreground">
                        {t(plan.product.description)}
                      </p>
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
                      <Button
                        disabled={
                          userPlan?.plan.id === plan.id || mutation.isLoading
                        }
                        onClick={async () => {
                          const result = await mutation.mutateAsync({
                            planIdToSubscribe: plan.id,
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
                          router.replace("/subscription");
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
