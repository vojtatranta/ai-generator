import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PlanWithProduct } from "./stripe";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPlanPrice = (
  amount: string,
  currency: string = "CZK",
  options: { locale?: string } = {
    locale: "cs-CZ",
  },
) => {
  const price = parseFloat(
    (parseFloat(amount) / 100).toFixed(2).replace(".", ","),
  );
  return new Intl.NumberFormat(options.locale ?? "cs-CZ", {
    style: "currency",
    currency,
  }).format(price);
};

export const getPlanRange = (
  plan: PlanWithProduct,
): { from: number; to: number } | null => {
  const borderLines = {
    from: plan.product.metadata?.["from"] ?? null,
    to: plan.product.metadata?.["to"] ?? null,
  };

  if (!borderLines.from || !borderLines.to) {
    return null;
  }

  return {
    from: Number(borderLines.from),
    to: Number(borderLines.to),
  };
};
