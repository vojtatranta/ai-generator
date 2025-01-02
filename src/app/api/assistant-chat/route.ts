import { FEATURES } from "@/constants/plan";
import { Json } from "@/database.types";
import { getSureUserPlan } from "@/lib/stripe";
import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import {
  chatStreamToRunner,
  readableStreamFromSSEResponse,
} from "langtail/stream";
import { getLocale } from "next-intl/server";
import { NextResponse } from "next/server";
import { type ChatCompletion } from "openai/resources/chat/completions";
import { waitUntil } from "@vercel/functions";
import { AI_CHAT_PROMPT_SLUG } from "@/constants/data";

export async function POST(request: Request) {
  const user = await getUser();
  const body = await request.json();
  const locale = await getLocale();

  if (!user) {
    return new NextResponse("Not authenticated", { status: 400 });
  }

  const descriptorPlan = await getSureUserPlan();

  if (!descriptorPlan.features[FEATURES.AI_CHAT]) {
    return new NextResponse(
      JSON.stringify({
        error: "AI chat feature not enabled",
        message: "AI chat feature not enabled",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const result = await fetch(
      `https://api.langtail.com/vojta-workspace-azxTHt/ai-generator/${AI_CHAT_PROMPT_SLUG}/production`,
      {
        method: "POST",
        headers: {
          "X-API-Key": process.env.LANGTAIL_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...body,
          stream: true,
          user: user.id,
          variables: {
            ...(body.variables ?? {}),
            language: locale,
          },
        }),
      },
    );

    const cloneRequest = result.clone();
    waitUntil(
      createSupabaseServerClient().then(async (supabase) => {
        let resolve: null | ((value?: unknown) => void) = null;

        const completionPromise = new Promise((localResolve) => {
          resolve = localResolve;
        });

        if (!cloneRequest.ok) {
          return;
        }

        const contentType = cloneRequest.headers.get("content-type");

        if (!(contentType && contentType.includes("text/event-stream"))) {
          return;
        }

        const runner = chatStreamToRunner(
          readableStreamFromSSEResponse(cloneRequest),
        );
        const onFinalChatCompletion = async (
          finalChatCompletion: ChatCompletion,
        ) => {
          await supabase.from("ai_results").insert([
            {
              user_id: user.id,
              prompt_slug: AI_CHAT_PROMPT_SLUG,
              prompt:
                [...(body.messages ?? [])]
                  .reverse()
                  .find((message) => message.role === "user")?.content ?? "",
              ai_response_id: finalChatCompletion.id,
              ai_result: finalChatCompletion as unknown as Json,
            },
          ]);

          runner.off("finalChatCompletion", onFinalChatCompletion);
          resolve?.();
        };

        runner.on("finalChatCompletion", onFinalChatCompletion);

        return completionPromise;
      }),
    );

    return result;
  } catch (err) {
    console.error("Assistant chat api error", err);

    return new NextResponse(
      JSON.stringify({
        error: "Assistant chat api error",
        message: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
}
