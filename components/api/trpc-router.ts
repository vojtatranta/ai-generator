import { AIResult, getUser, User } from "@/web/lib/supabase-server";
import { initTRPC, TRPCError } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { NextRequest } from "next/server";
import { Langtail } from "langtail";
import { pc, PINECODE_EMBEDDINGS_MODEL } from "@/lib/pinecode";
import fs from "fs/promises";
import {
  createSupabaseServerClient,
  getMaybeUserWithClient,
} from "@/web/lib/supabase-server";

import {
  createUserDefaultSubscription,
  getUserPlan,
  stripe,
} from "@/lib/stripe";
import z from "zod";
import { PROMPTS } from "@/constants/data";
import { Database, Json } from "@/database.types";
import { getLocale } from "next-intl/server";
import { textChunker } from "@/lib/pinecode";
import { SupabaseClient } from "@supabase/supabase-js";
import path from "path";

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
        locale: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { planIdToSubscribe, currentDomain } = input;

      try {
        const result = await stripe.checkout.sessions.create({
          // @ts-expect-error: strinage error likely due to typing
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
          locale: input.locale ?? (await getLocale()),
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
          message: `STRIPE ERROR: ${String(err)}`,
        });
      }
    }),
});

const langtail = new Langtail({
  apiKey: process.env.LANGTAIL_API_KEY!,
});

export const langtailRouter = router({
  askDocument: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        locale: z.string(),
        length: z.number(),
        fileIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fileId = input.fileIds[0];

      if (!fileId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Noe file selecte",
        });
      }

      const { data: file } = await ctx.supabase
        .from("files")
        .select("*")
        .eq("user_id", ctx.user.id)
        .eq("id", fileId)
        .single();

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Files not found",
        });
      }

      const embedding =
        (
          await pc.inference.embed(PINECODE_EMBEDDINGS_MODEL, [input.message], {
            inputType: "passage",
            truncate: "END",
          })
        ).data[0]?.values ?? [];

      console.log("embedding", embedding);

      const { data: embeddings, error: embeddingsError } =
        await ctx.supabase.rpc("match_documents", {
          query_embedding: `[${embedding.join(",")}]`, // Pass the query embeddingembedding, // Pass the embedding you want to compare
          match_threshold: 0.78, // Choose an appropriate threshold for your data
          match_count: 10, // Choose the number of matches
          file_id: file.id, // Pass the file_id you want to compare
        });

      if (embeddingsError) {
        console.warn("embeddings error", embeddingsError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not get embeddings",
        });
      }

      console.log("embeddings", embeddings);

      const embeddingsText =
        embeddings?.map(({ chunk }) => chunk).join("...") ?? "";

      console.log("embeddingsText", embeddingsText);

      const response = await langtail.prompts.invoke({
        prompt: PROMPTS.TEXT_DATA_FINDER,
        user: ctx.user.id,
        variables: {
          ...(input.locale ? { language: input.locale } : {}),
          ...(input.length ? { length: String(input.length) } : {}),
          ...(embeddingsText ? { embeddings: embeddingsText } : {}),
        },
        messages: [
          {
            role: "user",
            content: input.message,
          },
        ],
      });

      return response;
    }),

  invokePrompt: protectedProcedure
    .input(
      z.object({
        prompt: z.enum([
          PROMPTS.POST_GENERATOR,
          PROMPTS.POST_IMAGE_GENERATOR,
          PROMPTS.ARTICLE_SUMMARIZER,
          PROMPTS.DOCUMENT_CHAT,
        ]),
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

async function getFileContent(filePath: string) {
  const readFile = await fs.readFile(filePath);
  const extName = path.extname(filePath);

  if (extName.toLowerCase() === ".pdf") {
    // @ts-expect-error: wrong typing
    const pdfModule = await import("pdf-parse/lib/pdf-parse.js");

    const { text } = await pdfModule.default(readFile);
    console.log("text", text);
    return text;
  }

  if (extName.toLowerCase() === ".txt") {
    return readFile.toString("utf-8");
  }
}

async function handleUploadedFileContent(
  filePath: string,
  fileName: string,
  fileContent: string,
  supabase: SupabaseClient<Database>,
  fileUrl?: string,
) {
  console.log("fileContent", fileContent);
  const user = await getUser();
  const { data: addedFile, error: fileError } = await supabase
    .from("files")
    .insert([
      {
        user_id: user.id,
        filename: fileName,
        url: fileUrl ?? null,
        local_file_path: filePath ?? null,
      },
    ])
    .select("*")
    .single();

  if (!addedFile) {
    console.warn("file addition error:", fileError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not create file",
    });
  }

  const chunks = textChunker(fileContent);

  const chunkData = await Promise.all(
    chunks.map(async (chunk) => ({
      user_id: user.id,
      chunk: chunk,
      file: addedFile.id,
      embeddings: `[${(
        await pc.inference.embed(PINECODE_EMBEDDINGS_MODEL, [chunk], {
          inputType: "passage",
          truncate: "END",
        })
      ).data
        .flatMap(({ values }) => values)
        .join(",")}]`,
      embedding_type: PINECODE_EMBEDDINGS_MODEL,
    })),
  );

  const { data: documents, error: documentError } = await supabase
    .from("documents")
    .insert(chunkData)
    .select("*");

  if (documentError) {
    console.warn("document chunking error", documentError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: documentError.message,
    });
  }

  return documents;
}

const filesRouter = router({
  handleUploadedFile: protectedProcedure
    .input(
      z.object({
        filePath: z.string(),
        originalFileName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log("input", input);

      const { data: file, error } = await ctx.supabase.storage
        .from("documents")
        .upload(input.filePath, await fs.readFile(input.filePath), {
          cacheControl: "3600000000000",
          upsert: true,
        });
      let fileContent: string | undefined;
      try {
        fileContent = await getFileContent(input.filePath);
      } catch (err) {
        console.error("error get file content", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(err),
        });
      }
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const result = await handleUploadedFileContent(
        input.filePath,
        input.originalFileName,
        fileContent ?? "",
        ctx.supabase,
        file.path,
      );

      console.log("result", result);

      await fs.rm(input.filePath);

      return result;
    }),

  uploadText: protectedProcedure
    .input(
      z.object({
        text: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return handleUploadedFileContent(
        input.name,
        input.name,
        input.text,
        ctx.supabase,
      );
    }),

  listFiles: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const { data: files } = await ctx.supabase
      .from("files")
      .select("*")
      .eq("user_id", userId);

    return files;
  }),
});

// export const publicProcedure = t.procedure;

// Create the root router
export const appRouter = router({
  subscription: subscriptionRouter,
  langtail: langtailRouter,
  filesRouter,
});

// Export type router type signature
export type AppRouter = typeof appRouter;
