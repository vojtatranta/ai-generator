import { Product, Quiz } from "@/lib/supabase-server";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { PlanWithProduct } from "@/lib/stripe";
import { PlanRestriction } from "@/components/plan-restriction";
import { getTranslations } from "next-intl/server";
import { QuizResultContainer } from "./QuizResultContainer";
import Image from "next/image";
import { ResultPageSlotsSchemaType } from "../../../(dashboard)/quizes/_components/quiz-form";
import { ResultPageSlotsType } from "@/lib/contants";
import { Maybe } from "actual-maybe";
import { getMetaTags } from "@/components/get-metatags";
import sanitizeHtml from "sanitize-html";

export default async function QuizResultPage({
  allProducts,
  quiz,
  quizPlan,
  numberOfAnswers,
}: {
  allProducts: Map<number, Product>;
  quiz: Quiz;
  quizPlan: PlanWithProduct | undefined;
  numberOfAnswers?: number;
}) {
  const t = await getTranslations();

  const parsedFeatureResult = (quiz.result_page_slots ??
    []) as ResultPageSlotsSchemaType;

  const renderedFeatureAttributesCategories = parsedFeatureResult.reduce<
    Record<ResultPageSlotsType, Set<number>>
  >(
    (acc, slot) => {
      if (slot.type in acc) {
        acc[slot.type].add(Number(slot.entityId));
      } else {
        acc[slot.type] = new Set([Number(slot.entityId)]);
      }
      return acc;
    },
    {
      [ResultPageSlotsType.CATEGORY]: new Set(),
      [ResultPageSlotsType.ATTRIBUTES]: new Set(),
    },
  );

  const productsICategorySlots: Map<number, Map<number, Product>> = new Map(
    Array.from(allProducts.entries()).reduce<Map<number, Map<number, Product>>>(
      (acc, [id, product]) => {
        if (!product.category_id) {
          return acc;
        }
        const productMap = acc.get(product.category_id) ?? new Map();

        productMap.set(id, product);
        acc.set(product.category_id, productMap);

        return acc;
      },
      new Map(),
    ),
  );

  const usedProductsinCategorySlots = new Map(
    Array.from(productsICategorySlots.values()).flatMap((products) =>
      Array.from(products.entries()),
    ),
  );

  // const productsInAtrributeSlots: Map<number, Map<number, Product>> = new Map(
  //   attributeProducts
  //     .entries()
  //     // .filter(([attributeId]) => {
  //     //   return renderedFeatureAttributesCategories[
  //     //     ResultPageSlotsType.ATTRIBUTES
  //     //   ].has(attributeId);
  //     // })
  //     .map(([attributeId, products]) => [
  //       attributeId,
  //       new Map(products.map((product) => [product.id, product])),
  //     ])
  // );

  const allProductsToRender = [
    ...Array.from(
      Array.from(productsICategorySlots.entries()).map(
        ([categoryId, products]) => {
          const slot = parsedFeatureResult?.find(
            (slot) =>
              slot.type === ResultPageSlotsType.CATEGORY &&
              Number(slot.entityId) === categoryId,
          );

          return {
            products: Array.from(products.values()).slice(
              0,
              slot?.productCount ?? quiz.max_number_of_products_to_display,
            ),
            text: slot?.description,
            entityId: categoryId,
            type: ResultPageSlotsType.CATEGORY,
          };
        },
      ),
    ),
    {
      text: t("quiz.result.productsDefaultToPickHeadline"),
      entityId: null,
      type: null,
      products: Array.from(allProducts.values()).filter(
        (product) => !usedProductsinCategorySlots.has(product.id),
      ),
    },

    // ...products.flatMap(
    //   ({ products, text, entityId, type }) => ({
    //     products,
    //     text,
    //     entityId,
    //     type,
    //   })
    // ),
    // {
    //   products: Array.from(productsByCategory.entries())
    //     .flatMap(([_, products]) => products)
    //     .filter((product) => !productsICategorySlots.has(product.id))
    //     .slice(0, quiz.max_number_of_products_to_display),
    //   text: "",
    //   entityId: null,
    //   type: ResultPageSlotsType.CATEGORY,
    // },
    // {
    //   products: Array.from(attributeProducts.entries())
    //     .flatMap(([_, products]) => products)
    //     .filter((product) => !productsInAtrributeSlots.has(product.id))
    //     .slice(0, quiz.max_number_of_products_to_display),
    //   text: "",
    //   entityId: null,
    //   type: ResultPageSlotsType.ATTRIBUTES,
    // },
  ];

  return (
    <QuizResultContainer
      descriptionHtml={quiz.quiz_result_description}
      quizResultHeadline={quiz.quiz_result_headline}
    >
      <PlanRestriction
        plan={quizPlan}
        numberOfAnswers={numberOfAnswers}
        withValidPlanContent={allProductsToRender
          .filter(({ products, text }) => products.length > 0 && text)
          .flatMap(({ entityId, text, products }) => (
            <div>
              <div className="mt-6 mb-4 px-2">
                <h2 key={entityId} className="text-2xl font-bold">
                  {Maybe.of(text)
                    .map((text) => (
                      <div
                        key={entityId}
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
                      />
                    ))
                    .getValue(null)}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white p-4 rounded-lg shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-square relative rounded-lg">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.title}
                            width="393"
                            height="393"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400">
                              {t("quiz.result.noImage")}
                            </span>
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium">{product.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {product.description}
                      </p>
                    </div>
                    <div className="mt-2">
                      {product.product_link && (
                        <Link
                          href={product.buy_link ?? product.product_link}
                          target="_blank"
                          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <div className="flex items-center">
                            <Icons.shoppingBasket className="mr-2 h-4 w-4" />
                            <span>
                              {product.buy_link
                                ? t("quiz.result.addToBasket")
                                : t("quiz.result.goToProduct")}
                            </span>
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      >
        <div className="py-44 mx-auto">
          <h2 className="text-3xl text-center max-w-[500px]">
            {t("quiz.result.planRestriction")}
          </h2>
        </div>
      </PlanRestriction>
    </QuizResultContainer>
  );
}
