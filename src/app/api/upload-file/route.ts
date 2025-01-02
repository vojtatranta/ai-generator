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

export async function POST(request: Request) {
  const user = await getUser();
  const body = await request.json();
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();

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

  if (!body.data?.file) {
    return new NextResponse(
      JSON.stringify({
        error: "Missing file",
        message: "Missing file",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const file = body.data.file;
  const chunks = [];
  let index = 0;
  let chunk = "";

  for (const char of file) {
    chunk += char;

    if (chunk.length >= 400) {
      chunks.push({
        index,
        chunk,
      });

      index += 1;
      chunk = "";
    }
  }

  if (chunk) {
    chunks.push({
      index,
      chunk,
    });
  }
}
