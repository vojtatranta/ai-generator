import Stripe from "stripe";
import {
  createSupabaseServerClient,
  getUser,
  PlanSubscription,
  User,
} from "./supabase-server";
import {
  DEFAULT_PLAN,
  DEFAULT_PLAN_OBJECT,
  FEATURES,
  FREE_PLAN_DURATION,
  getPlanFeatures,
  getPlanQuota,
  HIGHEST_PLAN,
} from "@/constants/plan";
import { getPlanRange } from "./utils";
import { Database } from "@/database.types";
import { SupabaseClient } from "@supabase/supabase-js";
import { addDays } from "date-fns";
import { Maybe } from "actual-maybe";

const stripe: typeof Stripe | null = null;

export const getStripe = (): Stripe => {
  return stripe ?? new Stripe(process.env.STRIPE_SECRET_KEY!);
};

export type PlanWithProduct = Stripe.Plan & {
  product: Stripe.Product;
};

export type PlanWithProductAndSubscription = {
  plan: PlanWithProduct;
  subscription: PlanSubscription;
  user: User;
};

export type SurePlanResult = PlanWithProductAndSubscription & {
  planQuota: number | null;
  numberOfThisMonthGenerations: number;
  planExceeded: boolean;
  trialExpired: boolean;
  trial: boolean;
  remainsOfTrial: number | null;
  features: { [K in keyof typeof FEATURES]?: boolean };
};

export const getSureUserPlan = async (): Promise<SurePlanResult> => {
  const maybeResult = await getUserPlan();
  if (!maybeResult) {
    console.error("User plan not found, logging out");
    throw new Error("User plan not found");
  }

  const supabaseClient = await createSupabaseServerClient();
  return getSurePlanStateDescriptor(maybeResult.user.id, supabaseClient);
};

export const getSurePlanStateDescriptor = async (
  userId: string,
  supabaseClient: SupabaseClient<Database>,
): Promise<SurePlanResult> => {
  const numberOfThisMonthGenerations = await getUsedNumberOfGenerations(userId);
  const plan = await getUserPlanByUserId(userId, supabaseClient);

  if (!plan) {
    throw new Error("User plan not found in getSurePlanStateDescriptor");
  }

  const planQuota = getPlanQuota(plan.plan.nickname).orNull();

  const trial = plan.plan.id === DEFAULT_PLAN_OBJECT.id;
  const trialExpired =
    trial &&
    new Date(plan.subscription.created_at).getTime() + FREE_PLAN_DURATION <
      Date.now();

  const remainsOfTrial =
    !trial || trialExpired
      ? null
      : new Date(plan.subscription.created_at).getTime() +
        FREE_PLAN_DURATION -
        Date.now();

  return {
    ...plan,
    planQuota: getPlanQuota(plan.plan.nickname).orNull(),
    numberOfThisMonthGenerations,
    planExceeded:
      planQuota == null ? false : numberOfThisMonthGenerations >= planQuota,
    trialExpired,
    features: getPlanFeatures(plan.plan.nickname).reduce(
      (acc, feature) => ({
        ...acc,
        [feature]: true,
      }),
      {},
    ),
    trial,
    remainsOfTrial,
  };
};

export const getUsedNumberOfGenerations = async (
  userId: string,
  client?: SupabaseClient<Database>,
) => {
  const supabaseClient = await createSupabaseServerClient();
  const result = await (client ?? supabaseClient)
    .from("ai_results")
    .select("*", {
      count: "exact",
    })
    .eq("user_id", userId)
    .gte(
      "created_at",
      new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    );

  return result?.count ?? Infinity;
};

export const createUserDefaultSubscription = async (
  userId: string,
  client: SupabaseClient<Database>,
  options: { isAdmin?: boolean } = {},
) => {
  const { error: insertError, data } = await client
    .from("subscriptions")
    .insert({
      user: userId,
      active: true,
      is_admin: Boolean(options.isAdmin),
      plan_name: DEFAULT_PLAN,
    });

  if (insertError) {
    console.error("Could not insert default subscription: ", insertError);
    throw new Error(insertError.message);
  }

  return data;
};

export const getUserSubscription = async (
  userId: string,
  client: SupabaseClient<Database>,
) => {
  const { data: subscription } = await client
    .from("subscriptions")
    .select("*")
    .eq("user", userId)
    .eq("active", true)
    .single();

  return subscription;
};

export const getAllActiveUserSubscriptions = async (): Promise<
  PlanSubscription[]
> => {
  const supabaseClient = await createSupabaseServerClient();
  const user = await getUser();
  const { data: subscriptions } = await supabaseClient
    .from("subscriptions")
    .select("*")
    .eq("user", user.id)
    .eq("active", true);

  return subscriptions ?? [];
};

export const getUserPlan =
  async (): Promise<PlanWithProductAndSubscription | null> => {
    const supabaseClient = await createSupabaseServerClient();
    const user = await getUser();

    return getUserPlanByUserId(user.id, supabaseClient);
  };

export const getUserPlanByUserId = async (
  userId: string,
  supabaseClient: SupabaseClient<Database>,
): Promise<PlanWithProductAndSubscription | null> => {
  const user = await getUser();

  if (!user) {
    console.error("User not found when getting user plan");
    return null;
  }

  const [subscription, plans] = await Promise.all([
    supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user", user.id)
      .eq("active", true)
      .single(),
    getAvailableProductPlans(),
  ]);

  if (!subscription.data) {
    console.error(`Active subscription not found in the database ${user.id}`);
    return null;
  }

  const plan =
    [...plans, DEFAULT_PLAN_OBJECT].find(
      (p) =>
        p.product?.name?.toLowerCase() ===
        subscription.data.plan_name.toLocaleLowerCase(),
    ) ?? null;

  if (!plan) {
    console.error(
      "Plan not found in the stripe plan list",
      subscription.data.plan_name,
    );
    return null;
  }

  return {
    user,
    plan,
    subscription: subscription.data,
  };
};

export const getAvailableProductPlans = async () => {
  const supabaseClient = await createSupabaseServerClient();
  const user = await getUser();
  const userId = user.id;
  const fiveDaysOld = addDays(new Date(), -5).toISOString();

  const { data: planDescriptors, error: plansError } = await supabaseClient
    .from("stripe_plans")
    .select("*")
    .eq("user", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  const planDescriptor = planDescriptors?.[0];
  if (plansError) {
    console.error(plansError);
  }

  if (
    planDescriptor &&
    new Date(fiveDaysOld).getTime() <
      new Date(planDescriptor.created_at).getTime()
  ) {
    return planDescriptor.plans_json as unknown as PlanWithProduct[];
  }

  const stripe = getStripe();
  const [plans, products] = await Promise.all([
    stripe.plans.list(),
    stripe.products.list(),
  ]);
  const productsMap = products.data.reduce<Map<string, Stripe.Product>>(
    (acc, product) => {
      acc.set(product.id, product);
      return acc;
    },
    new Map(),
  );

  const resultPlans = [DEFAULT_PLAN_OBJECT, ...(plans.data ?? [])]
    .filter((plan) => {
      if (!plan.product) return false;

      const product = productsMap.get(String(plan.product));
      if (product?.active === false) {
        return false;
      }

      return plan.product || product?.active;
    })
    .map((plan) => ({
      ...plan,
      product:
        typeof plan.product === "string"
          ? productsMap.get(String(plan.product))
          : (plan.product ?? null),
    })) as PlanWithProduct[];

  // @ts-expect-error: weird error here
  await supabaseClient.from("stripe_plans").insert([
    {
      user: userId,
      plans_json: resultPlans,
    },
  ]);

  return resultPlans;
};
