import { createSupabaseServerClient, getUser } from "@/web/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { getAvailableProductPlans, stripe } from "@/lib/stripe";
import { getSubscriptionLink } from "@/lib/private-links";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const user = await getUser();

  const supabase = await createSupabaseServerClient();
  const stripeCheckoutId = String(searchParams.get("checkoutId"));
  const subscriptionId = Number(searchParams.get("subscriptionId"));
  const subscribedPlanId = String(searchParams.get("planId"));
  const paymentUserId = String(searchParams.get("userId"));

  if (!user || user.id !== paymentUserId) {
    const redirectUrl = new URL(getSubscriptionLink(), req.url);
    redirectUrl.searchParams.set("error", "subscription.notAuthorized");
    return NextResponse.redirect(redirectUrl.toString());
  }

  if (
    !stripeCheckoutId ||
    !subscriptionId ||
    !subscribedPlanId ||
    !paymentUserId
  ) {
    const redirectUrl = new URL(getSubscriptionLink(), req.url);
    redirectUrl.searchParams.set(
      "error",
      "subscription.missingParametersInSuccessRedirect",
    );
    return NextResponse.redirect(redirectUrl.toString());
  }

  const [stripeSession, availableProductPlans] = await Promise.all([
    stripe.checkout.sessions.retrieve(stripeCheckoutId),
    getAvailableProductPlans(),
  ]);

  const stripeSubscriptionId = String(stripeSession.subscription);

  if (!stripeSession.subscription) {
    const redirectUrl = new URL(getSubscriptionLink(), req.url);
    redirectUrl.searchParams.set(
      "error",
      "subscription.noSubscriptionIdReturned",
    );
    return NextResponse.redirect(redirectUrl.toString());
  }

  if (stripeSession.payment_status !== "paid") {
    const redirectUrl = new URL(getSubscriptionLink(), req.url);
    redirectUrl.searchParams.set("error", "subscription.subscriptionNotPaid");
    return NextResponse.redirect(redirectUrl.toString());
  }

  const { data: prevSubscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user", paymentUserId)
    .eq("active", true)
    .single();

  let stripUnsubscribeError: Error | null = null;
  try {
    if (prevSubscription?.stripe_subscription_id) {
      await stripe.subscriptions.cancel(
        prevSubscription.stripe_subscription_id,
      );
    }
  } catch (error) {
    stripUnsubscribeError = error as Error;
  }

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({ active: !stripUnsubscribeError ? false : true })
    .eq("user", paymentUserId)
    .eq("active", true);

  const nextPlanName = availableProductPlans.find(
    (p) => p.id === subscribedPlanId,
  )?.product.name;

  const { error: insertError } = await supabase.from("subscriptions").insert({
    user: paymentUserId,
    active: true,
    is_admin: Boolean(prevSubscription?.is_admin),
    plan_name: nextPlanName ?? "",
    stripe_subscription_id: stripeSubscriptionId,
    plan_id: subscribedPlanId,
  });

  if (updateError || insertError) {
    const redirectUrl = new URL(getSubscriptionLink(), req.url);
    redirectUrl.searchParams.set("error", "subscription.databaseError");
    return NextResponse.redirect(redirectUrl.toString());
  }

  const redirectUrl = new URL(getSubscriptionLink(), req.url);
  redirectUrl.searchParams.set("success", "true");
  return NextResponse.redirect(redirectUrl.toString());
}
