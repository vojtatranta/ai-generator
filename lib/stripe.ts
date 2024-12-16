import Stripe from "stripe";
import {
  createSupabaseServerClient,
  getUser,
  PlanSubscription,
  User,
} from "./supabase-server";
import { DEFAULT_PLAN, HIGHEST_PLAN } from "@/constants/plan";
import { getPlanRange } from "./utils";
import { Database } from "@/database.types";
import { SupabaseClient } from "@supabase/supabase-js";
import { addDays } from "date-fns";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export type PlanWithProduct = Stripe.Plan & {
  product: Stripe.Product;
};

export type PlanWithProductAndSubscription = {
  plan: PlanWithProduct;
  subscription: PlanSubscription;
  user: User;
};

export const getSureUserPlan =
  async (): Promise<PlanWithProductAndSubscription> => {
    const maybeResult = await getUserPlan();
    if (!maybeResult) {
      console.error("User plan not found, logging out");
      throw new Error("User plan not found");
    }

    return maybeResult;
  };

export const getUsedNumberOfAnswers = async (userId: string) => {
  const supabaseClient = await createSupabaseServerClient();
  return (
    (
      await supabaseClient
        .from("answers")
        .select("*", {
          count: "exact",
        })
        .eq("user", userId)
        .gte(
          "created_at",
          new Date(
            new Date().getTime() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        )
    )?.count ?? Infinity
  );
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

    // if (subscription.data.is_admin) {
    //   const plan =
    //     plans.find(
    //       (p) => p.product.name?.toLowerCase() === HIGHEST_PLAN.toLowerCase()
    //     ) ?? null;

    //   if (!plan) {
    //     return null;
    //   }

    //   return { user, plan, subscription: subscription.data };
    // }

    const plan =
      plans.find(
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
  const [user, supabaseClient] = await Promise.all([
    getUser(),
    createSupabaseServerClient(),
  ]);
  const userId = user.id;
  const fiveDaysOld = addDays(new Date(), -5).toISOString();

  const { data: planDescriptor } = await supabaseClient
    .from("stripe_plans")
    .select("*")
    .eq("user", userId)
    .order("created_at", { ascending: false })
    .single();

  if (
    planDescriptor &&
    new Date(planDescriptor.created_at).getTime() >
      new Date(fiveDaysOld).getTime()
  ) {
    return planDescriptor.plans_json as unknown as PlanWithProduct[];
  }

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

  const resultPlans = (plans.data
    ?.filter((plan) => {
      if (!plan.product) return false;

      const product = productsMap.get(String(plan.product));
      return product?.active;
    })
    .map((plan) => ({
      ...plan,
      product: plan.product ? productsMap.get(String(plan.product)) : null,
    })) ?? []) as PlanWithProduct[];

  // @ts-expect-error: weird error here
  await supabaseClient.from("stripe_plans").insert([
    {
      user: userId,
      plans_json: resultPlans,
    },
  ]);

  return resultPlans;
};