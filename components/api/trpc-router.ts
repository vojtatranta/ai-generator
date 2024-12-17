import { AIResult, User } from "@/web/lib/supabase-server";
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
import { Json } from "@/database.types";

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

const langtail = new Langtail({
  apiKey: process.env.LANGTAIL_API_KEY!,
});

export const langtailRouter = router({
  invokePrompt: protectedProcedure
    .input(
      z.object({
        prompt: z.enum([PROMPTS.POST_GENERATOR, PROMPTS.POST_IMAGE_GENERATOR]),
        message: z.string(),
        locale: z.string().optional(),
        length: z.number().optional(),
        image: z.string().optional(),
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
            content: input.image
              ? [
                  {
                    type: "image_url",
                    image_url: {
                      detail: "auto",
                      url: input.image,
                    },
                  },
                  {
                    type: "text",
                    text: input.message,
                  },
                ]
              : input.message,
          },
        ],
        stream: false,
        variables: {
          ...(input.locale ? { language: input.locale } : {}),
          ...(input.length ? { length: String(input.length) } : {}),
        },
      });

      await ctx.supabase
        .from("ai_results")
        .insert([
          {
            user_id: ctx.user.id,
            prompt_slug: input.prompt,
            prompt: input.message,
            ai_response_id: response.id,
            ai_result: response as unknown as Json,
          },
        ])
        .select("*")
        .single();

      return response;
    }),

  downloadImageResult: protectedProcedure
    .input(
      z.object({
        aiResponseId: z.string(),
        imageUrl: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<AIResult> => {
      const { data: aiResult } = await ctx.supabase
        .from("ai_results")
        .select("*")
        .eq("ai_response_id", input.aiResponseId)
        .eq("user_id", ctx.user.id)
        .single();

      console.log("download get", aiResult);

      if (!aiResult) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "AI Result not found",
        });
      }

      if (aiResult.image_url) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Image already exists",
        });
      }

      const response = await fetch(input.imageUrl);
      const imageBuffer = await response.blob();
      console.log("storage making");
      const image = await ctx.supabase.storage
        .from("ai_generation_images")
        .upload(`${aiResult.uuid}.jpg`, imageBuffer, {
          cacheControl: "3600000000000",
          upsert: true,
        });

      console.log("storage error", image.error);

      if (image.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: image.error.message,
        });
      }

      console.log("udpating");

      const { data: urlObject } = await ctx.supabase.storage
        .from("ai_generation_images")
        .getPublicUrl(image.data.path);

      if (!urlObject) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create image public url",
        });
      }

      const { data: updatedAiResultData, error: updateError } =
        await ctx.supabase
          .from("ai_results")
          .update({
            image_url: urlObject.publicUrl,
          })
          .eq("id", aiResult.id)
          .eq("user_id", ctx.user.id)
          .select("*")
          .single();

      if (updateError) {
        console.error("update error", updateError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: updateError.message,
        });
      }

      return updatedAiResultData;
    }),
});

// export const publicProcedure = t.procedure;

// Create the root router
export const appRouter = router({
  subscription: subscriptionRouter,
  langtail: langtailRouter,
});

// Export type router type signature
export type AppRouter = typeof appRouter;
