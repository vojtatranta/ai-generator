import createMiddleware from "next-intl/middleware";
import { routing } from "../../src/i18n/routing";
import { SUPPORTED_LANGUAGES } from "@/constants/data";

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", `/(${SUPPORTED_LANGUAGES.join("|")})/:path*`],
};
