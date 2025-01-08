import { PlanWithProduct } from "@/lib/stripe";
import { Maybe } from "actual-maybe";
import Stripe from "stripe";

export const HIGHEST_PLAN = "Extra Large" as const;
export const DEFAULT_PLAN = "Zdarma" as const;
export const PRO_PLAN = "pro_plan_2024" as const;
export const BUSINESS_PLAN = "business_plan_2024" as const;
export const DISPLAYED_STRIPE_PLANS: string[] = [
  DEFAULT_PLAN,
  PRO_PLAN,
  BUSINESS_PLAN,
];

export const PLAN_QUOTAS = {
  [DEFAULT_PLAN]: 200,
  [PRO_PLAN]: 100,
  [BUSINESS_PLAN]: 1000,
};

export const getPlanQuota = (planNickname: string | null) =>
  Maybe.of(
    PLAN_QUOTAS[
      planNickname as
        | typeof DEFAULT_PLAN
        | typeof PRO_PLAN
        | typeof BUSINESS_PLAN
    ],
  );

export const FREE_PLAN_DURATION = 1000 * 60 * 60 * 24 * 14; // 14 days
export const FREE_TRIAL_DURATION_IN_DAYS =
  FREE_PLAN_DURATION / 1000 / 60 / 60 / 24;

export const DEFAULT_PLAN_ID = "default-plan-id";

export const FEATURES = {
  AI_CHAT: "AI_CHAT",
  DOC_CHAT: "DOC_CHAT",
} as const;

export const PLAN_FEATURES = {
  [DEFAULT_PLAN]: [FEATURES.AI_CHAT, FEATURES.DOC_CHAT],
  [PRO_PLAN]: [],
  [BUSINESS_PLAN]: [FEATURES.AI_CHAT, FEATURES.DOC_CHAT],
};

export const getPlanFeatures = (planNickname: string | null) => {
  return Object.entries(PLAN_FEATURES)
    .filter(
      ([plan]) =>
        plan.toLocaleLowerCase() === planNickname?.toLocaleLowerCase(),
    )
    .map(([, features]) => features)
    .flat();
};

export const DEFAULT_PLAN_OBJECT = {
  id: DEFAULT_PLAN_ID,
  object: "plan",
  active: true,
  aggregate_usage: null,
  amount: 0,
  nickname: DEFAULT_PLAN,
  amount_decimal: "0",
  billing_scheme: "per_unit" as const,
  created: 1734466259572,
  currency: "usd",
  interval: "month" as const,
  meter: "recurring",
  interval_count: 1,
  livemode: true,
  metadata: {
    ai_generator: "1",
    active: "1",
    description_key: "defaultPlanDescription",
  },
  product: {
    id: DEFAULT_PLAN_ID,
    object: "product",
    active: true,
    created: 1734466259572,
    description: "defaultPlanDescription",
    name: DEFAULT_PLAN,
    package_dimensions: null,
    shippable: null,
    tax_code: null,
    type: "service",
    livemode: true,
    updated: 1734466259572,
    marketing_features: [],
    url: null,
    images: [],
    metadata: {
      ai_generator: "1",
      active: "1",
      description_key: "defaultPlanDescription",
    },
  },
  tiers: [],
  tiers_mode: null,
  transform_usage: null,
  trial_period_days: null,
  usage_type: "licensed",
} satisfies PlanWithProduct;
