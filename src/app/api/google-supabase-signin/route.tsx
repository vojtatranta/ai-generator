import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  createUserDefaultSubscription,
  getUserSubscription,
} from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const callbackUrl = searchParams.get("callbackUrl");

  if (!code) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl.toString());
  }

  const cookiesStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookiesStore.set(name, value),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  console.warn("GOGLE SUPABASE SIGNIN data", data);
  console.warn("callbackUrl", callbackUrl);

  if (!data?.user || error) {
    console.error("Error signing in with Google:", error);

    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl.toString());
  }
  const subscription = await getUserSubscription(data.user.id, supabase);
  console.warn("current user subscription", subscription);

  if (!subscription) {
    console.error("Default subscription not found");
    await createUserDefaultSubscription(data.user.id, supabase);
  }

  const redirectUrl = new URL(callbackUrl ?? "/overview", request.url);
  return NextResponse.redirect(redirectUrl.toString());
}

// https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=709743336135-vcbk30pj2t6fumb7kg1r4qr98cvhki7t.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fgoogle&code_challenge=oa-lkWVL_Yw6_vztlZOHOFU0O16jdwkkOCkKGsSbRmI&code_challenge_method=S256&scope=openid+profile+email
// https://accounts.google.com/o/oauth2/v2/auth?client_id=709743336135-vcbk30pj2t6fumb7kg1r4qr98cvhki7t.apps.googleusercontent.com&redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&redirect_uri=https%3A%2F%2Flwfmmvnhikcegzexxbiy.supabase.co%2Fauth%2Fv1%2Fcallback&response_type=code&scope=email+profile&state=eyJhbGciOiJIUzI1NiIsImtpZCI6IlJIcDRRMkViM2V1MWRlQ1MiLCJ0eXAiOiJKV1QifQ.eyJleHAiOjE3MzIwMjU0NDAsInNpdGVfdXJsIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwIiwiaWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiLCJmdW5jdGlvbl9ob29rcyI6bnVsbCwicHJvdmlkZXIiOiJnb29nbGUiLCJyZWZlcnJlciI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9hdXRoL2NhbGxiYWNrIiwiZmxvd19zdGF0ZV9pZCI6IjM5ZDlkMzAxLTM1OGEtNDhkMC05MThlLTUxZmM5NDk0Y2Q0OSJ9.xlPwrHd5ZfsN2qFa2t0piMywuz8s9G52_aLcKTYEBN4
