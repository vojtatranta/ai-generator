import { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/web/components/ui/button";
import { cn } from "@/web/lib/utils";
import { getTranslations } from "next-intl/server";
import { Icons } from "@/components/icons";
import { getBaseAppLink } from "@/lib/private-links";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
};

export default async function SignInViewPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations();

  return (
    <div className="relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href={getBaseAppLink()}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute right-4 top-4 hidden md:right-8 md:top-8",
        )}
      >
        {t("auth.login")}
      </Link>
      <div className="relative hidden h-full flex-col bg-muted p-10 pb-4 text-white lg:flex dark:border-r">
        <div
          className="absolute inset-0 bg-zinc-900"
          style={{
            backgroundImage: `url('/backg.webp')`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
        />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Icons.atom className="mr-2 h-6 w-6" />
          {t("auth.logo")}
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">{t("auth.tagline")}</p>
            {/* <footer className="text-sm">
              {t("auth.founder.name")}
              <div className="text-xs">{t("auth.founder.title")}</div>
            </footer> */}
          </blockquote>
        </div>
      </div>
      <div className="flex h-full items-center p-4 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("auth.createAccount.title")}
            </h1>
            {/* <p className="text-sm text-muted-foreground">
              {t("auth.createAccount.description")}
            </p> */}
          </div>
          {children}
          <p className="px-8 text-center text-sm text-muted-foreground">
            {t.rich("auth.terms.agreement")}
          </p>
        </div>
      </div>
    </div>
  );
}
