import { createSupabaseServerClient, Product } from "@/web/lib/supabase-server";
import { notFound } from "next/navigation";
import QuizResultPage from "../../_components/QuizResult";
import { getAvailableProductPlans } from "@/lib/stripe";
import { getMetaTags } from "@/components/get-metatags";

export async function generateMetadata({
  params,
}: {
  params: { locale: string; quizUuid: string; resultUuid: string };
}) {
  return getMetaTags({
    title: "Perfect Pick - Quiz Result",
    description:
      "Perfect Pick is a product recommendation service that uses AI to suggest the best products for your needs. Create a quiz, answer a few questions, and get matched with products that are tailored to your preferences.",
    url: `https://aistein.cz/${params.locale}/answer/${params.quizUuid}/result/${params.resultUuid}`,
  });
}

export default async function QuizAnswerPage({
  params,
}: {
  params: { quizUuid: string; resultUuid: string };
}) {
  const supabase = await createSupabaseServerClient();
  const [quizResult, quiz] = await Promise.all([
    supabase
      .from("quiz_results")
      .select("*")
      .eq("uuid", params.resultUuid)
      .single(),
    supabase.from("quizes").select("*").eq("uuid", params.quizUuid).single(),
  ]);

  if (!quizResult.data || !quiz.data) {
    notFound();
  }

  const [resultCategories, resultAttributes] = await Promise.all([
    supabase
      .from("quiz_evaluation_results")
      .select("*, product_categories ( *, products (*) )")
      .not("category", "is", null)
      .eq("quiz_result", quizResult.data.id)
      .eq("user", quiz.data.user)
      .order("score", { ascending: false }),

    supabase
      .from("quiz_evaluation_results")
      .select(
        "*, product_attributes ( *, attribute_product_connection ( *,  products ( * )))",
      )
      .not("attribute", "is", null)
      .eq("quiz_result", quizResult.data.id)
      .eq("user", quiz.data.user)
      .order("score", { ascending: false }),
  ]);

  const [quizPlan, plans, numberOfAnswers] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user", quiz.data.user)
      .eq("active", true)
      .single(),
    getAvailableProductPlans(),
    supabase
      .from("answers")
      .select("*, quizes ( user )", { count: "exact" })
      .eq("quizes.user", quiz.data.user)
      .gte(
        "created_at",
        new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      ),
  ]);

  const plan = plans.find(
    (p) =>
      p.product.name?.toLowerCase() === quizPlan.data?.plan_name.toLowerCase(),
  );

  const flattenedCategoryProducts = (resultCategories?.data ?? []).flatMap(
    (r) => r.product_categories?.products ?? [],
  );

  const flattenedAttributeProductConnections = (
    resultAttributes?.data ?? []
  ).flatMap((r) => r.product_attributes?.attribute_product_connection ?? []);

  const allProductsToDisplay = [
    ...flattenedAttributeProductConnections.flatMap((p) => p.products ?? []),
    ...flattenedCategoryProducts,
  ];

  return (
    <QuizResultPage
      quiz={quiz.data}
      quizPlan={plan}
      numberOfAnswers={numberOfAnswers.count ?? 0}
      allProducts={allProductsToDisplay.reduce<Map<number, Product>>(
        (acc, p) => {
          acc.set(p.id, p);
          return acc;
        },
        new Map(),
      )}
    />
  );
}
