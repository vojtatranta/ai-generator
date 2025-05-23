import { AIResult, getUser, User } from "@/web/lib/supabase-server";
import { initTRPC, TRPCError } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { NextRequest } from "next/server";
import { Langtail } from "langtail";
import { getPC, PINECODE_EMBEDDINGS_MODEL } from "@/lib/pinecode";
import {
  createSupabaseServerClient,
  getMaybeUserWithClient,
} from "@/web/lib/supabase-server";

import {
  createUserDefaultSubscription,
  getUserPlan,
  getStripe,
} from "@/lib/stripe";
import z from "zod";
import {
  BUCKET_NAME,
  EMBEDDINGS_SUMMARIZER,
  FILE_NAME_GUESSER,
  GOOGLE_PROJECT_ID,
  PROMPTS,
  RAG_QUERY_IMPROVER,
  SPEECH_TO_TEXT,
} from "@/constants/data";
import { Database, Json } from "@/database.types";
import { getLocale, getTranslations } from "next-intl/server";
import { textChunker } from "@/lib/pinecode";
import { SupabaseClient } from "@supabase/supabase-js";
import path from "path";
import { PdfReader } from "pdfreader";
import OpenAI from "openai";
import {
  concatenateAudioChunksToBlob,
  createAudioStreamFromDBChunks,
  getBlobFromDBChunk,
} from "@/lib/stream-from-db";
import { BlobLike, FileLike } from "openai/uploads.mjs";
import { getAudioUploadStreamLink } from "@/lib/public-links";
import { waitUntil } from "@vercel/functions";
import { Storage } from "@google-cloud/storage";
import { handleGCPDownloadedFile } from "@/lib/upload-audio-action";
import { error } from "console";

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
        return await getStripe().subscriptions.update(planIdToSubscribe, {
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
        await getStripe().subscriptions.cancel(
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
        const result = await getStripe().checkout.sessions.create({
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
        filename: z.string(),
        locale: z.string(),
        length: z.number().optional(),
        fileIds: z.array(z.number()).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      performance.mark("start");

      const filePromise = ctx.supabase
        .from("files")
        .select("*")
        .eq("id", input.fileIds[0])
        .single();

      // const improveQuestionPromise = langtail.prompts.invoke({
      //   prompt: RAG_QUERY_IMPROVER,
      //   user: ctx.user.id,
      //   variables: {
      //     ...(input.locale ? { language: input.locale } : {}),
      //   },
      //   messages: [
      //     {
      //       role: "user",
      //       content: input.message,
      //     },
      //   ],
      // });

      const embeddingPromise = getPC().inference.embed(
        PINECODE_EMBEDDINGS_MODEL,
        [input.message],
        {
          inputType: "passage",
          truncate: "END",
        },
      );

      const embedding = (await embeddingPromise).data[0]?.values ?? [];

      const { data: embeddings, error: embeddingsError } =
        await ctx.supabase.rpc("match_documents2", {
          query_embedding: `[${embedding.join(",")}]`, // Pass the query embeddingembedding, // Pass the embedding you want to compare
          match_threshold: 0.8, // Choose an appropriate threshold for your data
          match_count: 6, // Choose the number of matches
          file_ids: input.fileIds, // Pass the file_id you want to compare
        });

      if (embeddingsError) {
        console.warn("embeddings error", embeddingsError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not get embeddings",
        });
      }

      let rawEmbeddings = embeddings?.map(({ chunk }) => chunk.trim()) ?? [];

      if (!rawEmbeddings.length || rawEmbeddings.join("").length < 100) {
        console.log("getting raw embeddings");
        const { data: chunks, error: chunksError } = await ctx.supabase
          .from("documents")
          .select("chunk")
          .eq("user_id", ctx.user.id)
          .not("chunk", "is", null)
          .in("file", input.fileIds)
          .limit(7);

        if (!chunks || !chunks.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Document not found, chunks error: " + chunksError?.message,
          });
        }

        rawEmbeddings = chunks.map(({ chunk }) => (chunk ?? "").trim());
      }

      const embeddingsText = `
      Source file: ${input.filename}
      Following is the chunks from the file:
      ${rawEmbeddings.reduce(
        (str, chunk, index) => `${str}
      --------
      ${index + 1}: ${chunk}\n`,
        "",
      )}
      `;

      const { data: file } = await filePromise;
      const result = await langtail.prompts.invoke({
        prompt: PROMPTS.TEXT_DATA_FINDER,
        user: ctx.user.id,
        variables: {
          ...(input.locale ? { language: input.locale } : {}),
          ...(input.length ? { length: String(input.length) } : {}),
          ...(embeddingsText ? { embeddings: embeddingsText } : {}),
          ...(file && file.file_summary ? { summary: file.file_summary } : {}),
        },
        messages: [
          {
            role: "user",
            content: input.message,
          },
        ],
      });

      return result;
    }),

  invokePrompt: protectedProcedure
    .input(
      z.object({
        prompt: z.enum([
          PROMPTS.POST_GENERATOR,
          PROMPTS.POST_IMAGE_GENERATOR,
          PROMPTS.ARTICLE_SUMMARIZER,
          PROMPTS.DOCUMENT_CHAT,
          RAG_QUERY_IMPROVER,
          FILE_NAME_GUESSER,
          SPEECH_TO_TEXT,
        ]),
        message: z.string(),
        locale: z.string().optional(),
        length: z.number().optional(),
        image: z.string().optional(),
        stream: z.boolean().default(false),
        additionalVariables: z.record(z.string(), z.string()).optional(),
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
          ...(input.additionalVariables ?? {}),
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
        .from(process.env.AI_GENERATION_BUCKET_NAME!)
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
        .from(process.env.AI_GENERATION_BUCKET_NAME!)
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

async function getFileContent(fileBuffer: Buffer, filePath: string) {
  const extName = path.extname(filePath);

  if (extName.toLowerCase() === ".pdf") {
    return await new Promise<string>((resolve, reject) => {
      let pdfText = "";
      new PdfReader().parseBuffer(fileBuffer, (err, item) => {
        if (err) {
          reject(err);
        } else if (!item) {
          console.warn("end of file", pdfText);
          resolve(pdfText);
        } else if (item.text) {
          console.log("pdf text chunk", pdfText);
          pdfText += item.text;
        }
      });
    });
  }

  if (extName.toLowerCase() === ".txt") {
    return fileBuffer.toString("utf-8");
  }
}

async function handleUploadedFileContent(
  filePath: string | null,
  fileName: string,
  fileContent: string,
  supabase: SupabaseClient<Database>,
  options: {
    fileUrl?: string;
    locale?: string;
    type?: string;
    additionalContextForSummarizer?: string;
    commonFileUuid?: string;
    cloudPath?: string | null;
  } = {},
) {
  const user = await getUser();
  const textBegging = fileContent.substring(0, 500);

  const result = await langtail.prompts.invoke({
    prompt: EMBEDDINGS_SUMMARIZER,
    user: user.id,
    stream: false,
    variables: {
      length: "300",
      language: options.locale ?? "cs",
      embeddings: `${textBegging}`,
      filename: fileName,
      additionalContext: options.additionalContextForSummarizer ?? "",
    },
  });
  const { data: addedFile, error: fileError } = await supabase
    .from("files")
    .insert([
      {
        user_id: user.id,
        filename: fileName,
        url: options.fileUrl ?? options.cloudPath ?? null,
        local_file_path: filePath ?? options.cloudPath ?? null,
        file_summary: result.choices?.[0]?.message?.content ?? null,
        type: options.type ?? null,
        common_file_uuid: options.commonFileUuid ?? null,
      },
    ])
    .select("id, uuid, filename, url, type")
    .single();

  if (options.commonFileUuid && addedFile) {
    // NOTE: delete the chunks that were proccessed to the complete file and indexed
    await Promise.all([
      supabase
        .from("file_chunks")
        .delete()
        .eq("common_file_uuid", options.commonFileUuid),
    ]);
  }

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
        await getPC().inference.embed(PINECODE_EMBEDDINGS_MODEL, [chunk], {
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

  return { addedFile, documents };
}

export async function transcribeAudio(
  chunkId: number,
  userId: string,
  ctx: {
    supabase: SupabaseClient<Database>;
    locale?: string;
    createFileOnEnd?: boolean;
    commonFileUuid?: string;
    dontRetry?: boolean;
  },
) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  // const localUrl = `/api/audio-stream?commonFileUuid=${commonFileUuid}`;

  // const { data: file, error } = await ctx.supabase
  //   .from("files")
  //   .insert([
  //     {
  //       filename: commonFileUuid,
  //       user_id: userId,
  //       url: localUrl,
  //       common_file_uuid: commonFileUuid,
  //     },
  //   ])
  //   .select("*")
  //   .single();

  // if (error) {
  //   throw new TRPCError({
  //     code: "INTERNAL_SERVER_ERROR",
  //     message: error.message,
  //   });
  // }

  try {
    const { chunk, fileLike } = await getBlobFromDBChunk(chunkId, userId, {
      supabaseClient: ctx.supabase,
      expectedMime: "audio/mpeg",
    });

    const transcription = await openai.audio.transcriptions.create({
      file: fileLike,
      model: "whisper-1",
      language: ctx.locale ?? "cs",
    });

    // Save transcription to the documents table
    // const documentsPromise = ctx.supabase
    //   .from("documents")
    //   .insert([
    //     {
    //       user_id: userId,
    //       chunk: transcription.text,
    //       file: file.id,
    //       embedding_type: "whisper-1",
    //     },
    //   ])
    //   .select("*")
    //   .single();

    // const shortenedTranscript = transcription.text.substring(0, 200);

    // const fileNameGuesserPromise = langtail.prompts.invoke({
    //   prompt: FILE_NAME_GUESSER,
    //   user: userId,
    //   messages: [
    //     {
    //       role: "user",
    //       content: shortenedTranscript,
    //     },
    //   ],
    // });
    // const fileSummaryPromise = langtail.prompts.invoke({
    //   prompt: EMBEDDINGS_SUMMARIZER,
    //   user: userId,
    //   stream: false,
    //   variables: {
    //     length: "300",
    //     language: "cs",
    //     embeddings: shortenedTranscript,
    //   },
    // });

    // const [fileNameGuesser, fileSummary] = await Promise.all([
    //   fileNameGuesserPromise,
    //   fileSummaryPromise,
    // ]);

    await ctx.supabase
      .from("file_chunks")
      .update({
        text: transcription.text,
      })
      .eq("id", chunkId);

    if (ctx.createFileOnEnd && ctx.commonFileUuid) {
      console.log("creating file on transcription end", ctx.commonFileUuid);
      waitUntil(
        handleCompleteAudio(ctx.commonFileUuid, {
          supabase: ctx.supabase,
          userId,
          cloudFilePath: chunk?.cloud_path ?? null,
          locale: ctx.locale ?? "cs",
        }),
      );
    }

    return {
      transcription: transcription.text,
    };
  } catch (err) {
    if (
      err instanceof Error &&
      String(err).includes("inimum audio length is 0.1 second")
    ) {
      // NOTE: when chunk is too small, delete it
      await ctx.supabase.from("file_chunks").delete().eq("id", chunkId);
    }

    if (!ctx.dontRetry) {
      return transcribeAudio(chunkId, userId, {
        ...ctx,
        dontRetry: true,
      });
    }

    console.error("error file", chunkId);
    console.error("error transcribing audio", err);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: String(err),
    });
  }
}

export async function handleCompleteAudio(
  commonFileUuid: string,
  ctx: {
    supabase: SupabaseClient<Database>;
    userId: string;
    cloudFilePath?: string | null;
    locale: string;
  },
) {
  const { data: chunks } = await ctx.supabase
    .from("file_chunks")
    .select("text, cloud_path")
    .eq("common_file_uuid", commonFileUuid)
    .eq("user_id", ctx.userId)
    .order("order", { ascending: true });

  if (!chunks) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "No chunks found",
    });
  }

  const transcription = chunks?.map(({ text }) => text?.trim()).join("") || "";

  const shortenedTranscript = transcription.substring(0, 400);

  const fileNameGuesserPromise = langtail.prompts.invoke({
    prompt: FILE_NAME_GUESSER,
    user: ctx.userId,
    messages: [
      {
        role: "user",
        content: shortenedTranscript,
      },
    ],
    variables: {
      ...(ctx.locale && { language: ctx.locale }),
    },
  });

  const [fileNameGuesser] = await Promise.all([fileNameGuesserPromise]);

  const result = await handleUploadedFileContent(
    null,
    (await fileNameGuesser.choices?.[0]?.message.content) ??
      `Audio from ${new Date().toISOString()}.mp3`,

    transcription,
    ctx.supabase,
    {
      fileUrl: getAudioUploadStreamLink(commonFileUuid),
      cloudPath: chunks[0]?.cloud_path ?? ctx.cloudFilePath,
      type: "audio",
      commonFileUuid,
      additionalContextForSummarizer: "A transcription of the audio recording",
    },
  );

  // NOTE: delete the oustading chunks as they take a lot of space
  await ctx.supabase
    .from("file_chunks")
    .delete()
    .eq("common_file_uuid", commonFileUuid)
    .eq("user_id", ctx.userId);

  return result;
}

export async function handleUploadedFile(
  fileBuffer: Buffer,
  filePath: string,
  fileName: string,
  supabase: SupabaseClient<Database>,
  options: {
    type?: string;
  } = {},
) {
  const { data: file, error } = await supabase.storage
    .from("documents")
    .upload(filePath, fileBuffer, {
      cacheControl: "3600000000000",
      upsert: true,
    });
  let fileContent: string | undefined;
  try {
    fileContent = await getFileContent(fileBuffer, filePath);
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

  if (!fileContent) {
    console.log("problem no file content", fileContent);
  }

  const result = await handleUploadedFileContent(
    filePath,
    fileName,
    fileContent ?? "",
    supabase,
    {
      fileUrl: file.path,
      type: options.type,
    },
  );

  console.log("upload file result", result);

  return result;
}
const filesRouter = router({
  handleGCloudUploadedFile: protectedProcedure
    .input(
      z.object({
        filePath: z.string(),
        commonFileUuid: z.string(),
        locale: z.string(),
        mime: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const storage = new Storage();
      const file = storage.bucket(BUCKET_NAME).file(input.filePath);
      const response = await file.download();

      const { completePromise, firstChunkPromise } = handleGCPDownloadedFile(
        response,
        {
          supabase: ctx.supabase,
          userId: ctx.user.id,
          commonFileUuid: input.commonFileUuid,
          locale: input.locale,
          mime: input.mime,
          transcribe: true,
          filePath: input.filePath,
        },
      );

      waitUntil(completePromise);

      await firstChunkPromise;

      return {
        transcription: true,
        status: "transcription started",
        ...input,
      };
    }),

  createUploadSignedURL: protectedProcedure
    .input(
      z.object({
        contentType: z.string(),
        objectName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Initialize Google Cloud Storage client
      const storage = new Storage({
        projectId: GOOGLE_PROJECT_ID,
        keyFilename:
          process.env.NODE_ENV === "production"
            ? undefined
            : path.join(
                "/Users/vojtatranta/.config/gcloud/application_default_credentials.json",
              ),
      });

      const { objectName, contentType } = input;

      try {
        const bucket = storage.bucket(BUCKET_NAME);
        const blob = bucket.file(objectName);

        // Generate signed URL
        const [signedUrl] = await blob.getSignedUrl({
          version: "v4",
          action: "write", // 'GET' for download, 'PUT' for upload
          expires: Date.now() + 15 * 60 * 1000, // URL valid for 10 minutes
          contentType,
        });

        return {
          signedUrl,
          bucketName: BUCKET_NAME,
          objectName,
          path: objectName,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error generating signed URL: ${error}`,
        });
      }
    }),

  getCompletedTranscription: protectedProcedure
    .input(
      z.object({
        commonFileUuid: z.string(),
        locale: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: chunks, error } = await ctx.supabase
        .from("file_chunks")
        .select("id, text, cloud_path")
        .eq("common_file_uuid", input.commonFileUuid)
        .order("order", { ascending: true });

      if (!chunks || error || !chunks.length) {
        const { data: documents } = await ctx.supabase
          .from("documents")
          .select("id, chunk")
          .eq("common_file_uuid", input.commonFileUuid)
          .order("id", { ascending: true });

        return {
          finished: (documents?.length ?? 0) > 0,
          text: documents?.map(({ chunk }) => chunk).join("") ?? "",
          allChunksCount: 0,
          remainingChunksCount: 0,
          commonFileUuid: input.commonFileUuid,
        };
      }

      const nullishTranscription = chunks.filter(
        (chunk) => chunk.text === null,
      );
      const allChunksCount = chunks.length;
      const remainingChunksCount = nullishTranscription.length;

      if (remainingChunksCount > 0) {
        return {
          finished: false,
          text: "",
          allChunksCount,
          remainingChunksCount,
          commonFileUuid: input.commonFileUuid,
        };
      }

      waitUntil(
        handleCompleteAudio(input.commonFileUuid, {
          supabase: ctx.supabase,
          userId: ctx.user.id,
          cloudFilePath: chunks[0]?.cloud_path ?? null,
          locale: input.locale,
        }),
      );

      return {
        finished: true,
        text: chunks.map((chunk) => chunk.text).join(""),
        allChunksCount,
        commonFileUuid: input.commonFileUuid,
        remainingChunksCount,
      };
    }),

  saveFileChunk: protectedProcedure
    .input(
      z.object({
        chunkBase64: z.string(),
        commonFileUuid: z.string(),
        mime: z.string(),
        transcribe: z.boolean().optional().default(false),
        locale: z.string().optional(),
        order: z.number().optional(),
        final: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("file_chunks")
        .insert({
          user_id: ctx.user.id,
          base64: input.chunkBase64,
          common_file_uuid: input.commonFileUuid,
          mime: input.mime,
          order: input.order ?? null,
        })
        .select(`id, mime, common_file_uuid, order`)
        .single();

      if (!data || error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error saving file chunk: ${error?.message}`,
        });
      }

      if (input.transcribe) {
        waitUntil(
          transcribeAudio(data.id, ctx.user.id, {
            supabase: ctx.supabase,
            locale: input.locale,
            createFileOnEnd: input.final,
            commonFileUuid: input.commonFileUuid,
          }),
        );
      }

      return data;
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
        {
          type: "text",
        },
      );
    }),

  deleteFile: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { error: documentError } = await ctx.supabase
        .from("documents")
        .delete()
        .eq("file", input.id)
        .eq("user_id", ctx.user.id);

      const { data: file, error } = await ctx.supabase
        .from("files")
        .delete()
        .eq("id", input.id)
        .eq("user_id", ctx.user.id)
        .select("*");

      if (error || documentError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error?.message || documentError?.message,
        });
      }

      return file;
    }),

  listFiles: protectedProcedure.query(async ({ ctx }) => {
    const { data: files } = await ctx.supabase
      .from("files")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false });

    return files;
  }),
});

const speechToTextRouter = router({
  completeAudioProcess: protectedProcedure
    .input(
      z.object({
        commonFileUuid: z.string(),
        locale: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data: file } = await ctx.supabase
        .from("files")
        .select("id")
        .eq("common_file_uuid", input.commonFileUuid)
        .single();

      if (file) {
        return {
          addedFile: file,
          documents: [],
        };
      }

      return handleCompleteAudio(input.commonFileUuid, {
        supabase: ctx.supabase,
        userId: ctx.user.id,
        locale: input.locale,
      });
    }),
});

// Create the root router
export const appRouter = router({
  subscription: subscriptionRouter,
  langtail: langtailRouter,
  filesRouter,
  speechToText: speechToTextRouter,
});

// Export type router type signature
export type AppRouter = typeof appRouter;
