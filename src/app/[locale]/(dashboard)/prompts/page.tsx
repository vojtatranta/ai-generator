import { searchParamsCache } from "@/web/lib/searchparams";
import React from "react";
import PromptTemplatesListingPage from "./_components/prompt-templates-listing-page";
import { getTranslations } from "next-intl/server";
import { SearchParams } from "nuqs";

type pageProps = {
  searchParams: SearchParams;
};

export async function generateMetadata() {
  const t = await getTranslations("metadata.promptTemplates");
  return {
    title: t("promptTemplatesMetaTitle"),
  };
}

export default async function Page({ searchParams }: pageProps) {
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(await searchParams);

  return <PromptTemplatesListingPage />;
}
