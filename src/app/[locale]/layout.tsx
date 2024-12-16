import { auth } from "@/auth";
import Providers from "@/web/components/layout/providers";
import { Toaster } from "@/web/components/ui/sonner";
import { NextIntlClientProvider } from "next-intl";
import NextTopLoader from "nextjs-toploader";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Poppins } from "next/font/google";
import "../globals.css";
import { getMetaTags } from "@/components/get-metatags";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const poppins = Poppins({
  subsets: ["latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const generateMetadata = getMetaTags();

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const [session, messages] = await Promise.all([auth(), getMessages()]);

  const awaitedParams = await params;
  setRequestLocale(awaitedParams.locale);

  return (
    <html
      lang={awaitedParams.locale}
      className={`${poppins.className}`}
      suppressHydrationWarning={true}
    >
      <body className={"overflow-hidden"}>
        <NuqsAdapter>
          <NextIntlClientProvider messages={messages}>
            <NextTopLoader showSpinner={false} />
            <Providers locale={awaitedParams.locale} session={session}>
              <Toaster />
              {children}
            </Providers>
          </NextIntlClientProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
