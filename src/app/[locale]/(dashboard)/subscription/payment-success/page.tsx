import { SearchParams } from "nuqs/parsers";
import { getAvailableProductPlans, getUserPlan, stripe } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sign } from "crypto";
import { signOut } from "@/auth";
import { notFound } from "next/navigation";

type pageProps = {
  searchParams: SearchParams;
};

export const metadata = {
  title: "Dashboard : Payment success",
};

export default async function PaymentSuccessPage({ searchParams }: pageProps) {
  const supabase = await createSupabaseServerClient();
  const stripeSession = await stripe.checkout.sessions.retrieve(
    String(searchParams.checkoutId),
  );

  if (!stripeSession) {
    notFound();
    return;
  }

  return (
    <div>
      <pre>{JSON.stringify(stripeSession, null, 2)}</pre>
    </div>
  );
}
