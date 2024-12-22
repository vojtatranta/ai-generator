import NextAuth from "next-auth";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import i18nMiddleware, { config as i18nConfig } from "./middlewares/i18n";
import { routing } from "./i18n/routing";
import {
  createUserDefaultSubscription,
  getSurePlanStateDescriptor,
  getUserPlan,
  getUserSubscription,
} from "@/lib/stripe";
import { getSubscriptionLink } from "@/lib/private-links";
import { getLoginLink } from "@/lib/public-links";

const basePaths = ["/", "/app/login", "/app/auth"];
const locales = routing.locales;

function isPublicPath(path: string): boolean {
  // Remove leading slash for easier matching
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  // Check if path starts with locale prefix
  const hasLocalePrefix = locales.some((locale) =>
    normalizedPath.startsWith(`${locale}/`),
  );

  // If path has locale prefix, remove it before checking base paths
  const pathWithoutLocale = hasLocalePrefix
    ? normalizedPath.slice(3) // Remove locale prefix (e.g., "en/", "cs/", "sk/")
    : normalizedPath;

  return basePaths.some((publicPath) => {
    const normalizedPublicPath = publicPath.startsWith("/")
      ? publicPath.slice(1)
      : publicPath;
    return pathWithoutLocale.startsWith(normalizedPublicPath);
  });
}

export default async function authMiddleware(request: NextRequest) {
  // First apply i18n middleware
  let response = i18nMiddleware(request);

  const { hostname } = request.nextUrl;

  console.log("request.nextUrl", request.nextUrl);
  // Detekce subdomeny
  if (hostname.startsWith("app.")) {
    const rewritePath = `/app${request.nextUrl.pathname}`;
    request.nextUrl.pathname = rewritePath;
    console.log("rewritten path", rewritePath);
    return NextResponse.rewrite(request.nextUrl);
  }

  console.log("middleware RequestUrl:", request.nextUrl.toString());

  // If the path is public, just return the i18n response
  if (isPublicPath(request.nextUrl.pathname)) {
    return response;
  }

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
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If user is not authenticated and path is not public, redirect to login
  if (!user) {
    console.error(
      "User is not authenticated in middleware, going to login",
      error,
    );
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.toString());
    return NextResponse.redirect(loginUrl);
  }

  const currentPlan = await getSurePlanStateDescriptor(user.id, supabase);
  if (!currentPlan) {
    console.warn("User has no plan, creating default plan");
    await createUserDefaultSubscription(user.id, supabase);
  }

  try {
    const descriptor = await getSurePlanStateDescriptor(user.id, supabase);

    const subscriptionUrl = request.nextUrl.clone();
    if (
      (descriptor.trialExpired || descriptor.planExceeded) &&
      !subscriptionUrl.pathname.includes(getSubscriptionLink())
    ) {
      subscriptionUrl.pathname = getSubscriptionLink();
      return NextResponse.redirect(subscriptionUrl);
    }
  } catch (error) {
    console.error("Error getting sure plan state descriptor", error);
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = getLoginLink();
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.toString());
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)", `/(cs|en|sk|pl)/:path*`],
};
// https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=709743336135-vcbk30pj2t6fumb7kg1r4qr98cvhki7t.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fgoogle&code_challenge=GE3CdV-Fxr_hWQEqEIDjMxBvS0VlkkSNKT5BLaOlYtw&code_challenge_method=S256&scope=openid+profile+email
