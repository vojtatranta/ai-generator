import { User } from "@/web/lib/supabase-server";
import { initTRPC, TRPCError } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { NextRequest } from "next/server";
import { Langtail } from "langtail";
import {
  createSupabaseServerClient,
  getMaybeUserWithClient,
} from "@/web/lib/supabase-server";
import xmlConverter from "xml-js";

import {
  answerFormStateSchema,
  createEvaluationFromTheAnswerFormState,
  quizQuestionSchema,
} from "@/lib/parsers";
import {
  createProductAttributeConnectionHash,
  PRODUCT_PARSERS,
} from "@/lib/xml-product-parsers";
import {
  createUserDefaultSubscription,
  getUserPlan,
  stripe,
} from "@/lib/stripe";
import z from "zod";
import { PROMPTS } from "@/constants/data";

// Create context type
type Context = {
  req: NextRequest;
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
};

// Context creator
export const createTRPCContext = async (
  opts: FetchCreateContextFnOptions,
): Promise<Omit<Context, "user">> => {
  const req = opts.req as NextRequest;
  const supabase = await createSupabaseServerClient();
  return {
    req,
    supabase,
  };
};
// Initialize tRPC
const t = initTRPC.context<Context>().create();

// Create router and procedure helpers
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const userWithRoles = await getMaybeUserWithClient(ctx.supabase);

  if (!userWithRoles) {
    throw new Error("Unauthorized");
  }

  return next<Context & { user: User }>({
    ctx: {
      ...ctx,
      user: userWithRoles,
    },
  });
});

export const router = t.router;

export const subscriptionRouter = router({
  subscribe: protectedProcedure
    .input(
      z.object({
        planIdToSubscribe: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { planIdToSubscribe } = input;

      try {
        return await stripe.subscriptions.update(planIdToSubscribe, {
          metadata: {
            user: ctx.user.email ?? ctx.user.id,
          },
        });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(err),
        });
      }
    }),

  cancelSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { subscriptionId } = input;
      const { data: databaseSubscription, error: subscriptionError } =
        await ctx.supabase
          .from("subscriptions")
          .select("*")
          .eq("user", ctx.user.id)
          .eq("id", subscriptionId)
          .eq("active", true)
          .single();

      if (!databaseSubscription || subscriptionError) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found",
        });
      }

      if (!databaseSubscription.stripe_subscription_id) {
        return { result: "OK" };
      }

      try {
        await stripe.subscriptions.cancel(
          databaseSubscription.stripe_subscription_id,
        );

        await ctx.supabase
          .from("subscriptions")
          .update({
            active: false,
          })
          .eq("id", subscriptionId);

        const userPlan = await getUserPlan();
        if (!userPlan) {
          await createUserDefaultSubscription(ctx.user.id, ctx.supabase, {
            isAdmin: databaseSubscription.is_admin,
          });
        }

        return { result: "OK" };
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(err),
        });
      }
    }),

  createSubscriptionRequest: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.number(),
        planIdToSubscribe: z.string(),
        currentDomain: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { planIdToSubscribe, currentDomain } = input;
      try {
        // @ts-expect-error: strinage error likely due to typing
        const result = await stripe.checkout.sessions.create({
          return_url: `${currentDomain}/api/stripe-webhook?checkoutId={CHECKOUT_SESSION_ID}&planId=${planIdToSubscribe}&userId=${ctx.user.id}&subscriptionId=${input.subscriptionId}`,
          payment_method_types: ["card"],
          customer_email: ctx.user.email,
          ui_mode: "embedded",
          line_items: [
            {
              price: planIdToSubscribe,
              quantity: 1,
            },
          ],
          metadata: {
            user: ctx.user.email,
            userId: ctx.user.id,
            planId: planIdToSubscribe,
          },
          mode: "subscription",
        });

        return {
          redirectUrl: result.url,
          sessionCheckoutId: result.id,
          clientSessionSecret: result.client_secret,
          publishableApiKey: process.env.STRIPE_API_KEY!,
        };
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(err),
        });
      }
    }),
});

export const productCategoryRouter = router({
  import: protectedProcedure
    .input(z.object({ xmlFileUrl: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { xmlFileUrl } = input;
      const fetchResult = await fetch(xmlFileUrl).then((res) => res.text());
      const json = xmlConverter.xml2js(fetchResult, {
        compact: true,
        ignoreAttributes: true,
      });
      const parsed = PRODUCT_PARSERS.koreanConceptXmlParser.parser(
        json,
        xmlFileUrl,
        new Date(),
      );

      const productAttributes: Map<string, Set<string>> = Array.from(
        parsed.attributes.values(),
      )
        .flat()
        .reduce<Map<string, Set<string>>>((acc, map) => {
          Array.from(map.entries()).forEach(([productId, values]) => {
            if (!acc.has(productId)) {
              acc.set(productId, new Set());
            }
            Array.from(values).forEach((value) => {
              acc.get(productId)!.add(value);
            });
          });
          return acc;
        }, new Map());

      const attributeValues = Array.from(parsed.attributes.entries())
        .flatMap(([categoryName, map]) =>
          Array.from(map.values()).map((values) => ({
            category: categoryName,
            values: Array.from(values),
          })),
        )
        .flatMap(({ values, category }) => {
          return values.map((value) => ({
            category,
            value,
          }));
        });

      const addedAttributeNames: Set<string> = new Set();

      const { error: productCategoriesError } = await ctx.supabase
        .from("product_attributes")
        .insert(
          attributeValues
            .map(({ category, value }) => {
              if (addedAttributeNames.has(value)) {
                return null;
              }
              addedAttributeNames.add(value);

              return {
                name: value,
                attribute_category_name: category,
                user: ctx.user.id,
              };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null),
        );

      const [currentProductCategories, currentProducts] = await Promise.all([
        ctx.supabase
          .from("product_categories")
          .select("*")
          .eq("user", String(ctx.user.id))
          .in(
            "xml_id",
            parsed.productCategories.map(({ id }) => id),
          ),
        ctx.supabase
          .from("products")
          .select("*")
          .eq("user", String(ctx.user.id))
          .in(
            "xml_id",
            parsed.products.map(({ id }) => id),
          ),
      ]);

      if (currentProductCategories.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get current product categories",
        });
      }

      if (currentProducts.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get current products",
        });
      }

      const currentProductCategoriesIds = new Set(
        currentProductCategories.data.map(({ xml_id }) => String(xml_id)),
      );
      const currentProductsIds = new Set(
        currentProducts.data.map(({ xml_id }) => String(xml_id)),
      );

      const productsToInsert = parsed.products.filter(
        ({ id }) => !currentProductsIds.has(String(id)),
      );

      const productCategoriesToInsert = parsed.productCategories.filter(
        ({ id }) => !currentProductCategoriesIds.has(String(id)),
      );
      const productCategoriesToUpdate = parsed.productCategories.reduce<
        Array<(typeof parsed.productCategories)[0] & { dbId?: number }>
      >((acc, parsedCategory) => {
        if (currentProductCategoriesIds.has(String(parsedCategory.id))) {
          const dbCategory = currentProductCategories.data.find(
            (dbCat) => String(dbCat.xml_id) === String(parsedCategory.id),
          );
          acc.push({
            ...parsedCategory,
            dbId: dbCategory?.id,
          });
        }
        return acc;
      }, []);

      const { error: insertedProductCategoriesError, data: addedCategories } =
        await ctx.supabase
          .from("product_categories")
          .insert(
            productCategoriesToInsert.map(({ id, name }) => ({
              xml_id: Number(id),
              name,
              user: ctx.user.id,
              xml_url: xmlFileUrl,
            })),
          )
          .select("*");

      const addedCategoriesMapId = new Map(
        addedCategories?.map((entity) => [entity.xml_id, entity]) ?? [],
      );

      const { error: updatedProductCategoriesError, data: updatedCategories } =
        await ctx.supabase
          .from("product_categories")
          .upsert(
            productCategoriesToUpdate.map(({ id, dbId, name }) => ({
              id: dbId,
              xml_id: Number(id),
              name,
              xml_url: xmlFileUrl,
              user: ctx.user.id,
              updated_at: new Date().toISOString(),
            })),
          )
          .select("*");

      updatedCategories?.forEach((category) => {
        addedCategoriesMapId.set(Number(category.xml_id), category);
      });

      const dbProductsToInsert = productsToInsert.map((product) =>
        PRODUCT_PARSERS.koreanConceptXmlParser.dbProductMapper(product, {
          userId: ctx.user.id,
          xmlFileUrl,
          categoryDbId: addedCategoriesMapId.get(Number(product.categoryId))
            ?.id,
        }),
      );

      const { error: insertedProductsError } = await ctx.supabase
        .from("products")
        .insert(dbProductsToInsert);

      const productsToUpdate = parsed.products.reduce<
        Array<(typeof parsed.products)[0] & { dbId?: number }>
      >((acc, parsedProduct) => {
        if (currentProductsIds.has(String(parsedProduct.id))) {
          const dbProduct = currentProducts.data.find(
            (dbProd) => String(dbProd.xml_id) === String(parsedProduct.id),
          );
          acc.push({
            ...parsedProduct,
            dbId: dbProduct?.id,
          });
        }
        return acc;
      }, []);

      const { error: updatedProductsError } = await ctx.supabase
        .from("products")
        .upsert(
          productsToUpdate.map(({ dbId, ...rest }) =>
            PRODUCT_PARSERS.koreanConceptXmlParser.dbProductMapper(rest, {
              userId: ctx.user.id,
              xmlFileUrl,
              dbId,
              currentDate: new Date().toISOString(),
            }),
          ),
        );

      const { data: dbAttributes } = await ctx.supabase
        .from("product_attributes")
        .select("*")
        .in(
          "name",
          Array.from(
            new Set(Array.from(addedAttributeNames).map((name) => name)),
          ),
        );

      const dbAttributesByName = new Map(
        dbAttributes?.map((entity) => [entity.name, entity]) ?? [],
      );

      const xmlProductIds = Array.from(productAttributes.keys());
      const { data: productsInDatabase } = await ctx.supabase
        .from("products")
        .select("*")
        .eq("user", ctx.user.id)
        .in("xml_id", xmlProductIds);

      const productsById = new Map(
        productsInDatabase?.map((product) => [product.xml_id, product]) ?? [],
      );

      const connectionsToInsert = Array.from(
        productAttributes.entries(),
      ).flatMap(([xmlProductId, values]) => {
        return Array.from(values)
          .map((value) => {
            const entity = dbAttributesByName.get(value);
            const productByXml = productsById.get(Number(xmlProductId));
            if (!entity || !productByXml) {
              return null;
            }

            return {
              product_id: productByXml.id,
              product_xml_id: Number(xmlProductId),
              attribute_uuid: entity.uuid,
              attribute_id: entity.id,
              attribute_product_hash: createProductAttributeConnectionHash({
                product_id: productByXml.id,
                attribute_id: entity.id,
              }),
            };
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item));
      });

      const chunkSize = 20;
      const connectionsToInsertChunks = Array.from(
        { length: Math.ceil(connectionsToInsert.length / chunkSize) },
        (_, i) => connectionsToInsert.slice(i * chunkSize, (i + 1) * chunkSize),
      );

      const connectProductsAttributeErrors = await Promise.all(
        connectionsToInsertChunks.map(async (chunk) => {
          const { error: dataToInsertError } = await ctx.supabase
            .from("attribute_product_connection")
            .insert(chunk);
          return dataToInsertError;
        }),
      );

      const stats: {
        insertedProductCategories: number;
        insertedProducts: number;
        updatedProductCategories: number;
        updatedProducts: number;
      } = {
        insertedProductCategories: insertedProductCategoriesError
          ? 0
          : productCategoriesToInsert.length,
        insertedProducts: insertedProductsError ? 0 : productsToInsert.length,
        updatedProductCategories: updatedProductCategoriesError
          ? 0
          : productCategoriesToUpdate.length,
        updatedProducts: updatedProductsError ? 0 : productsToUpdate.length,
      };

      const errors = [
        insertedProductCategoriesError,
        updatedProductCategoriesError,
        insertedProductsError,
        updatedProductsError,
        productCategoriesError,
        ...(connectProductsAttributeErrors ?? []).map(
          (error) => error?.message ?? (error ? JSON.stringify(error) : null),
        ),
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error("Import ended with errors:", errors);
      }

      return {
        stats,
        importSuccess: errors.length === 0,
        errors: errors.map((error) => {
          return String(error);
        }),
      };
    }),
});

const langtail = new Langtail({
  apiKey: process.env.LANGTAIL_API_KEY!,
});

export const langtailRouter = router({
  invokePrompt: protectedProcedure
    .input(
      z.object({
        prompt: z.enum([PROMPTS.POST_GENERATOR]),
        message: z.string(),
        locale: z.string().optional(),
        length: z.number().optional(),
        stream: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await langtail.prompts.invoke({
        prompt: input.prompt,
        user: ctx.user.id,
        messages: [
          {
            role: "user",
            content: input.message,
          },
        ],
        stream: false,
        variables: {
          ...(input.locale ? { locale: input.locale } : {}),
          ...(input.length ? { length: String(input.length) } : {}),
        },
      });

      return response;
    }),
});

// export const publicProcedure = t.procedure;

// Create the root router
export const appRouter = router({
  // Add your procedures here
  productCategories: productCategoryRouter,
  subscription: subscriptionRouter,
  langtail: langtailRouter,
});

// Export type router type signature
export type AppRouter = typeof appRouter;
