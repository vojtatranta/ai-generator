import { getUser } from "@/lib/supabase-server";
import { getLocale } from "next-intl/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await getUser();
  const body = await request.json();
  const locale = await getLocale();

  if (!user) {
    return new NextResponse("Not authenticated", { status: 400 });
  }

  return fetch(
    "https://api.langtail.com/vojta-workspace-azxTHt/ai-generator/social-media-post-ideas-assistant/production",
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
}
