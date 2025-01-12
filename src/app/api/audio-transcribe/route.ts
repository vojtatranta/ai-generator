import { transcribeAudio } from "@/components/api/trpc-router";
import {
  createSupabaseServerClient,
  getMaybeUser,
} from "@/lib/supabase-server";
import { getLocale } from "next-intl/server";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

export async function GET(req: NextRequest) {
  const user = await getMaybeUser();
  if (!user) {
    return new NextResponse("Not authenticated", { status: 400 });
  }

  const searchParams = req.nextUrl.searchParams;
  const chunkId = searchParams.get("chunkId");
  const locale = await getLocale();

  if (!chunkId) {
    return new NextResponse("File ID is required", { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  try {
    // Create a ReadableStream that will yield audio chunks

    return NextResponse.json(
      await transcribeAudio(Number(chunkId), user.id, {
        supabase,
        locale,
      }),
    );
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return new NextResponse(`Error transcribing audio ${error}`, {
      status: 500,
    });
  }
}
