import { getQuizResultLink } from "@/lib/public-links";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request, response: Response) {
  const url = new URL(request.url);
  const resultId = url.searchParams.get("resultId");

  if (!resultId) {
    return new NextResponse("not found", { status: 404 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: result, error } = await supabase
    .from("quiz_results")
    .select("*")
    .eq("id", resultId)
    .single();

  if (!result || error) {
    return new NextResponse("not found", { status: 404 });
  }

  const actualRedirectUrl = new URL(url.origin);
  actualRedirectUrl.pathname = `/answer/${result.quiz_uuid}/result/${result.uuid}`;
  return NextResponse.redirect(actualRedirectUrl.toString());
}
