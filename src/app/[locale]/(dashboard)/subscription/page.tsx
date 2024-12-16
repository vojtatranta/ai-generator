import type { SearchParams } from "nuqs";
import SubscriptionPlans from "./_components/subscription-plans";
import {
  getAllActiveUserSubscriptions,
  getAvailableProductPlans,
  getSureUserPlan,
} from "@/lib/stripe";

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export const metadata = {
  title: "Dashboard : Subscription plans",
};

export default async function Page({ searchParams }: pageProps) {
  const [plans, userPlan, currentActiveSubscriptions] = await Promise.all([
    getAvailableProductPlans(),
    getSureUserPlan(),
    getAllActiveUserSubscriptions(),
  ]);

  const awaitedSearchParams = await searchParams;

  return (
    <SubscriptionPlans
      plans={plans}
      userPlan={userPlan}
      activeSubscriptions={currentActiveSubscriptions}
      paymentSuccess={Boolean(awaitedSearchParams.success)}
      paymentError={
        awaitedSearchParams.error ? String(awaitedSearchParams.error) : null
      }
    />
  );
}
